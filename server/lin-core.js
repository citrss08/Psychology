/* Lin — server-side core. Runs ONLY on the server (Vercel function in api/lin.js, or server.js locally).
   The API key (GEMINI_API_KEY or ANTHROPIC_API_KEY) is read from the environment and never sent to the browser.

   Actions (POST /api/lin, JSON body { action, ... }):
     status      → { configured, model }                         (no key needed)
     search      → course chunks matching a query                 (no key needed)
     chat        → Lin's tutoring reply, grounded in retrieved course content; may return follow-up
                   actions (generate flashcards / mock exam) that the browser then runs
     flashcards  → a deck of flashcards generated from the platform's notes
     exam        → an IB Psychology SL-style mock exam (with hidden mark scheme)
     grade       → marks, feedback, model answers and weaknesses for a submitted exam */
'use strict';
const R = require('./retrieval');
const { AsyncLocalStorage } = require('async_hooks');

/* Every request gets a hard time budget. On Vercel a function is killed after 60 s and the browser then
   receives plain text instead of JSON ("server isn't reachable"), so Lin always answers (or fails with a
   clear message) before that. Locally there is no such limit. */
const budgetStore = new AsyncLocalStorage();
const BUDGET_MS = () => Number(process.env.LIN_BUDGET_MS || (process.env.VERCEL ? 52000 : 150000));
const remainingMs = () => { const st = budgetStore.getStore(); return st ? st.deadline - Date.now() : 90000; };

/* ---------------------------------------------------------------- provider selection
   Lin works with EITHER Google Gemini OR Anthropic Claude:
     GEMINI_API_KEY=...      → Gemini   (model: GEMINI_MODEL, default gemini-2.5-flash)
     ANTHROPIC_API_KEY=...   → Claude   (model: ANTHROPIC_MODEL, default claude-sonnet-4-5)
   If both are set, LIN_PROVIDER=gemini|anthropic chooses. A Gemini key (starts with "AIza" or "AQ.")
   pasted into ANTHROPIC_API_KEY by mistake is detected and used with Gemini automatically. */
const env = k => (process.env[k] || '').trim();
function provider() {
  const forced = env('LIN_PROVIDER').toLowerCase();
  const gem = env('GEMINI_API_KEY') || env('GOOGLE_API_KEY');
  const ant = env('ANTHROPIC_API_KEY');
  const looksGoogle = k => /^(AIza|AQ\.)/.test(k); // Google keys: classic "AIza…" or newer "AQ.…"
  if (forced === 'gemini' && (gem || looksGoogle(ant))) return { name: 'gemini', key: gem || ant };
  if (forced === 'anthropic' && ant && !looksGoogle(ant)) return { name: 'anthropic', key: ant };
  if (gem) return { name: 'gemini', key: gem };
  if (looksGoogle(ant)) return { name: 'gemini', key: ant };
  if (ant) return { name: 'anthropic', key: ant };
  return null;
}
let autoGeminiModel = null; // discovered from Google's model list when the default isn't available
function model() {
  const p = provider();
  return p && p.name === 'gemini' ? (env('GEMINI_MODEL') || autoGeminiModel || 'gemini-2.5-flash') : (env('ANTHROPIC_MODEL') || 'claude-sonnet-4-5');
}
const UNITS = R.UNITS;
const UNIT_LIST = UNITS.map(u => `${u} (${R.UNIT_NAMES[u]})`).join(', ');

class LinError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

/* ---------------------------------------------------------------- model call
   Every caller uses Anthropic's message format ({system, messages, tools, toolChoice} in,
   {content:[text|tool_use blocks], stop_reason} out). For Gemini the request and response are
   translated, so tutoring, flashcards, exams and grading behave identically on both providers. */
async function callClaude(opts) {
  const p = provider();
  if (!p) throw new LinError(503, 'Lin is not configured yet: put your API key in GEMINI_API_KEY (Google Gemini) or ANTHROPIC_API_KEY (Claude) in your .env file (local) or your hosting provider\'s environment variables, then restart the server.');
  return p.name === 'gemini' ? callGemini(opts, p.key) : callAnthropic(opts, p.key);
}

async function postJSON(url, headers, body, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1000, timeoutMs || Number(process.env.LIN_TIMEOUT_MS || 90000)));
  let res;
  try {
    res = await fetch(url, { method: 'POST', signal: controller.signal, headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
  } catch (err) {
    throw new LinError(504, err.name === 'AbortError' ? 'The AI service took too long to respond. Please try again.' : 'Could not reach the AI service. Check your internet connection and try again.');
  } finally { clearTimeout(timer); }
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function callAnthropic({ system, messages, tools, toolChoice, maxTokens = 1500, temperature }, key) {
  const url = (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/$/, '') + '/v1/messages';
  const body = { model: model(), max_tokens: maxTokens, system, messages };
  if (tools) body.tools = tools;
  if (toolChoice) body.tool_choice = toolChoice;
  if (temperature !== undefined) body.temperature = temperature;
  const { res, data } = await postJSON(url, { 'x-api-key': key, 'anthropic-version': '2023-06-01' }, body, Math.max(4000, remainingMs() - 1500));
  if (!res.ok) {
    const detail = data?.error?.message || res.statusText;
    if (res.status === 401) throw new LinError(502, 'The Anthropic API key was rejected. Check ANTHROPIC_API_KEY in your environment.');
    if (res.status === 404 && /model/i.test(detail)) throw new LinError(502, `The model "${model()}" is not available to this API key. Set ANTHROPIC_MODEL to a model your account can use.`);
    if (res.status === 429) throw new LinError(429, 'Lin is receiving too many requests right now. Wait a moment and try again.');
    if (res.status === 529 || res.status >= 500) throw new LinError(503, 'The AI service is temporarily overloaded. Please try again shortly.');
    throw new LinError(502, `AI request failed: ${detail}`);
  }
  return data;
}

/** Models this key can call for text, best first: newest stable "flash" (fast + cheap), then pro, then others. */
async function listGeminiModels(base, key) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(`${base}/v1beta/models?pageSize=200`, { headers: { 'x-goog-api-key': key }, signal: controller.signal });
    if (!res.ok) return [];
    const data = await res.json();
    const names = (data.models || [])
      .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map(m => String(m.name || '').replace(/^models\//, ''))
      .filter(n => n.startsWith('gemini') && !/(image|tts|audio|live|embedding|vision|robotics|computer-use|native)/.test(n));
    const version = n => parseFloat((n.match(/gemini-(\d+(?:\.\d+)?)/) || [])[1] || 0);
    const rank = n => (/flash/.test(n) ? 2 : /pro/.test(n) ? 1 : 0) * 100 + version(n) * 10 - (/(preview|exp)/.test(n) ? 8 : 0) - (/lite/.test(n) ? 3 : 0);
    return names.sort((a, b) => rank(b) - rank(a));
  } catch { return []; } finally { clearTimeout(timer); }
}

// Models that just failed (overloaded, timed out…) are skipped for a few minutes so Lin stays fast.
const badModels = new Map();
const markBad = name => badModels.set(name, Date.now() + 3 * 60 * 1000);
let modelListCache = { at: 0, names: [] };
async function geminiOrder(base, key) {
  const forced = env('GEMINI_MODEL');
  if (forced) return [forced];
  if (!modelListCache.names.length || Date.now() - modelListCache.at > 10 * 60 * 1000) {
    const names = await listGeminiModels(base, key);
    if (names.length) modelListCache = { at: Date.now(), names };
  }
  const names = modelListCache.names.length ? modelListCache.names : ['gemini-2.5-flash', 'gemini-2.0-flash'];
  const isBad = n => (badModels.get(n) || 0) > Date.now();
  const ordered = [...names.filter(n => !isBad(n)), ...names.filter(isBad)];
  if (autoGeminiModel && !isBad(autoGeminiModel)) ordered.unshift(autoGeminiModel);
  return [...new Set(ordered)];
}

// Gemini's function-declaration schema uses upper-case OpenAPI types and a subset of keywords.
function toGeminiSchema(schema) {
  if (!schema || typeof schema !== 'object') return schema;
  const out = {};
  for (const [k, v] of Object.entries(schema)) {
    if (k === 'type') out.type = String(v).toUpperCase();
    else if (k === 'properties') out.properties = Object.fromEntries(Object.entries(v).map(([pk, pv]) => [pk, toGeminiSchema(pv)]));
    else if (k === 'items') out.items = toGeminiSchema(v);
    else if (['description', 'enum', 'required', 'minimum', 'maximum', 'nullable', 'format'].includes(k)) out[k] = v;
  }
  return out;
}

async function callGemini(opts, key) {
  const { system, messages, tools, toolChoice, maxTokens = 1500, temperature } = opts;
  const base = (process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com').replace(/\/$/, '');
  const toolNames = {}; // tool_use_id → function name (Gemini answers functions by name)
  const contents = messages.map(m => {
    const role = m.role === 'assistant' ? 'model' : 'user';
    if (typeof m.content === 'string') return { role, parts: [{ text: m.content }] };
    const parts = [];
    for (const b of m.content) {
      if (b.type === 'text' && b.text) parts.push({ text: b.text });
      else if (b.type === 'tool_use') { toolNames[b.id] = b.name; parts.push(b._geminiPart || { functionCall: { name: b.name, args: b.input || {} } }); }
      else if (b.type === 'tool_result') parts.push({ functionResponse: { name: toolNames[b.tool_use_id] || 'tool', response: { content: typeof b.content === 'string' ? b.content : JSON.stringify(b.content) } } });
    }
    return { role, parts: parts.length ? parts : [{ text: '' }] };
  });
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents,
    // Gemini 2.5 models count their internal "thinking" against the output limit, so allow headroom.
    generationConfig: { maxOutputTokens: Math.min(65536, Math.max(8192, maxTokens * 4)), ...(temperature !== undefined ? { temperature } : {}) }
  };
  if (tools) body.tools = [{ functionDeclarations: tools.map(t => ({ name: t.name, description: t.description, parameters: toGeminiSchema(t.input_schema) })) }];
  if (toolChoice && toolChoice.type === 'tool') body.toolConfig = { functionCallingConfig: { mode: 'ANY', allowedFunctionNames: [toolChoice.name] } };

  // Try the best available model; if it is overloaded / slow / missing, move on to the next one.
  const order = (await geminiOrder(base, key)).slice(0, 4);
  let res = null, data = null, lastStatus = 0, lastDetail = '', timedOut = false;
  for (let i = 0; i < order.length; i++) {
    const name = order[i];
    const left = remainingMs() - 1500;
    if (left < 4000) { timedOut = true; break; }
    const isLast = i === order.length - 1;
    const timeout = isLast ? left : Math.min(left, Math.max(12000, left * 0.7));
    let r;
    try {
      r = await postJSON(`${base}/v1beta/models/${encodeURIComponent(name)}:generateContent`, { 'x-goog-api-key': key }, body, timeout);
    } catch (err) { timedOut = true; markBad(name); console.warn(`[lin] model ${name}: no answer within ${Math.round(timeout / 1000)}s`); continue; }
    if (r.res.ok) { res = r.res; data = r.data; autoGeminiModel = name; break; }
    lastStatus = r.res.status; lastDetail = r.data?.error?.message || r.res.statusText;
    console.warn(`[lin] model ${name} failed: ${lastStatus} ${lastDetail}`);
    if (lastStatus !== 404 && lastStatus !== 429 && lastStatus < 500) { res = r.res; data = r.data; break; } // key/request problem, not the model
    markBad(name);
  }
  if (!res) {
    if (lastStatus === 429) throw new LinError(429, 'Your Gemini quota or rate limit was reached. Wait a moment (or check your quota in Google AI Studio) and try again.');
    if (lastStatus === 404 && !timedOut) throw new LinError(502, `None of the Gemini models are available to this key (${lastDetail}). Set GEMINI_MODEL to a model listed in Google AI Studio.`);
    if (lastStatus >= 500) throw new LinError(503, `Google's Gemini is overloaded or having problems right now (${lastStatus}: ${lastDetail}). Please try again in a minute.`);
    throw new LinError(504, 'Gemini took too long to answer (it is probably busy). Please try again in a moment.');
  }
  if (!res.ok) {
    const detail = data?.error?.message || res.statusText;
    if (/API key not valid|API_KEY_INVALID/i.test(detail) || res.status === 401) throw new LinError(502, 'The Gemini API key was rejected. Check GEMINI_API_KEY in your environment.');
    if (res.status === 403) throw new LinError(502, `Gemini refused the request (permission): ${detail}`);
    throw new LinError(502, `AI request failed: ${detail}`);
  }
  const cand = (data.candidates || [])[0];
  if (!cand) {
    const why = data.promptFeedback?.blockReason;
    throw new LinError(502, why ? `Gemini declined to answer (${why}). Try rephrasing.` : 'Gemini returned no answer. Please try again.');
  }
  const content = [];
  for (const part of cand.content?.parts || []) {
    if (part.thought) continue;
    if (part.functionCall) content.push({ type: 'tool_use', id: `gm_${content.length}_${Date.now().toString(36)}`, name: part.functionCall.name, input: part.functionCall.args || {}, _geminiPart: part });
    else if (typeof part.text === 'string' && part.text) content.push({ type: 'text', text: part.text });
  }
  const hasCall = content.some(b => b.type === 'tool_use');
  return { content, stop_reason: hasCall ? 'tool_use' : cand.finishReason === 'MAX_TOKENS' ? 'max_tokens' : 'end_turn' };
}

/** Force the model to answer through one tool and return that tool's validated input. */
async function callForJSON({ system, prompt, tool, maxTokens }) {
  const data = await callClaude({
    system, maxTokens, tools: [tool], toolChoice: { type: 'tool', name: tool.name },
    messages: [{ role: 'user', content: prompt }]
  });
  const use = (data.content || []).find(b => b.type === 'tool_use' && b.name === tool.name);
  if (!use || typeof use.input !== 'object') throw new LinError(502, 'Lin returned an unexpected response. Please try again.');
  if (data.stop_reason === 'max_tokens') throw new LinError(502, 'The response was too long and got cut off. Try asking for fewer items.');
  return use.input;
}

/* ---------------------------------------------------------------- helpers */
const str = (v, max = 4000) => (typeof v === 'string' ? v : v == null ? '' : String(v)).slice(0, max);
const clampInt = (v, lo, hi, dflt) => { const n = parseInt(v, 10); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt; };
const validUnit = u => (UNITS.includes(u) ? u : null);
const uid = p => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

function contextLine(ctx = {}) {
  const parts = [];
  if (validUnit(ctx.unit)) parts.push(`Unit open on screen: ${R.UNIT_NAMES[ctx.unit]}`);
  if (ctx.tab) parts.push(`Tab: ${str(ctx.tab, 30)}`);
  if (ctx.topic) parts.push(`Topic the student is looking at: "${str(ctx.topic, 160)}"`);
  return parts.join(' · ');
}

const PERSONA = `You are Lin, the built-in AI tutor of an IB Psychology SL (first assessment 2027) digital notebook.
The notebook has five units: ${UNIT_LIST}. SL assessment: Paper 1 (35 marks: Section A short answers, Section B application to unseen situations, Section C concept-based extended response), Paper 2 (35 marks: class practicals; evaluating an unseen study with reference to concepts) and the internal research proposal. Paper 3 is HL only.
The six concepts are bias, causality, change, measurement, perspective and responsibility.

Grounding rules — these matter most:
- The COURSE MATERIAL blocks come from the student's own notebook. Base your answers on them first and use their terminology.
- Name the notebook topic(s) you used, e.g. (Notes: "Operant conditioning"). Use the material's id only internally; never show ids like topic:health:x.
- If you add something that is not in the notebook (for example a named study's details), label it clearly as "Beyond your notes" and keep it accurate and cautious. Never invent study findings, dates or statistics.
- If the notebook does not cover something, say so, then help briefly.
Style: British spelling, warm and encouraging, concise. Use short paragraphs, bullet points and **bold** key terms. Use IB command terms correctly (define, describe, explain, evaluate, discuss, compare and contrast).`;

/* ---------------------------------------------------------------- chat */
const CHAT_TOOLS = [
  { name: 'search_course_content',
    description: 'Search the student\'s psychology notebook (notes, key terms, research-study references, practice questions). Use it whenever the provided COURSE MATERIAL is not enough, e.g. for comparisons across units.',
    input_schema: { type: 'object', properties: {
      query: { type: 'string', description: 'What to look for' },
      unit: { type: 'string', enum: UNITS, description: 'Optional: restrict to one unit' } }, required: ['query'] } },
  { name: 'create_flashcards',
    description: 'Generate flashcards from the notebook and save them to the student\'s flashcard repository. Call this whenever the student asks for flashcards or revision cards.',
    input_schema: { type: 'object', properties: {
      topic: { type: 'string', description: 'Topic or concept the cards should cover, using notebook wording' },
      unit: { type: 'string', enum: UNITS },
      count: { type: 'integer', minimum: 3, maximum: 20, description: 'Number of cards (default 8)' },
      focus: { type: 'string', description: 'Optional: definitions, studies, evaluation, application…' } }, required: ['topic'] } },
  { name: 'create_mock_exam',
    description: 'Generate an interactive IB Psychology SL mock exam from the notebook. Call this whenever the student asks for a mock exam, test or practice paper.',
    input_schema: { type: 'object', properties: {
      topic: { type: 'string', description: 'Optional focus topic; omit to cover whole units' },
      units: { type: 'array', items: { type: 'string', enum: UNITS } },
      style: { type: 'string', enum: ['quick', 'paper1', 'paper2'], description: 'quick = knowledge check (MCQ + short answers); paper1 = Paper 1 style; paper2 = Paper 2 style' },
      question_count: { type: 'integer', minimum: 2, maximum: 10 } }, required: [] } }
];

async function chat(body) {
  const ctx = body.context || {};
  const history = Array.isArray(body.messages) ? body.messages.slice(-16) : [];
  const messages = history
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map(m => ({ role: m.role, content: str(m.content, 6000) }));
  while (messages.length && messages[0].role !== 'user') messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== 'user') throw new LinError(400, 'Send a message for Lin to answer.');
  // Merge consecutive same-role turns (the API requires alternation).
  const merged = [];
  for (const m of messages) {
    if (merged.length && merged[merged.length - 1].role === m.role) merged[merged.length - 1].content += '\n\n' + m.content;
    else merged.push({ ...m });
  }
  const question = merged[merged.length - 1].content;
  const preferUnit = validUnit(ctx.unit);

  // Retrieval before generation: the question, plus the topic on screen and the previous user turn.
  const onScreen = ctx.topic ? R.findTopicByTitle(ctx.topic, preferUnit) : null;
  const prevUser = merged.length > 2 ? merged[merged.length - 3].content : '';
  const retrieved = R.mergeResults(
    onScreen && /\b(this|it|that|here|topic|page|section)\b/i.test(question) ? [onScreen] : [],
    R.search(question, { preferUnit, limit: 8 }),
    R.search(`${question} ${prevUser}`.slice(0, 800), { preferUnit, limit: 4 }),
    onScreen ? [onScreen] : []
  ).slice(0, 10);

  const progress = body.progress || {};
  const weak = (Array.isArray(progress.weaknesses) ? progress.weaknesses : []).slice(0, 6)
    .map(w => `- ${str(w.topic, 120)}: ${str(w.issue, 200)}`).join('\n');
  const decks = (Array.isArray(progress.decks) ? progress.decks : []).slice(0, 20).map(d => str(d, 80)).join('; ');

  const system = `${PERSONA}

Tools: use search_course_content for extra notebook material; use create_flashcards when asked for flashcards; use create_mock_exam when asked for a mock exam/test. After calling create_flashcards or create_mock_exam, briefly tell the student what is being prepared and where to find it (the Study Lab section: Flashcards or Mock exams tab). Do not write the flashcards or exam questions out in chat yourself.
${contextLine(ctx) ? `\nSTUDENT'S SCREEN: ${contextLine(ctx)}` : ''}${weak ? `\nWEAK AREAS FROM RECENT MOCK EXAMS:\n${weak}` : ''}${decks ? `\nEXISTING FLASHCARD DECKS: ${decks}` : ''}

COURSE MATERIAL (retrieved from the notebook for this question):
${R.formatForPrompt(retrieved, 12000) || '(no closely matching notebook material found)'}`;

  const actions = [];
  const sources = new Map(retrieved.slice(0, 6).map(c => [c.id, c]));
  const convo = merged.slice();
  let text = '';
  for (let turn = 0; turn < 4; turn++) {
    const data = await callClaude({ system, messages: convo, tools: CHAT_TOOLS, maxTokens: 1600 });
    const blocks = data.content || [];
    const turnText = blocks.filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
    if (turnText) text += (text ? '\n\n' : '') + turnText;
    const uses = blocks.filter(b => b.type === 'tool_use');
    if (data.stop_reason !== 'tool_use' || !uses.length) break;
    convo.push({ role: 'assistant', content: blocks });
    const results = uses.map(u => {
      const input = u.input || {};
      let content;
      if (u.name === 'search_course_content') {
        const found = R.search(str(input.query, 300), { unit: validUnit(input.unit) || undefined, limit: 6 });
        found.forEach(c => sources.set(c.id, c));
        content = R.formatForPrompt(found, 7000) || 'No matching notebook material.';
      } else if (u.name === 'create_flashcards') {
        actions.push({ type: 'flashcards', params: {
          topic: str(input.topic, 200), unit: validUnit(input.unit) || preferUnit,
          count: clampInt(input.count, 3, 20, 8), focus: str(input.focus, 200) } });
        content = 'Queued. The app is generating these flashcards now and will save them automatically to the Flashcards tab of the Study Lab.';
      } else if (u.name === 'create_mock_exam') {
        const units = (Array.isArray(input.units) ? input.units : []).filter(validUnit);
        actions.push({ type: 'exam', params: {
          topic: str(input.topic, 200), units: units.length ? units : (preferUnit ? [preferUnit] : []),
          style: ['quick', 'paper1', 'paper2'].includes(input.style) ? input.style : 'quick',
          count: clampInt(input.question_count, 2, 10, 5) } });
        content = 'Queued. The app is generating the mock exam now; the student will take it in the Mock exams tab of the Study Lab, where it will be graded.';
      } else content = 'Unknown tool.';
      return { type: 'tool_result', tool_use_id: u.id, content };
    });
    convo.push({ role: 'user', content: results });
  }
  if (!text) text = actions.length ? 'On it — I\'m preparing that for you in the Study Lab.' : 'Sorry, I could not produce an answer. Please try rephrasing.';
  return {
    reply: text,
    actions,
    sources: [...sources.values()].filter(c => c.type !== 'quiz').slice(0, 6)
      .map(c => ({ id: c.id, title: c.title, unit: c.unit, unitName: c.unitName, type: c.type }))
  };
}

/* ---------------------------------------------------------------- flashcards */
const FLASHCARD_TOOL = {
  name: 'save_flashcards',
  description: 'Save the generated flashcards.',
  input_schema: { type: 'object', properties: {
    deck_title: { type: 'string', description: 'Short topic name for the deck, e.g. "Operant conditioning"' },
    unit: { type: 'string', enum: UNITS },
    cards: { type: 'array', items: { type: 'object', properties: {
      front: { type: 'string', description: 'Question or prompt (one idea per card)' },
      back: { type: 'string', description: 'Concise answer, 1–3 sentences, in notebook wording' },
      source_topic: { type: 'string', description: 'Exact title of the notebook topic/term the card comes from' },
      kind: { type: 'string', enum: ['definition', 'explanation', 'study', 'evaluation', 'application', 'comparison'] }
    }, required: ['front', 'back', 'source_topic', 'kind'] } }
  }, required: ['deck_title', 'unit', 'cards'] }
};

async function flashcards(body) {
  const topic = str(body.topic, 200).trim();
  const unit = validUnit(body.unit);
  if (!topic && !unit) throw new LinError(400, 'Tell Lin which topic or unit the flashcards should cover.');
  const count = clampInt(body.count, 3, 20, 8);
  const focus = str(body.focus, 200);
  const existing = (Array.isArray(body.existing) ? body.existing : []).slice(0, 60).map(f => `- ${str(f, 160)}`).join('\n');
  const query = topic || R.UNIT_NAMES[unit];
  let material = R.search(query, { unit: unit || undefined, limit: 10 });
  if (material.length < 4 && unit) material = R.mergeResults(material, R.unitTopics([unit]).slice(0, 8));
  if (!material.length) material = R.search(query, { limit: 10 });
  if (!material.length) throw new LinError(404, `Lin couldn't find "${topic}" in the notebook. Try a topic name from the notes or glossary.`);

  const input = await callForJSON({
    system: `${PERSONA}\nYou write high-quality active-recall flashcards for IB Psychology SL students.`,
    tool: FLASHCARD_TOOL, maxTokens: 4000,
    prompt: `Create exactly ${count} flashcards about: "${query}"${focus ? ` (focus: ${focus})` : ''}.

Rules:
- Use ONLY the notebook material below; every card's source_topic must be one of the material titles.
- Mix kinds: definitions of key terms, explanations, how research is used, evaluation points and application to a short scenario.
- One idea per card. Fronts are questions; backs are precise, exam-ready answers (max ~60 words).
${existing ? `- Do NOT repeat these existing cards:\n${existing}\n` : ''}
NOTEBOOK MATERIAL:
${R.formatForPrompt(material, 12000)}`
  });
  const deckUnit = validUnit(input.unit) || unit || material[0].unit;
  const deck = str(input.deck_title, 80).trim() || topic || R.UNIT_NAMES[deckUnit];
  const cards = (Array.isArray(input.cards) ? input.cards : [])
    .filter(c => c && str(c.front).trim() && str(c.back).trim()).slice(0, count)
    .map(c => ({ id: uid('fc'), deck, unit: deckUnit, front: str(c.front, 400).trim(), back: str(c.back, 800).trim(),
      sourceTopic: str(c.source_topic, 160), kind: str(c.kind, 20) || 'explanation', origin: 'lin' }));
  if (!cards.length) throw new LinError(502, 'Lin did not return any usable flashcards. Please try again.');
  return { deck, unit: deckUnit, cards, sources: material.slice(0, 6).map(c => ({ id: c.id, title: c.title, unitName: c.unitName })) };
}

/* ---------------------------------------------------------------- mock exam */
const EXAM_TOOL = {
  name: 'save_exam',
  description: 'Save the mock exam.',
  input_schema: { type: 'object', properties: {
    title: { type: 'string' },
    instructions: { type: 'string' },
    questions: { type: 'array', items: { type: 'object', properties: {
      type: { type: 'string', enum: ['mcq', 'short', 'application', 'extended', 'evaluation'] },
      section: { type: 'string', description: 'e.g. "Paper 1 · Section A"' },
      command_term: { type: 'string', description: 'IB command term, e.g. Describe, Explain, Evaluate' },
      stimulus: { type: 'string', description: 'Scenario or unseen study text for application/evaluation questions; empty otherwise' },
      prompt: { type: 'string', description: 'The question itself' },
      marks: { type: 'integer', minimum: 1, maximum: 15 },
      options: { type: 'array', items: { type: 'string' }, description: 'MCQ only: 4 options' },
      correct_option: { type: 'integer', description: 'MCQ only: index of the correct option (0-3)' },
      topic: { type: 'string', description: 'Exact notebook topic title the question tests' },
      unit: { type: 'string', enum: UNITS },
      markscheme: { type: 'array', items: { type: 'string' }, description: 'Creditworthy points / markband descriptors' }
    }, required: ['type', 'prompt', 'marks', 'topic', 'unit', 'markscheme'] } }
  }, required: ['title', 'questions'] }
};

const STYLE_GUIDE = {
  quick: count => `A quick knowledge check with ${count} questions: about half multiple-choice (1 mark, 4 options, exactly one correct) and the rest short-answer "Define/Describe/Outline/Explain" questions worth 2–4 marks.`,
  paper1: count => `A Paper 1-style mock with ${count} questions (no MCQ). Include: Section A short-answer content questions (4–6 marks, e.g. "Describe…"/"Explain…"); Section B application questions that give a short unseen scenario as stimulus and ask the student to apply notebook content (6–8 marks); and, if there are 3+ questions, one Section C concept-based extended response (10–15 marks) asking the student to discuss/evaluate with reference to one of the six concepts.`,
  paper2: count => `A Paper 2-style mock with ${count} questions (no MCQ). Include Section A questions about research methods / class-practical design (operationalisation, sampling, ethics, data — 2–6 marks each) and a Section B question that presents a short UNSEEN study summary as stimulus (aim, method, participants, results) and asks the student to evaluate it with reference to two or more concepts (10–15 marks). Invent the unseen study as clearly fictional; base the other questions on the notebook.`
};

async function exam(body) {
  const style = ['quick', 'paper1', 'paper2'].includes(body.style) ? body.style : 'quick';
  const count = clampInt(body.count, 2, 10, style === 'quick' ? 6 : 4);
  const units = (Array.isArray(body.units) ? body.units : []).filter(validUnit);
  const topic = str(body.topic, 200).trim();
  const weaknesses = (Array.isArray(body.weaknesses) ? body.weaknesses : []).slice(0, 5).map(w => str(w, 200));
  if (!topic && !units.length) throw new LinError(400, 'Choose at least one unit or type a topic for the mock exam.');

  let material = [];
  if (topic) material = R.search(topic, { limit: 10, preferUnit: units[0] }).filter(c => !units.length || units.includes(c.unit) || c.score > 8);
  if (units.length) {
    const all = R.unitTopics(units);
    // spread coverage across the selected units
    const spread = [];
    for (let i = 0; spread.length < 18 && i < 40; i++) for (const u of units) { const t = all.filter(c => c.unit === u)[i]; if (t) spread.push(t); }
    material = R.mergeResults(material, spread);
  }
  if (style === 'paper2') material = R.mergeResults(material, R.unitTopics(['investigations']).slice(0, 6));
  if (!material.length) throw new LinError(404, `Lin couldn't find notebook material for "${topic}". Try another topic.`);

  const input = await callForJSON({
    system: `${PERSONA}\nYou are an experienced IB Psychology examiner writing realistic SL mock assessments.`,
    tool: EXAM_TOOL, maxTokens: 7000,
    prompt: `Write ${STYLE_GUIDE[style](count)}
Focus: ${topic ? `"${topic}"` : 'the selected units'}${units.length ? ` · Units: ${units.map(u => R.UNIT_NAMES[u]).join(', ')}` : ''}.
${weaknesses.length ? `The student was recently weak on: ${weaknesses.join('; ')}. Include at least one question targeting this if relevant.\n` : ''}
Rules:
- Test the actual concepts, terms and studies in the notebook material below; set "topic" to the exact material title used.
- Use IB command terms and realistic mark allocations; every written question needs a mark scheme of specific creditworthy points (and, for 10+ mark questions, brief markband descriptors).
- Vary the topics; do not ask two questions on the same point.

NOTEBOOK MATERIAL:
${R.formatForPrompt(material, 16000)}`
  });
  const questions = (Array.isArray(input.questions) ? input.questions : []).slice(0, count).map((q, i) => {
    const type = ['mcq', 'short', 'application', 'extended', 'evaluation'].includes(q.type) ? q.type : 'short';
    const out = { id: `q${i + 1}`, type, section: str(q.section, 60), commandTerm: str(q.command_term, 30),
      stimulus: str(q.stimulus, 3000), prompt: str(q.prompt, 1200), marks: clampInt(q.marks, 1, 15, type === 'mcq' ? 1 : 4),
      topic: str(q.topic, 160), unit: validUnit(q.unit) || units[0] || material[0].unit,
      markscheme: (Array.isArray(q.markscheme) ? q.markscheme : []).slice(0, 12).map(p => str(p, 400)) };
    if (type === 'mcq') {
      out.options = (Array.isArray(q.options) ? q.options : []).slice(0, 5).map(o => str(o, 300));
      out.correct = clampInt(q.correct_option, 0, out.options.length - 1, 0);
      out.marks = 1;
      if (out.options.length < 2) { out.type = 'short'; delete out.options; delete out.correct; }
    }
    return out;
  }).filter(q => q.prompt.trim());
  if (!questions.length) throw new LinError(502, 'Lin did not return any usable questions. Please try again.');
  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);
  return { exam: { id: uid('exam'), title: str(input.title, 120) || 'Mock examination', style, topic,
    units: units.length ? units : [...new Set(questions.map(q => q.unit))],
    instructions: str(input.instructions, 600) || 'Answer all questions. Use psychological terminology and evidence from your notes.',
    questions, totalMarks, suggestedMinutes: Math.max(5, Math.round(totalMarks * 1.5)), createdAt: new Date().toISOString() } };
}

/* ---------------------------------------------------------------- grading */
const GRADE_TOOL = {
  name: 'record_grades',
  description: 'Record the marking of each written answer and an overall diagnosis.',
  input_schema: { type: 'object', properties: {
    results: { type: 'array', items: { type: 'object', properties: {
      id: { type: 'string' },
      mark: { type: 'integer', minimum: 0 },
      feedback: { type: 'string', description: 'Examiner-style feedback addressed to the student (2–4 sentences)' },
      strengths: { type: 'array', items: { type: 'string' } },
      improvements: { type: 'array', items: { type: 'string' }, description: 'Specific, actionable suggestions' },
      model_answer: { type: 'string', description: 'A concise full-mark answer outline' }
    }, required: ['id', 'mark', 'feedback', 'improvements', 'model_answer'] } },
    summary: { type: 'string', description: 'Overall performance summary (2–3 sentences)' },
    weaknesses: { type: 'array', items: { type: 'object', properties: {
      topic: { type: 'string', description: 'Notebook topic title' }, unit: { type: 'string', enum: UNITS },
      issue: { type: 'string', description: 'What the student misunderstands or omits' },
      revise: { type: 'string', description: 'What to revise / how' } }, required: ['topic', 'issue', 'revise'] } },
    strengths: { type: 'array', items: { type: 'string' } },
    next_steps: { type: 'array', items: { type: 'string' } }
  }, required: ['results', 'summary', 'weaknesses'] }
};

function sanitizeExam(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.questions) || !raw.questions.length) throw new LinError(400, 'No exam was submitted.');
  if (JSON.stringify(raw).length > 120000) throw new LinError(413, 'The exam is too large to grade.');
  return raw.questions.slice(0, 12).map((q, i) => ({
    id: str(q.id, 20) || `q${i + 1}`, type: str(q.type, 20), prompt: str(q.prompt, 1200), stimulus: str(q.stimulus, 3000),
    marks: clampInt(q.marks, 1, 15, 4), topic: str(q.topic, 160), unit: validUnit(q.unit), commandTerm: str(q.commandTerm, 30),
    markscheme: (Array.isArray(q.markscheme) ? q.markscheme : []).slice(0, 12).map(p => str(p, 400)),
    options: Array.isArray(q.options) ? q.options.slice(0, 5).map(o => str(o, 300)) : null,
    correct: Number.isInteger(q.correct) ? q.correct : null
  }));
}

async function grade(body) {
  const questions = sanitizeExam(body.exam);
  const answers = body.answers && typeof body.answers === 'object' ? body.answers : {};
  const results = {};
  const toMark = [];
  for (const q of questions) {
    const a = answers[q.id];
    if (q.type === 'mcq' && q.options) {
      const chosen = Number.isInteger(a) ? a : parseInt(a, 10);
      const ok = chosen === q.correct;
      results[q.id] = { id: q.id, mark: ok ? q.marks : 0, max: q.marks, correct: ok,
        feedback: Number.isInteger(chosen) && !Number.isNaN(chosen)
          ? (ok ? 'Correct.' : `Incorrect — the answer is "${q.options[q.correct]}". You chose "${q.options[chosen] || '?'}".`)
          : `Not answered. The answer is "${q.options[q.correct]}".`,
        improvements: ok ? [] : [`Revise "${q.topic}" in your notes.`], strengths: [], modelAnswer: q.options[q.correct] };
    } else if (!str(a).trim()) {
      results[q.id] = { id: q.id, mark: 0, max: q.marks, feedback: 'No answer was written, so no marks could be awarded.',
        improvements: ['Attempt every question — even a definition and one relevant point can earn marks.'], strengths: [], modelAnswer: '' };
      toMark.push({ q, answer: '', blankOnly: true });
    } else toMark.push({ q, answer: str(a, 6000) });
  }

  let overall = { summary: '', weaknesses: [], strengths: [], nextSteps: [] };
  const needAI = toMark.length > 0;
  if (needAI) {
    const material = R.mergeResults(...toMark.map(({ q }) => {
      const exact = R.findTopicByTitle(q.topic, q.unit);
      return R.mergeResults(exact ? [exact] : [], R.search(`${q.topic} ${q.prompt}`, { preferUnit: q.unit || undefined, limit: 3 }));
    })).slice(0, 14);
    const mcqSummary = questions.filter(q => q.type === 'mcq' && results[q.id])
      .map(q => `${q.id} (MCQ on "${q.topic}"): ${results[q.id].correct ? 'correct' : 'incorrect'}`).join('\n');
    const input = await callForJSON({
      system: `${PERSONA}\nYou are a fair, rigorous IB Psychology SL examiner. Mark strictly against the mark scheme and IB expectations (knowledge and understanding, application, use of evidence, critical thinking appropriate to the command term). Do not reward vague or inaccurate answers; do award credit for valid points not in the mark scheme. Never award more than the question's marks.`,
      tool: GRADE_TOOL, maxTokens: 7000,
      prompt: `Mark these answers. For blank answers give 0 and just provide the model answer.
${toMark.map(({ q, answer, blankOnly }) => `
=== ${q.id} · ${q.marks} marks · ${q.commandTerm || q.type} · topic "${q.topic}" ===
${q.stimulus ? `Stimulus: ${q.stimulus}\n` : ''}Question: ${q.prompt}
Mark scheme:\n${q.markscheme.map(p => `- ${p}`).join('\n') || '- (use IB expectations and the notebook material)'}
Student answer: ${blankOnly ? '(blank)' : `"""${answer}"""`}`).join('\n')}
${mcqSummary ? `\nMultiple-choice results (already auto-marked):\n${mcqSummary}` : ''}

Then diagnose the student's weaknesses across the WHOLE exam (including MCQs), naming notebook topics to revise.

NOTEBOOK MATERIAL (reference for accuracy):
${R.formatForPrompt(material, 12000)}`
    });
    for (const r of Array.isArray(input.results) ? input.results : []) {
      const item = toMark.find(t => t.q.id === r.id);
      if (!item) continue;
      const max = item.q.marks;
      results[r.id] = { id: r.id, max, mark: item.blankOnly ? 0 : clampInt(r.mark, 0, max, 0),
        feedback: item.blankOnly ? results[r.id].feedback : str(r.feedback, 1500),
        strengths: (r.strengths || []).slice(0, 5).map(s => str(s, 300)),
        improvements: (item.blankOnly ? results[r.id].improvements : []).concat((r.improvements || []).slice(0, 5).map(s => str(s, 300))),
        modelAnswer: str(r.model_answer, 2500) };
    }
    overall = {
      summary: str(input.summary, 1200),
      weaknesses: (input.weaknesses || []).slice(0, 6).map(w => ({ topic: str(w.topic, 160), unit: validUnit(w.unit), issue: str(w.issue, 400), revise: str(w.revise, 400) })),
      strengths: (input.strengths || []).slice(0, 5).map(s => str(s, 300)),
      nextSteps: (input.next_steps || []).slice(0, 5).map(s => str(s, 300))
    };
  }
  // Any written answer the model skipped is marked 0 with a note, so totals are always complete.
  for (const { q } of toMark) if (!results[q.id]) results[q.id] = { id: q.id, mark: 0, max: q.marks, feedback: 'Lin could not mark this answer — please resubmit to have it marked.', improvements: [], strengths: [], modelAnswer: '' };
  if (!needAI) {
    const wrong = questions.filter(q => results[q.id] && !results[q.id].correct);
    overall.summary = wrong.length ? `You answered ${questions.length - wrong.length} of ${questions.length} correctly.` : 'Full marks — excellent work!';
    overall.weaknesses = wrong.map(q => ({ topic: q.topic, unit: q.unit, issue: 'Answered incorrectly in the multiple-choice section.', revise: `Re-read "${q.topic}" and make flashcards on its key terms.` }));
  }
  const ordered = questions.map(q => results[q.id]);
  const score = ordered.reduce((s, r) => s + r.mark, 0);
  const total = ordered.reduce((s, r) => s + r.max, 0);
  return { results: ordered, score, total, percent: total ? Math.round((score / total) * 100) : 0, ...overall, gradedAt: new Date().toISOString() };
}

/* ---------------------------------------------------------------- dispatcher */
async function handleLinRequest(body) {
  if (!body || typeof body !== 'object') throw new LinError(400, 'Invalid request.');
  switch (body.action) {
    case 'status': { const p = provider(); return { configured: Boolean(p), provider: p ? p.name : null, model: model(), chunks: R.chunkCount }; }
    case 'search': return { results: R.search(str(body.query, 300), { unit: validUnit(body.unit) || undefined, limit: clampInt(body.limit, 1, 20, 8) }) };
    case 'chat': return chat(body);
    case 'flashcards': return flashcards(body);
    case 'exam': return exam(body);
    case 'grade': return grade(body);
    default: throw new LinError(400, 'Unknown action.');
  }
}

/* Very small in-memory rate limiter (per server instance) to protect your API budget. */
const hits = new Map();
function rateLimited(ip, action) {
  if (action === 'status' || action === 'search') return false;
  const now = Date.now(), windowMs = 10 * 60 * 1000, max = Number(process.env.LIN_RATE_LIMIT || 60);
  const list = (hits.get(ip) || []).filter(t => now - t < windowMs);
  list.push(now); hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > max;
}

/** Shared HTTP wrapper used by both the Vercel function and the local server. */
async function respond(req, rawBody) {
  if (req.method !== 'POST') return { status: 405, json: { error: 'Use POST.' } };
  if (rawBody && rawBody.length > 200000) return { status: 413, json: { error: 'Request too large.' } };
  let body;
  try { body = typeof rawBody === 'string' ? JSON.parse(rawBody || '{}') : (rawBody || {}); }
  catch { return { status: 400, json: { error: 'Invalid JSON.' } }; }
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'local').split(',')[0].trim();
  if (rateLimited(ip, body.action)) return { status: 429, json: { error: 'You\'ve sent a lot of requests in a short time. Take a short break and try again in a few minutes.' } };
  let guardTimer;
  try {
    const work = budgetStore.run({ deadline: Date.now() + BUDGET_MS() }, () => handleLinRequest(body));
    const guard = new Promise((_, reject) => { guardTimer = setTimeout(() => reject(new LinError(504, 'Lin took too long to answer. Please try again — shorter requests (fewer questions or cards) are faster.')), BUDGET_MS() + 2500); });
    return { status: 200, json: await Promise.race([work, guard]) };
  }
  catch (err) {
    if (err instanceof LinError) return { status: err.status, json: { error: err.message } };
    console.error('[lin] unexpected error:', err);
    return { status: 500, json: { error: 'Something went wrong inside Lin. Please try again.' } };
  } finally { clearTimeout(guardTimer); }
}

module.exports = { handleLinRequest, respond, LinError };
