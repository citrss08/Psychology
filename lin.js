/* Lin — the notebook's AI tutor + Study Lab (flashcards, mock exams, progress).
   Front-end only: talks to the server route /api/lin, which holds the API key.
   Persistence: everything the student creates is kept in this browser's localStorage
   (flashcards, exam attempts, chat history) and can be exported/imported as JSON. */
(function () {
'use strict';
const C = window.PSYCH_CONTENT;
if (!C) { console.error('[Lin] content.js must load before lin.js'); return; }
const API_URL = window.LIN_API_URL || '/api/lin';
const qs = (s, r = document) => r.querySelector(s);
const qsa = (s, r = document) => [...r.querySelectorAll(s)];
const h = (v = '') => String(v).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const uid = p => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const unitName = u => C.unitNames[u] || 'All units';
const DAY = 86400000;
const SERVER_MISSING = 'Lin\'s server isn\'t reachable from this page. Start it with `npm start` (then open http://localhost:3000) or deploy to Vercel — see the README.';

/* ================================================================ storage */
const store = {
  get(key, fallback) { try { const v = localStorage.getItem('lin.v1.' + key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set(key, value) {
    try { localStorage.setItem('lin.v1.' + key, JSON.stringify(value)); return true; }
    catch { toast('Couldn\'t save to this browser (storage is full or blocked). Export your flashcards to keep a copy.'); return false; }
  }
};
let cards = store.get('flashcards', []);
let exams = store.get('exams', { current: null, attempts: [] });
let chat = store.get('chat', []);
let ui = store.get('ui', { state: 'minimised', labTab: 'flashcards' });
// Any generation that was still running when the page closed can't finish now.
chat.forEach(m => { if (m.kind === 'action' && m.status === 'pending') { m.status = 'failed'; m.sub = 'Interrupted when the page was closed — ask again.'; } });
const saveCards = () => store.set('flashcards', cards);
const saveExams = () => store.set('exams', exams);
const saveChat = () => store.set('chat', chat.slice(-80));
const saveUI = () => store.set('ui', ui);

/* ================================================================ API */
async function api(action, payload = {}) {
  let res;
  try {
    res = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...payload }) });
  } catch { throw new Error(SERVER_MISSING); }
  let data = null;
  try { data = await res.json(); } catch { /* not JSON → probably static hosting */ }
  if (!data) throw new Error(SERVER_MISSING);
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status}).`);
  return data;
}

/* ================================================================ markdown (safe subset) */
function inline(text) {
  return h(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, '$1<em>$2</em>')
    .replace(/(^|\W)_([^_\n]+)_(?!\w)/g, '$1<em>$2</em>');
}
function md(src) {
  const lines = String(src || '').replace(/\r/g, '').split('\n');
  let out = '', list = null, para = [];
  const flushPara = () => { if (para.length) { out += `<p>${para.map(inline).join('<br>')}</p>`; para = []; } };
  const closeList = () => { if (list) { out += `</${list}>`; list = null; } };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*\|.*\|\s*$/.test(line) && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1] || '')) { // table
      flushPara(); closeList();
      const cells = l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      out += '<table><thead><tr>' + cells(line).map(c => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>';
      i += 2;
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) { out += '<tr>' + cells(lines[i]).map(c => `<td>${inline(c)}</td>`).join('') + '</tr>'; i++; }
      i--; out += '</tbody></table>'; continue;
    }
    let m;
    if ((m = line.match(/^\s*#{1,4}\s+(.*)$/))) { flushPara(); closeList(); out += `<h4>${inline(m[1])}</h4>`; continue; }
    if ((m = line.match(/^\s*[-*•]\s+(.*)$/))) { flushPara(); if (list !== 'ul') { closeList(); out += '<ul>'; list = 'ul'; } out += `<li>${inline(m[1])}</li>`; continue; }
    if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) { flushPara(); if (list !== 'ol') { closeList(); out += '<ol>'; list = 'ol'; } out += `<li>${inline(m[1])}</li>`; continue; }
    if (!line.trim()) { flushPara(); closeList(); continue; }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) { flushPara(); closeList(); continue; }
    closeList(); para.push(line);
  }
  flushPara(); closeList();
  return out;
}

/* ================================================================ page context */
const ctx = { unit: 'investigations', tab: 'notes', topic: '' };
function topicTitleOf(card) {
  const title = qs('.toggle-title', card);
  if (!title) return qs('h3', card)?.textContent.trim() || '';
  const clone = title.cloneNode(true);
  qsa('.toggle-number,.study-subtitle', clone).forEach(n => n.remove());
  return clone.textContent.trim();
}
function readContext() {
  const unitCard = qs('.unit-card.active');
  const newUnit = unitCard ? unitCard.dataset.unit : ctx.unit;
  if (newUnit !== ctx.unit) ctx.topic = '';
  ctx.unit = newUnit;
  ctx.tab = qs('.tab.active')?.dataset.tab || 'notes';
  return ctx;
}
function updateContextChip() {
  readContext();
  const el = qs('#lin-context-text');
  if (el) el.innerHTML = `Studying <b>${h(unitName(ctx.unit))}${ctx.topic ? ' › ' + h(ctx.topic) : ''}</b>`;
  renderSuggestions();
}

/* ================================================================ navigation helpers */
function openTopic(title, unit, type) {
  if (type === 'glossary') {
    const search = qs('#glossary-search');
    if (search) { search.value = title; search.dispatchEvent(new Event('input', { bubbles: true })); }
    const select = qs('#glossary-unit'); if (select) { select.value = 'all'; select.dispatchEvent(new Event('change')); }
    qs('#glossary')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  if (unit) qs(`.unit-card[data-unit="${unit}"]`)?.click();
  const tab = type === 'study' ? 'studies' : type === 'practice' ? 'practice' : type === 'quiz' ? 'quiz' : 'notes';
  if (tab !== 'notes') qs(`.tab[data-tab="${tab}"]`)?.click();
  const search = qs('#course-search'); if (search && search.value) { search.value = ''; search.dispatchEvent(new Event('input', { bubbles: true })); }
  const want = String(title || '').toLowerCase();
  const card = qsa('.topic-card,.study-card,.practice-card').find(c => topicTitleOf(c).toLowerCase() === want)
    || qsa('.topic-card,.study-card,.practice-card').find(c => topicTitleOf(c).toLowerCase().includes(want) || want.includes(topicTitleOf(c).toLowerCase()));
  if (card) {
    if (card.classList.contains('topic-card') || card.classList.contains('study-card')) {
      card.classList.add('is-open'); qs('.topic-toggle,.study-toggle', card)?.setAttribute('aria-expanded', 'true');
      ctx.topic = topicTitleOf(card); updateContextChip();
    }
    setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  } else qs('#study-area')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function findNotebookTopic(title, unit) {
  const t = String(title || '').toLowerCase().trim();
  if (!t) return null;
  for (const u of C.unitOrder) {
    if (unit && u !== unit) continue;
    for (const [, rows] of C.course[u].groups) for (const r of rows) if (r[0].toLowerCase() === t) return { title: r[0], unit: u, type: 'topic' };
    for (const s of C.studies[u] || []) if (s[0].toLowerCase() === t) return { title: s[0], unit: u, type: 'study' };
    for (const term of Object.keys(C.glossary[u] || {})) if (term.toLowerCase() === t) return { title: term, unit: u, type: 'glossary' };
  }
  return unit ? findNotebookTopic(title, null) : null;
}
function openLab(tab) {
  setLabTab(tab);
  qs('#study-lab')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ================================================================ toast */
let toastTimer;
function toast(message, actionLabel, onAction) {
  qs('.lin-toast')?.remove();
  const el = document.createElement('div');
  el.className = 'lin-toast'; el.setAttribute('role', 'status');
  el.innerHTML = `${h(message)}${actionLabel ? `<button type="button">${h(actionLabel)}</button>` : ''}`;
  if (actionLabel) el.querySelector('button').onclick = () => { el.remove(); onAction(); };
  document.body.appendChild(el);
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.remove(), 5000);
}

/* ================================================================ floating assistant */
const root = document.createElement('div');
root.className = 'lin-root';
root.innerHTML = `
  <button class="lin-launcher" type="button" aria-label="Open Lin, your AI psychology tutor">
    <span class="lin-avatar">L</span><span>Ask Lin<small>AI psychology tutor</small></span><span class="lin-badge" hidden></span>
  </button>
  <section class="lin-panel" role="dialog" aria-label="Lin, AI psychology tutor">
    <header class="lin-head">
      <span class="lin-avatar">L</span>
      <div class="lin-title"><strong>Lin</strong><span>Your IB Psychology SL tutor · uses your notes</span></div>
      <button class="lin-icon-btn" type="button" data-lin-ui="clear" title="Start a new conversation" aria-label="Start a new conversation">↺</button>
      <button class="lin-icon-btn" type="button" data-lin-ui="minimise" title="Minimise (Esc)" aria-label="Minimise Lin">–</button>
      <button class="lin-icon-btn" type="button" data-lin-ui="hide" title="Hide Lin completely" aria-label="Hide Lin">✕</button>
    </header>
    <div class="lin-context"><span class="note-dot"></span><span id="lin-context-text"></span></div>
    <div class="lin-notice" id="lin-notice" hidden></div>
    <div class="lin-messages" id="lin-messages" aria-live="polite"></div>
    <div class="lin-suggestions" id="lin-suggestions"></div>
    <form class="lin-form" id="lin-form">
      <textarea id="lin-input" rows="1" placeholder="Ask about a concept, request flashcards or a mock exam…" aria-label="Message Lin" maxlength="4000"></textarea>
      <button class="lin-send" type="submit" aria-label="Send">➤</button>
    </form>
    <div class="lin-foot">Lin prioritises this notebook's notes · AI can make mistakes — check key facts</div>
  </section>`;
document.body.appendChild(root);
const messagesEl = qs('#lin-messages', root);
const inputEl = qs('#lin-input', root);
let busy = false;
let statusChecked = false;

function setState(state) {
  ui.state = state; saveUI();
  root.dataset.state = state;
  if (state === 'open') {
    qs('.lin-badge', root).hidden = true;
    updateContextChip(); renderMessages();
    checkStatus();
    setTimeout(() => inputEl.focus(), 30);
  }
}
function checkStatus() {
  if (statusChecked) return; statusChecked = true;
  api('status').then(s => {
    if (!s.configured) showNotice('Lin isn\'t connected to the AI yet. Add your key to <code>GEMINI_API_KEY</code> (or <code>ANTHROPIC_API_KEY</code>) in the <code>.env</code> file (or your Vercel environment variables) and restart the server.');
  }).catch(err => showNotice(h(err.message).replace(/`([^`]+)`/g, '<code>$1</code>')));
}
function showNotice(html) { const n = qs('#lin-notice'); n.innerHTML = html; n.hidden = false; }

function renderMessages() {
  if (!chat.length) {
    messagesEl.innerHTML = `<div class="lin-welcome"><strong>Hi, I'm Lin.</strong>I study alongside you using the notes in this notebook. I can:
      <ul><li>explain, simplify and compare concepts from your notes</li><li>give examples and applications for exam answers</li>
      <li>make flashcards and save them to your repository</li><li>write mock exams in IB style, then mark them and find your weak spots</li></ul></div>`;
    return;
  }
  messagesEl.innerHTML = chat.map(renderMessage).join('');
  messagesEl.scrollTop = messagesEl.scrollHeight;
}
function renderMessage(m) {
  if (m.kind === 'action') {
    const icon = m.type === 'exam' ? '✎' : '▤';
    const btn = m.status === 'done' && m.btn ? `<button class="lin-chip" type="button" data-lin-open='${h(JSON.stringify(m.btn))}'>${h(m.btn.label)}</button>`
      : m.status === 'failed' && m.retry ? `<button class="lin-chip coral" type="button" data-lin-retry="${h(m.id)}">Retry</button>` : '';
    return `<div class="lin-action-card ${m.status === 'failed' ? 'failed' : ''}" data-msg="${h(m.id)}"><span class="lin-action-icon">${m.status === 'pending' ? '<span class="spinner"></span>' : icon}</span><div><strong>${h(m.title)}</strong><span>${h(m.sub || '')}</span></div>${btn}</div>`;
  }
  if (m.kind === 'error') return `<div class="lin-msg error">${h(m.content)}${m.retryText ? `<br><button class="lin-chip coral" type="button" data-lin-resend="${h(m.id)}">Try again</button>` : ''}</div>`;
  if (m.role === 'user') return `<div class="lin-msg user">${h(m.content)}</div>`;
  const sources = (m.sources || []).length ? `<div class="lin-sources"><span class="box-label">FROM YOUR NOTES</span>${m.sources.map(s =>
    `<button class="lin-source" type="button" data-lin-source='${h(JSON.stringify({ title: s.title, unit: s.unit, type: s.type }))}' title="${h(s.unitName)}">${h(s.title.length > 48 ? s.title.slice(0, 46) + '…' : s.title)}</button>`).join('')}</div>` : '';
  return `<div class="lin-msg assistant">${md(m.content)}${sources}</div>`;
}
function pushMessage(m) {
  m.id = m.id || uid('m'); chat.push(m); saveChat();
  if (root.dataset.state === 'open') renderMessages(); else qs('.lin-badge', root).hidden = false;
  return m;
}
function updateMessage(id, patch) {
  const m = chat.find(x => x.id === id); if (!m) return;
  Object.assign(m, patch); saveChat();
  const el = messagesEl.querySelector(`[data-msg="${CSS.escape(id)}"]`);
  if (el) el.outerHTML = renderMessage(m); else if (root.dataset.state === 'open') renderMessages();
}
function setTyping(on) {
  qs('.lin-typing', messagesEl)?.remove();
  if (on) { messagesEl.insertAdjacentHTML('beforeend', '<div class="lin-typing" aria-label="Lin is thinking"><i></i><i></i><i></i></div>'); messagesEl.scrollTop = messagesEl.scrollHeight; }
  qs('.lin-send', root).disabled = on;
}
function renderSuggestions() {
  const el = qs('#lin-suggestions'); if (!el) return;
  const focus = ctx.topic || unitName(ctx.unit);
  const items = [
    `Explain "${focus}" simply`,
    `Make 8 flashcards on "${focus}"`,
    `Give me a quick mock exam on ${unitName(ctx.unit)}`,
    `Compare two key theories in ${unitName(ctx.unit)}`,
    'What should I revise next?'
  ];
  el.innerHTML = items.map(t => `<button class="lin-chip" type="button" data-lin-ask="${h(t)}">${h(t.length > 46 ? t.slice(0, 44) + '…' : t)}</button>`).join('');
}

function progressSummary() {
  const decks = [...new Set(cards.map(c => c.deck))];
  return { weaknesses: aggregateWeaknesses().slice(0, 6).map(w => ({ topic: w.topic, issue: w.issue })), decks };
}

async function ask(text, { open = true } = {}) {
  text = String(text || '').trim();
  if (!text || busy) { if (busy) toast('Lin is still answering — one moment.'); return; }
  if (open && root.dataset.state !== 'open') setState('open');
  pushMessage({ role: 'user', content: text });
  busy = true; setTyping(true);
  try {
    const history = chat.filter(m => !m.kind && (m.role === 'user' || m.role === 'assistant')).slice(-16).map(m => ({ role: m.role, content: m.content }));
    const data = await api('chat', { messages: history, context: readContext(), progress: progressSummary() });
    setTyping(false);
    pushMessage({ role: 'assistant', content: data.reply, sources: data.sources || [] });
    for (const a of data.actions || []) {
      if (a.type === 'flashcards') generateFlashcards(a.params);
      else if (a.type === 'exam') generateExam(a.params);
    }
  } catch (err) {
    setTyping(false);
    pushMessage({ kind: 'error', content: err.message, retryText: text });
  } finally { busy = false; qs('.lin-send', root).disabled = false; }
}

/* ---------- panel events */
qs('.lin-launcher', root).addEventListener('click', () => setState('open'));
qs('#ask-lin')?.addEventListener('click', () => setState(root.dataset.state === 'open' ? 'minimised' : 'open'));
root.addEventListener('click', e => {
  const uiBtn = e.target.closest('[data-lin-ui]');
  if (uiBtn) {
    const act = uiBtn.dataset.linUi;
    if (act === 'minimise') setState('minimised');
    else if (act === 'hide') { setState('hidden'); toast('Lin is hidden. Reopen it with "Ask Lin" at the top of the page or Alt+L.', 'Undo', () => setState('minimised')); }
    else if (act === 'clear' && (!chat.length || confirm('Start a new conversation? Your flashcards and exams are kept.'))) { chat = []; saveChat(); renderMessages(); }
    return;
  }
  const resend = e.target.closest('[data-lin-resend]');
  if (resend) {
    const m = chat.find(x => x.id === resend.dataset.linResend);
    if (m) { chat = chat.filter(x => x !== m); const lastUser = [...chat].reverse().find(x => x.role === 'user' && !x.kind);
      if (lastUser && lastUser.content === m.retryText) chat = chat.filter(x => x !== lastUser);
      saveChat(); renderMessages(); ask(m.retryText); }
    return;
  }
  const retry = e.target.closest('[data-lin-retry]');
  if (retry) {
    const m = chat.find(x => x.id === retry.dataset.linRetry);
    if (m?.retry) { chat = chat.filter(x => x !== m); saveChat(); renderMessages(); m.type === 'exam' ? generateExam(m.retry) : generateFlashcards(m.retry); }
    return;
  }
  const open = e.target.closest('[data-lin-open]');
  if (open) {
    const b = JSON.parse(open.dataset.linOpen);
    if (b.type === 'deck') { openLab('flashcards'); openDeck(b.deck); }
    else if (b.type === 'exam') { openLab('exams'); }
    else if (b.type === 'attempt') { viewAttempt = b.id; openLab('exams'); renderExams(); }
    if (window.innerWidth < 600) setState('minimised');
    return;
  }
  const src = e.target.closest('[data-lin-source]');
  if (src) { const s = JSON.parse(src.dataset.linSource); openTopic(s.title, s.unit, s.type); if (window.innerWidth < 600) setState('minimised'); return; }
});
qs('#lin-form', root).addEventListener('submit', e => { e.preventDefault(); const t = inputEl.value; inputEl.value = ''; autoGrow(); ask(t); });
inputEl.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); qs('#lin-form', root).requestSubmit(); } });
const autoGrow = () => { inputEl.style.height = 'auto'; inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px'; };
inputEl.addEventListener('input', autoGrow);
document.addEventListener('keydown', e => {
  if (e.altKey && (e.key === 'l' || e.key === 'L' || e.code === 'KeyL')) { e.preventDefault(); setState(root.dataset.state === 'open' ? 'minimised' : 'open'); }
  else if (e.key === 'Escape' && root.dataset.state === 'open' && root.contains(document.activeElement)) setState('minimised');
});

/* ================================================================ notebook integration */
function actionsRow(kind, title, unit) {
  const t = h(title), u = h(unit);
  const chip = (act, label, cls = '') => `<button class="lin-chip ${cls}" type="button" data-lin-topic="${act}" data-title="${t}" data-unit="${u}">${label}</button>`;
  if (kind === 'topic') return `<div class="lin-topic-actions"><span class="box-label">STUDY WITH LIN</span>${chip('explain', 'Explain')}${chip('simplify', 'Simplify')}${chip('example', 'Examples')}${chip('compare', 'Compare')}${chip('flashcards', 'Make flashcards', 'coral')}${chip('exam', 'Mock exam', 'coral')}</div>`;
  if (kind === 'study') return `<div class="lin-topic-actions"><span class="box-label">STUDY WITH LIN</span>${chip('explain', 'Explain')}${chip('essay', 'Use it in an answer')}${chip('flashcards', 'Make flashcards', 'coral')}</div>`;
  if (kind === 'practice') return `<div class="lin-topic-actions"><span class="box-label">LIN</span>${chip('plan', 'Plan an answer')}${chip('mark', 'Mark my answer')}</div>`;
  return `<div class="lin-topic-actions"><span class="box-label">LIN</span>${chip('quizwhy', 'Explain this answer')}</div>`;
}
function decorateUnitContent() {
  const unit = readContext().unit;
  qsa('#unit-content .topic-card').forEach(c => { const b = qs('.topic-body', c); if (b && !qs('.lin-topic-actions', b)) b.insertAdjacentHTML('beforeend', actionsRow('topic', topicTitleOf(c), unit)); });
  qsa('#unit-content .study-card').forEach(c => { const b = qs('.study-body', c); if (b && !qs('.lin-topic-actions', b)) b.insertAdjacentHTML('beforeend', actionsRow('study', topicTitleOf(c), unit)); });
  qsa('#unit-content .practice-card').forEach(c => { if (!qs('.lin-topic-actions', c)) c.insertAdjacentHTML('beforeend', actionsRow('practice', qs('h3', c)?.textContent || '', unit)); });
  qsa('#unit-content .quiz-card').forEach(c => { if (!qs('.lin-topic-actions', c)) c.insertAdjacentHTML('beforeend', actionsRow('quiz', qs('h3', c)?.textContent || '', unit)); });
}
const unitContent = qs('#unit-content');
if (unitContent) { new MutationObserver(() => { decorateUnitContent(); updateContextChip(); }).observe(unitContent, { childList: true }); decorateUnitContent(); }
// Hide the quiz "explain" chip until the student has checked their answer.
const quizStyle = document.createElement('style');
quizStyle.textContent = '.quiz-card .quiz-feedback:not(.visible) ~ .lin-topic-actions{display:none}';
document.head.appendChild(quizStyle);

document.addEventListener('click', e => {
  const toggle = e.target.closest('.topic-toggle,.study-toggle');
  if (toggle) { setTimeout(() => { const card = toggle.closest('.topic-card,.study-card'); if (card?.classList.contains('is-open')) { ctx.topic = topicTitleOf(card); updateContextChip(); } }, 0); }
  const askChip = e.target.closest('[data-lin-ask]');
  if (askChip) { ask(askChip.dataset.linAsk); return; }
  const chip = e.target.closest('[data-lin-topic]');
  if (!chip) return;
  const { linTopic: act, title, unit } = chip.dataset;
  const un = unitName(unit);
  ctx.topic = act === 'quizwhy' || act === 'plan' || act === 'mark' ? ctx.topic : title; updateContextChip();
  switch (act) {
    case 'explain': return ask(`Explain "${title}" from my ${un} notes. Define the key terms, explain how it works and finish with a one-line summary.`);
    case 'simplify': return ask(`Explain "${title}" in much simpler language, as if I'm meeting it for the first time. Use an everyday analogy, then give me a one-sentence version to memorise.`);
    case 'example': return ask(`Give me two clear real-world examples of "${title}" and show how I could apply it to an unseen scenario in Paper 1 Section B.`);
    case 'compare': return ask(`Compare and contrast "${title}" with the most closely related theory or concept in my notes. Use a short table of similarities and differences, then explain when each is more useful.`);
    case 'essay': return ask(`How should I use "${title}" in an IB Psychology SL answer? Show what to include (aim, method, findings if in my notes) and how to evaluate it with the concepts.`);
    case 'plan': return ask(`Help me plan an answer to this IB-style question using my notes: "${title}". Give a paragraph-by-paragraph plan, not a full essay.`);
    case 'quizwhy': return ask(`For the quiz question "${title}", explain why the correct answer is right and why each of the other options is wrong, using my notes.`);
    case 'mark':
      setState('open');
      inputEl.value = `Please mark my answer to: "${title}"\n\nMy answer:\n`; autoGrow(); inputEl.focus();
      inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
      return;
    case 'flashcards': return generateFlashcards({ topic: title, unit, count: 8 });
    case 'exam': return generateExam({ topic: title, units: [unit], style: 'quick', count: 5 });
  }
});

/* ================================================================ Study Lab tabs */
function setLabTab(tab) {
  ui.labTab = tab; saveUI();
  qsa('.lab-tab').forEach(b => { const on = b.dataset.lab === tab; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); });
  qsa('.lab-panel').forEach(p => { p.hidden = p.id !== 'lab-' + tab; });
  if (tab === 'progress') renderProgress();
}
qsa('.lab-tab').forEach(b => b.addEventListener('click', () => setLabTab(b.dataset.lab)));
function updateLabCounts() {
  const due = cards.filter(c => (c.due || 0) <= Date.now()).length;
  const set = (tab, n) => { const b = qs(`.lab-tab[data-lab="${tab}"]`); if (!b) return; let s = qs('.lab-count', b); if (!s) { s = document.createElement('span'); s.className = 'lab-count'; b.appendChild(s); } s.textContent = n; s.hidden = !n; };
  set('flashcards', cards.length); set('exams', exams.attempts.length + (exams.current ? 1 : 0));
  const btn = qs('#fc-review-due'); if (btn) { btn.textContent = `Review due (${due})`; btn.disabled = !due; }
}

/* ================================================================ flashcards */
const unitOptions = (allLabel) => `${allLabel ? `<option value="">${h(allLabel)}</option>` : ''}${C.unitOrder.map(u => `<option value="${u}">${h(unitName(u))}</option>`).join('')}`;
const topicSuggestions = (() => {
  const set = new Set();
  C.unitOrder.forEach(u => { C.course[u].groups.forEach(([, rows]) => rows.forEach(r => set.add(r[0]))); (C.studies[u] || []).forEach(s => set.add(s[0])); Object.keys(C.glossary[u] || {}).forEach(t => set.add(t)); });
  return [...set].sort((a, b) => a.localeCompare(b));
})();
const fcPanel = qs('#lab-flashcards');
const openDecks = new Set();
let review = null; // { queue:[ids], index, flipped, done, total, title }

function renderFlashcardsShell() {
  fcPanel.innerHTML = `
    <div class="lab-card"><h3>Generate flashcards with Lin</h3><p>Lin searches the notes on this site for your topic and writes active-recall cards from them. They're saved to your repository automatically.</p>
      <form class="lab-form" id="fc-gen-form">
        <label class="lab-field grow">Topic or concept<input id="fc-gen-topic" list="lin-topic-list" placeholder="e.g. Operant conditioning, Social identity theory" required maxlength="200"></label>
        <label class="lab-field">Unit<select id="fc-gen-unit">${unitOptions('Any unit')}</select></label>
        <label class="lab-field">Cards<select id="fc-gen-count"><option>5</option><option selected>8</option><option>10</option><option>15</option></select></label>
        <button class="lab-button" type="submit" id="fc-gen-btn">Generate with Lin</button>
      </form>
      <div class="lab-status" id="fc-gen-status" aria-live="polite"></div>
      <datalist id="lin-topic-list">${topicSuggestions.map(t => `<option value="${h(t)}">`).join('')}</datalist>
    </div>
    <div class="lab-toolbar">
      <label class="search-box"><span>⌕</span><input id="fc-search" type="search" placeholder="Search your flashcards…" aria-label="Search flashcards"></label>
      <select id="fc-filter-unit" aria-label="Filter flashcards by unit">${unitOptions('All units')}</select>
      <span class="spacer"></span>
      <button class="lab-button small" type="button" id="fc-review-due">Review due</button>
      <button class="lab-button small secondary" type="button" id="fc-new">+ New card</button>
      <button class="lab-button small secondary" type="button" id="fc-export">Export</button>
      <button class="lab-button small secondary" type="button" id="fc-import">Import</button>
      <input type="file" id="fc-import-file" accept="application/json,.json" hidden>
    </div>
    <div id="fc-review"></div>
    <div id="fc-decks"></div>
    <dialog class="lab-dialog" id="fc-dialog"><form method="dialog" id="fc-edit-form">
      <h3 id="fc-dialog-title">New flashcard</h3>
      <div class="row"><label class="lab-field">Deck / topic<input id="fc-edit-deck" list="fc-deck-list" required maxlength="80"></label>
        <label class="lab-field">Unit<select id="fc-edit-unit">${unitOptions()}</select></label></div>
      <datalist id="fc-deck-list"></datalist>
      <label class="lab-field">Front (question)<textarea id="fc-edit-front" required maxlength="400"></textarea></label>
      <label class="lab-field">Back (answer)<textarea id="fc-edit-back" required maxlength="800"></textarea></label>
      <div class="dialog-actions"><button class="lab-button secondary" value="cancel" formnovalidate type="submit">Cancel</button><button class="lab-button" value="save" type="submit">Save card</button></div>
    </form></dialog>`;

  qs('#fc-gen-form').addEventListener('submit', e => {
    e.preventDefault();
    generateFlashcards({ topic: qs('#fc-gen-topic').value.trim(), unit: qs('#fc-gen-unit').value || null, count: +qs('#fc-gen-count').value }, { fromLab: true });
  });
  qs('#fc-search').addEventListener('input', renderDecks);
  qs('#fc-filter-unit').addEventListener('change', renderDecks);
  qs('#fc-review-due').addEventListener('click', () => startReview(cards.filter(c => (c.due || 0) <= Date.now()), 'Cards due for review'));
  qs('#fc-new').addEventListener('click', () => openEditor());
  qs('#fc-export').addEventListener('click', exportCards);
  qs('#fc-import').addEventListener('click', () => qs('#fc-import-file').click());
  qs('#fc-import-file').addEventListener('change', importCards);
  qs('#fc-dialog').addEventListener('close', saveEditor);
  fcPanel.addEventListener('click', onFlashcardClick);
}

function filteredCards() {
  const q = (qs('#fc-search')?.value || '').trim().toLowerCase();
  const u = qs('#fc-filter-unit')?.value || '';
  return cards.filter(c => (!u || c.unit === u) && (!q || `${c.deck} ${c.front} ${c.back} ${c.sourceTopic || ''}`.toLowerCase().includes(q)));
}
function renderDecks() {
  updateLabCounts();
  const el = qs('#fc-decks'); if (!el) return;
  qs('#fc-deck-list').innerHTML = [...new Set(cards.map(c => c.deck))].map(d => `<option value="${h(d)}">`).join('');
  if (review) { el.innerHTML = ''; return; }
  if (!cards.length) { el.innerHTML = '<div class="lab-empty">Your flashcard repository is empty. Generate a deck above, use "Make flashcards" on any topic in the notes, or ask Lin.</div>'; return; }
  const list = filteredCards();
  const searching = Boolean((qs('#fc-search')?.value || '').trim());
  if (!list.length) { el.innerHTML = '<div class="lab-empty">No flashcards match that search.</div>'; return; }
  const decks = new Map();
  for (const c of list) { if (!decks.has(c.deck)) decks.set(c.deck, []); decks.get(c.deck).push(c); }
  const ordered = [...decks.entries()].sort((a, b) => Math.max(...b[1].map(c => c.createdAt || 0)) - Math.max(...a[1].map(c => c.createdAt || 0)));
  el.innerHTML = ordered.map(([deck, list]) => {
    const all = cards.filter(c => c.deck === deck);
    const due = all.filter(c => (c.due || 0) <= Date.now()).length;
    const mastered = all.filter(c => (c.box || 1) >= 4).length;
    const unit = list[0].unit;
    const open = searching || openDecks.has(deck);
    return `<article class="deck ${open ? 'is-open' : ''}" data-deck="${h(deck)}">
      <div class="deck-head">
        <button class="deck-toggle" type="button" data-fc="toggle" aria-expanded="${open}"><span class="toggle-chevron">⌄</span><span><strong>${h(deck)}</strong><span class="deck-meta">${h(unitName(unit).toUpperCase())} · ${all.length} CARD${all.length === 1 ? '' : 'S'} · ${due} DUE · ${mastered} MASTERED</span></span></button>
        <div class="deck-actions">
          <button class="lab-button small" type="button" data-fc="review">Review</button>
          <button class="lab-button small secondary" type="button" data-fc="more">+ Lin, add 5 more</button>
          <button class="lab-button small secondary" type="button" data-fc="add">+ Card</button>
          <button class="lab-button small danger" type="button" data-fc="delete-deck" aria-label="Delete deck ${h(deck)}">Delete</button>
        </div>
      </div>
      <div class="deck-body"><div class="card-grid">${list.map(renderCard).join('')}</div></div>
    </article>`;
  }).join('');
}
function renderCard(c) {
  const box = c.box || 1;
  return `<div class="fc" data-id="${h(c.id)}"><div class="fc-front">${h(c.front)}</div><div class="fc-back">${h(c.back)}</div>
    <div class="fc-foot"><span class="pill">${h(c.origin === 'user' ? 'YOUR CARD' : (c.kind || 'card').toUpperCase())}</span>
      <span class="box-dots" title="Leitner box ${box} of 5">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= box ? 'on' : ''}"></i>`).join('')}</span>
      <button class="text-button" type="button" data-fc="flip">Answer</button><button class="text-button" type="button" data-fc="edit">Edit</button><button class="text-button" type="button" data-fc="delete">Delete</button></div></div>`;
}
function onFlashcardClick(e) {
  const btn = e.target.closest('[data-fc]'); if (!btn) return;
  const act = btn.dataset.fc;
  const deckEl = btn.closest('.deck'); const deck = deckEl?.dataset.deck;
  const cardEl = btn.closest('.fc'); const card = cardEl && cards.find(c => c.id === cardEl.dataset.id);
  if (act === 'toggle') { deckEl.classList.toggle('is-open'); const o = deckEl.classList.contains('is-open'); o ? openDecks.add(deck) : openDecks.delete(deck); btn.setAttribute('aria-expanded', String(o)); }
  else if (act === 'review') startReview(cards.filter(c => c.deck === deck), deck);
  else if (act === 'more') { const first = cards.find(c => c.deck === deck); generateFlashcards({ topic: deck, unit: first?.unit, count: 5, deck }, { fromLab: true }); }
  else if (act === 'add') openEditor(null, deck);
  else if (act === 'delete-deck') {
    const n = cards.filter(c => c.deck === deck).length;
    if (confirm(`Delete the deck "${deck}" and its ${n} card${n === 1 ? '' : 's'}? This can't be undone.`)) { cards = cards.filter(c => c.deck !== deck); saveCards(); renderDecks(); }
  }
  else if (act === 'flip' && cardEl) { cardEl.classList.toggle('show-back'); btn.textContent = cardEl.classList.contains('show-back') ? 'Hide' : 'Answer'; }
  else if (act === 'edit' && card) openEditor(card);
  else if (act === 'delete' && card) {
    const removed = card; cards = cards.filter(c => c !== card); saveCards(); renderDecks();
    toast('Flashcard deleted.', 'Undo', () => { cards.push(removed); saveCards(); renderDecks(); });
  }
  // review controls
  else if (act === 'flip-review') flipReview();
  else if (act === 'grade') gradeReview(+btn.dataset.q);
  else if (act === 'end-review') { review = null; renderReview(); renderDecks(); }
  else if (act === 'ask-review') { const c = cards.find(x => x.id === review?.queue[review.index]); if (c) ask(`Help me understand this flashcard from my "${c.deck}" deck.\nQ: ${c.front}\nA: ${c.back}\nExplain why this is the answer and give me a memory hook.`); }
}
function openDeck(deck) {
  if (review) { review = null; renderReview(); }
  openDecks.add(deck); qs('#fc-search').value = ''; qs('#fc-filter-unit').value = ''; renderDecks();
  const el = qsa('.deck').find(d => d.dataset.deck === deck);
  if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
}

/* editor */
let editing = null;
function openEditor(card = null, deck = '') {
  editing = card;
  qs('#fc-dialog').returnValue = '';
  qs('#fc-dialog-title').textContent = card ? 'Edit flashcard' : 'New flashcard';
  qs('#fc-edit-deck').value = card ? card.deck : (deck || '');
  qs('#fc-edit-unit').value = card ? card.unit : (cards.find(c => c.deck === deck)?.unit || readContext().unit);
  qs('#fc-edit-front').value = card ? card.front : '';
  qs('#fc-edit-back').value = card ? card.back : '';
  qs('#fc-dialog').showModal();
}
function saveEditor() {
  const dlg = qs('#fc-dialog');
  if (dlg.returnValue !== 'save') { editing = null; return; }
  const data = { deck: qs('#fc-edit-deck').value.trim().slice(0, 80), unit: qs('#fc-edit-unit').value, front: qs('#fc-edit-front').value.trim(), back: qs('#fc-edit-back').value.trim() };
  if (!data.deck || !data.front || !data.back) return;
  if (editing) Object.assign(editing, data, { updatedAt: Date.now() });
  else cards.push({ id: uid('fc'), ...data, kind: 'custom', origin: 'user', createdAt: Date.now(), box: 1, due: Date.now() });
  openDecks.add(data.deck); saveCards(); renderDecks(); editing = null; dlg.returnValue = '';
}

/* import / export */
function exportCards() {
  const blob = new Blob([JSON.stringify({ app: 'psychology-sl-lin', version: 1, exportedAt: new Date().toISOString(), flashcards: cards }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `psychology-flashcards-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function importCards(e) {
  const file = e.target.files[0]; e.target.value = ''; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      const list = Array.isArray(data) ? data : data.flashcards;
      if (!Array.isArray(list)) throw new Error();
      const ids = new Set(cards.map(c => c.id)); let added = 0;
      for (const c of list) {
        if (!c || typeof c.front !== 'string' || typeof c.back !== 'string' || !c.front.trim()) continue;
        const card = { id: typeof c.id === 'string' && !ids.has(c.id) ? c.id : uid('fc'), deck: String(c.deck || 'Imported').slice(0, 80), unit: C.unitOrder.includes(c.unit) ? c.unit : 'investigations',
          front: c.front.slice(0, 400), back: c.back.slice(0, 800), kind: String(c.kind || 'imported').slice(0, 20), origin: c.origin === 'lin' ? 'lin' : 'user', sourceTopic: String(c.sourceTopic || '').slice(0, 160),
          createdAt: +c.createdAt || Date.now(), box: Math.min(5, Math.max(1, +c.box || 1)), due: +c.due || Date.now() };
        ids.add(card.id); cards.push(card); added++;
      }
      saveCards(); renderDecks(); toast(`Imported ${added} flashcard${added === 1 ? '' : 's'}.`);
    } catch { toast('That file isn\'t a valid flashcard export.'); }
  };
  reader.readAsText(file);
}

/* review (Leitner boxes: 1 → today, 2 → 1 day, 3 → 3 days, 4 → 7 days, 5 → 16 days) */
const INTERVALS = [0, 0, 1, 3, 7, 16];
function startReview(list, title) {
  if (!list.length) { toast('No cards to review here.'); return; }
  const queue = list.slice().sort((a, b) => (a.due || 0) - (b.due || 0) || (a.box || 1) - (b.box || 1)).map(c => c.id);
  review = { queue, index: 0, flipped: false, title, total: queue.length, correct: 0, seen: 0 };
  setLabTab('flashcards'); renderReview(); renderDecks();
  qs('#fc-review')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function renderReview() {
  const el = qs('#fc-review'); if (!el) return;
  if (!review) { el.innerHTML = ''; return; }
  if (review.index >= review.queue.length) {
    el.innerHTML = `<div class="review review-done lab-card"><h3>Session complete</h3><p>You reviewed ${review.seen} card${review.seen === 1 ? '' : 's'} from "${h(review.title)}" and knew ${review.correct} first time.</p>
      <button class="lab-button" type="button" data-fc="end-review">Back to repository</button></div>`;
    return;
  }
  const c = cards.find(x => x.id === review.queue[review.index]);
  if (!c) { review.index++; return renderReview(); }
  const pct = Math.round((review.index / review.queue.length) * 100);
  el.innerHTML = `<div class="review">
    <div class="review-top"><span>${h(review.title)} · card ${review.index + 1} of ${review.queue.length}</span><button class="text-button" type="button" data-fc="end-review">End session</button></div>
    <div class="review-bar"><span style="width:${pct}%"></span></div>
    <div class="review-card ${review.flipped ? 'flipped' : ''}" data-fc="flip-review" role="button" tabindex="0" aria-label="Flip card">
      <span class="box-label">${h(c.deck.toUpperCase())}</span><div class="q">${h(c.front)}</div><div class="a">${h(c.back)}</div>
      <div class="hint">${review.flipped ? 'How well did you know it? (keys 1–3)' : 'Click or press Space to reveal the answer'}</div></div>
    <div class="review-buttons">${review.flipped
      ? `<button class="lab-button danger" type="button" data-fc="grade" data-q="0">1 · Again</button><button class="lab-button secondary" type="button" data-fc="grade" data-q="1">2 · Good</button><button class="lab-button" type="button" data-fc="grade" data-q="2">3 · Easy</button><button class="lin-chip" type="button" data-fc="ask-review">Ask Lin to explain</button>`
      : `<button class="lab-button" type="button" data-fc="flip-review">Show answer</button>`}</div></div>`;
}
function flipReview() { if (!review) return; review.flipped = !review.flipped; renderReview(); }
function gradeReview(quality) {
  const c = cards.find(x => x.id === review.queue[review.index]); if (!c) return;
  const firstTime = !review.requeued?.includes(c.id);
  if (firstTime) review.seen++;
  if (quality === 0) {
    c.box = 1; c.lapses = (c.lapses || 0) + 1; c.due = Date.now();
    review.requeued = [...(review.requeued || []), c.id];
    if (review.queue.filter(id => id === c.id).length < 3) review.queue.push(c.id); // see it again this session
  } else {
    if (firstTime) review.correct++;
    c.box = Math.min(5, (c.box || 1) + quality);
    c.due = Date.now() + INTERVALS[c.box] * DAY;
  }
  c.reviews = (c.reviews || 0) + 1; c.lastReviewed = Date.now();
  saveCards(); review.index++; review.flipped = false; renderReview(); updateLabCounts();
}
document.addEventListener('keydown', e => {
  if (!review || review.index >= review.queue.length || e.target.closest('input,textarea,select,[contenteditable]') || e.altKey || e.ctrlKey || e.metaKey) return;
  if (ui.labTab !== 'flashcards') return;
  if (e.key === ' ' || e.key === 'Enter') { if (e.target.closest('button') && e.key === 'Enter') return; e.preventDefault(); flipReview(); }
  else if (review.flipped && ['1', '2', '3'].includes(e.key)) gradeReview(+e.key - 1);
});

/* generation (shared by the Lab form, topic chips and Lin chat) */
async function generateFlashcards(params, { fromLab = false } = {}) {
  const topic = String(params.topic || '').trim() || unitName(params.unit);
  const count = params.count || 8;
  const status = qs('#fc-gen-status'), btn = qs('#fc-gen-btn');
  const action = pushMessage({ kind: 'action', type: 'flashcards', status: 'pending', title: `Making ${count} flashcards`, sub: `“${topic}” · reading your notes…`, retry: params });
  if (!fromLab && root.dataset.state !== 'open') setState('open');
  if (status) { status.className = 'lab-status'; status.innerHTML = `<span class="spinner"></span> Lin is reading your notes on “${h(topic)}” and writing ${count} cards…`; }
  if (btn) btn.disabled = true;
  try {
    const deckName = params.deck || null;
    const existing = cards.filter(c => (deckName ? c.deck === deckName : c.deck.toLowerCase() === topic.toLowerCase()) || (c.sourceTopic || '').toLowerCase() === topic.toLowerCase()).map(c => c.front);
    const data = await api('flashcards', { topic, unit: params.unit || null, count, focus: params.focus || '', existing });
    const deck = deckName || data.deck;
    const now = Date.now();
    const fresh = data.cards.map((c, i) => ({ ...c, deck, createdAt: now + i, box: 1, due: now }));
    cards.push(...fresh); saveCards(); openDecks.add(deck); renderDecks();
    updateMessage(action.id, { status: 'done', title: `Saved ${fresh.length} flashcards`, sub: `Deck “${deck}” · ${unitName(data.unit)}`, btn: { type: 'deck', deck, label: 'Open deck' } });
    if (status) { status.className = 'lab-status ok'; status.textContent = `Saved ${fresh.length} new cards to “${deck}”.`; }
    if (fromLab) openDeck(deck); else toast(`Lin saved ${fresh.length} flashcards to “${deck}”.`, 'Open', () => { openLab('flashcards'); openDeck(deck); });
  } catch (err) {
    updateMessage(action.id, { status: 'failed', title: 'Couldn\'t make flashcards', sub: err.message });
    if (status) { status.className = 'lab-status error'; status.textContent = err.message; }
  } finally { if (btn) btn.disabled = false; }
}

/* ================================================================ mock exams */
const exPanel = qs('#lab-exams');
let viewAttempt = null;
let exGenerating = false;
const STYLES = {
  quick: ['Quick check', 'Multiple choice + short answers'],
  paper1: ['Paper 1 style', 'Short answer, application, concept essay'],
  paper2: ['Paper 2 style', 'Research methods + unseen study']
};
function renderExamShell() {
  exPanel.innerHTML = `
    <div class="lab-card"><h3>Generate a mock examination</h3><p>Lin writes IB Psychology SL-style questions from the notes on this site, then marks your answers against a mark scheme.</p>
      <form id="ex-gen-form">
        <div class="lab-field" style="margin-bottom:10px">Question style<div class="choice-row">${Object.entries(STYLES).map(([k, [t, d]], i) =>
          `<label class="choice"><input type="radio" name="ex-style" value="${k}" ${i === 0 ? 'checked' : ''}><span>${t}<small>${d}</small></span></label>`).join('')}</div></div>
        <div class="lab-field" style="margin-bottom:10px">Units<div class="choice-row">${C.unitOrder.map(u =>
          `<label class="choice"><input type="checkbox" name="ex-unit" value="${u}"><span>${h(unitName(u))}</span></label>`).join('')}</div></div>
        <div class="lab-form">
          <label class="lab-field grow">Focus topic (optional)<input id="ex-topic" list="lin-topic-list" placeholder="e.g. Treatment of MDD" maxlength="200"></label>
          <label class="lab-field">Questions<select id="ex-count">${[3, 4, 5, 6, 8, 10].map(n => `<option ${n === 5 ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
          <div class="lab-field" id="ex-weak-wrap" hidden><span>Weak areas</span><label class="choice"><input type="checkbox" id="ex-weak" checked><span>Target them</span></label></div>
          <button class="lab-button" type="submit" id="ex-gen-btn">Generate exam</button>
        </div>
      </form>
      <div class="lab-status" id="ex-gen-status" aria-live="polite"></div>
    </div>
    <div id="ex-area"></div>
    <h3 class="lab-subhead" id="ex-history-head">Past attempts</h3>
    <div id="ex-history" class="history-list"></div>`;
  qs('#ex-gen-form').addEventListener('submit', e => {
    e.preventDefault();
    const units = qsa('input[name="ex-unit"]:checked').map(i => i.value);
    const topic = qs('#ex-topic').value.trim();
    if (!units.length && !topic) { const s = qs('#ex-gen-status'); s.className = 'lab-status error'; s.textContent = 'Pick at least one unit or type a focus topic.'; return; }
    generateExam({ style: qs('input[name="ex-style"]:checked').value, units, topic, count: +qs('#ex-count').value, targetWeak: qs('#ex-weak')?.checked }, { fromLab: true });
  });
  // pre-tick the unit the student is studying
  const cur = qs(`input[name="ex-unit"][value="${readContext().unit}"]`); if (cur) cur.checked = true;
  exPanel.addEventListener('click', onExamClick);
  exPanel.addEventListener('input', onExamInput);
  exPanel.addEventListener('change', onExamInput);
}

async function generateExam(params, { fromLab = false } = {}) {
  if (exGenerating) { toast('Lin is already writing an exam — one moment.'); return; }
  if (exams.current && Object.values(exams.current.answers || {}).some(a => String(a).trim()) &&
      !confirm('You have an unfinished mock exam with answers. Replace it with a new exam?')) return;
  const style = params.style || 'quick';
  const label = params.topic ? `“${params.topic}”` : (params.units || []).map(unitName).join(', ') || 'your notes';
  const action = pushMessage({ kind: 'action', type: 'exam', status: 'pending', title: `Writing a ${STYLES[style][0].toLowerCase()} mock exam`, sub: `${label} · this can take up to a minute…`, retry: params });
  if (!fromLab && root.dataset.state !== 'open') setState('open');
  const status = qs('#ex-gen-status'), btn = qs('#ex-gen-btn');
  exGenerating = true;
  if (status) { status.className = 'lab-status'; status.innerHTML = `<span class="spinner"></span> Lin is writing ${params.count || 5} questions on ${h(label)} and a mark scheme… this can take up to a minute.`; }
  if (btn) btn.disabled = true;
  try {
    const weaknesses = params.targetWeak === false ? [] : aggregateWeaknesses().filter(w => !params.units?.length || !w.unit || params.units.includes(w.unit)).slice(0, 4).map(w => `${w.topic}: ${w.issue}`);
    const data = await api('exam', { style, units: params.units || [], topic: params.topic || '', count: params.count || 5, weaknesses });
    exams.current = { exam: data.exam, answers: {}, startedAt: Date.now() };
    viewAttempt = null; saveExams(); renderExams();
    updateMessage(action.id, { status: 'done', title: `Mock exam ready: ${data.exam.questions.length} questions, ${data.exam.totalMarks} marks`, sub: `${data.exam.title} · about ${data.exam.suggestedMinutes} min`, btn: { type: 'exam', label: 'Start exam' } });
    if (status) { status.className = 'lab-status ok'; status.textContent = 'Your exam is ready below. Good luck!'; }
    if (fromLab) qs('#ex-area')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else toast('Your mock exam is ready.', 'Start', () => openLab('exams'));
  } catch (err) {
    updateMessage(action.id, { status: 'failed', title: 'Couldn\'t create the mock exam', sub: err.message });
    if (status) { status.className = 'lab-status error'; status.textContent = err.message; }
  } finally { exGenerating = false; if (btn) btn.disabled = false; }
}

function renderExams() {
  updateLabCounts();
  const area = qs('#ex-area'); if (!area) return;
  const weakWrap = qs('#ex-weak-wrap'); if (weakWrap) weakWrap.hidden = !aggregateWeaknesses().length;
  const attempt = viewAttempt && exams.attempts.find(a => a.id === viewAttempt);
  if (attempt) area.innerHTML = renderResults(attempt);
  else if (exams.current) area.innerHTML = renderExamSheet(exams.current);
  else area.innerHTML = '<div class="lab-empty">No exam in progress. Generate one above, use "Mock exam" on any topic in the notes, or ask Lin for one.</div>';
  const hist = qs('#ex-history');
  qs('#ex-history-head').hidden = !exams.attempts.length;
  hist.innerHTML = exams.attempts.map(a => `<div class="history-item"><strong>${h(a.exam.title)}<small>${h(STYLES[a.exam.style]?.[0] || 'Mock exam')} · ${new Date(a.submittedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} · ${a.exam.units.map(unitName).join(', ')}</small></strong>
    <span class="history-score">${a.result.percent}%</span><span class="deck-meta">${a.result.score}/${a.result.total}</span>
    <button class="lab-button small secondary" type="button" data-ex="view" data-id="${h(a.id)}">Review</button><button class="lab-button small secondary" type="button" data-ex="retake" data-id="${h(a.id)}">Retake</button>
    <button class="text-button" type="button" data-ex="delete-attempt" data-id="${h(a.id)}">Delete</button></div>`).join('');
}
function renderExamSheet(cur) {
  const ex = cur.exam;
  const answered = ex.questions.filter(q => String(cur.answers[q.id] ?? '').trim()).length;
  return `<div class="exam-sheet" id="exam-sheet">
    <div class="exam-head"><div><span class="eyebrow">${h((STYLES[ex.style]?.[0] || 'Mock exam').toUpperCase())} · ${h(ex.units.map(unitName).join(' · ').toUpperCase())}</span><h3>${h(ex.title)}</h3><p>${h(ex.instructions)}</p></div>
      <div class="exam-stats"><div><b>${ex.questions.length}</b>questions</div><div><b>${ex.totalMarks}</b>marks</div><div><b>${ex.suggestedMinutes}</b>minutes</div></div></div>
    ${ex.questions.map((q, i) => `<div class="exam-q" data-q="${h(q.id)}">
      <div class="exam-q-meta"><span>QUESTION ${i + 1}</span>${q.section ? `<span>· ${h(q.section)}</span>` : ''}${q.commandTerm ? `<span>· ${h(q.commandTerm)}</span>` : ''}<span class="marks">[${q.marks} mark${q.marks === 1 ? '' : 's'}]</span></div>
      ${q.stimulus ? `<div class="stimulus">${h(q.stimulus)}</div>` : ''}<h4>${h(q.prompt)}</h4>
      ${q.type === 'mcq' ? `<div class="mcq-options" role="radiogroup">${q.options.map((o, j) => `<label class="mcq-option"><input type="radio" name="ans-${h(q.id)}" value="${j}" data-ans="${h(q.id)}" ${String(cur.answers[q.id]) === String(j) ? 'checked' : ''}><span>${String.fromCharCode(65 + j)}. ${h(o)}</span></label>`).join('')}</div>`
        : `<textarea class="exam-answer ${q.marks >= 8 ? 'long' : ''}" data-ans="${h(q.id)}" placeholder="Write your answer…" aria-label="Answer to question ${i + 1}">${h(cur.answers[q.id] || '')}</textarea><div class="word-count" data-wc="${h(q.id)}">${wordCount(cur.answers[q.id])} words</div>`}
    </div>`).join('')}
    <div class="exam-submit"><span id="ex-answered">${answered} of ${ex.questions.length} answered · answers are saved as you type</span>
      <div style="display:flex;gap:8px"><button class="lab-button secondary" type="button" data-ex="discard">Discard</button><button class="lab-button" type="button" data-ex="submit" id="ex-submit">Submit for marking</button></div></div>
    <div class="lab-status" id="ex-grade-status" style="padding:0 22px 16px" aria-live="polite"></div>
  </div>`;
}
const wordCount = t => (String(t || '').trim().match(/\S+/g) || []).length;
let saveTimer;
function onExamInput(e) {
  const el = e.target.closest('[data-ans]'); if (!el || !exams.current) return;
  const id = el.dataset.ans;
  exams.current.answers[id] = el.type === 'radio' ? +el.value : el.value;
  const wc = qs(`[data-wc="${CSS.escape(id)}"]`); if (wc) wc.textContent = `${wordCount(el.value)} words`;
  const ex = exams.current.exam;
  const answered = ex.questions.filter(q => String(exams.current.answers[q.id] ?? '').trim()).length;
  const lbl = qs('#ex-answered'); if (lbl) lbl.textContent = `${answered} of ${ex.questions.length} answered · answers are saved as you type`;
  clearTimeout(saveTimer); saveTimer = setTimeout(() => { saveTimer = null; saveExams(); }, 400);
}
// Never lose the last keystrokes if the tab is closed or reloaded mid-exam.
const flushExamSave = () => { if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; saveExams(); } };
window.addEventListener('pagehide', flushExamSave);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushExamSave(); });
async function onExamClick(e) {
  const btn = e.target.closest('[data-ex]'); if (!btn) return;
  const act = btn.dataset.ex, id = btn.dataset.id;
  if (act === 'discard') { if (confirm('Discard this exam and your answers?')) { exams.current = null; saveExams(); renderExams(); } }
  else if (act === 'submit') submitExam(btn);
  else if (act === 'view') { viewAttempt = id; renderExams(); qs('#ex-area').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  else if (act === 'close-results') { viewAttempt = null; renderExams(); }
  else if (act === 'retake') {
    const a = exams.attempts.find(x => x.id === id); if (!a) return;
    if (exams.current && !confirm('Replace your exam in progress with this retake?')) return;
    exams.current = { exam: a.exam, answers: {}, startedAt: Date.now() }; viewAttempt = null; saveExams(); renderExams();
    qs('#ex-area').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  else if (act === 'delete-attempt') { if (confirm('Delete this attempt from your history?')) { exams.attempts = exams.attempts.filter(x => x.id !== id); if (viewAttempt === id) viewAttempt = null; saveExams(); renderExams(); } }
  else if (act === 'ask-q') {
    const a = exams.attempts.find(x => x.id === viewAttempt); const q = a?.exam.questions.find(x => x.id === btn.dataset.q); const r = a?.result.results.find(x => x.id === btn.dataset.q);
    if (q && r) ask(`In my mock exam I got ${r.mark}/${r.max} on this question.\nQuestion: ${q.prompt}${q.stimulus ? `\n(Stimulus: ${q.stimulus.slice(0, 600)})` : ''}\nMy answer: ${q.type === 'mcq' ? (q.options[a.answers[q.id]] ?? 'no answer') : String(a.answers[q.id] || '(blank)').slice(0, 1500)}\nFeedback: ${r.feedback}\nExplain why my answer was or wasn't correct, using my notes, and show me how to reach full marks.`);
  }
}
async function submitExam(btn) {
  const cur = exams.current; if (!cur) return;
  const blanks = cur.exam.questions.filter(q => !String(cur.answers[q.id] ?? '').trim()).length;
  if (blanks && !confirm(`${blanks} question${blanks === 1 ? ' is' : 's are'} unanswered and will score 0. Submit anyway?`)) return;
  const status = qs('#ex-grade-status');
  btn.disabled = true; status.className = 'lab-status'; status.innerHTML = '<span class="spinner"></span> Lin is marking your answers against the mark scheme…';
  try {
    const result = await api('grade', { exam: cur.exam, answers: cur.answers });
    const attempt = { id: uid('att'), exam: cur.exam, answers: cur.answers, result, startedAt: cur.startedAt, submittedAt: Date.now() };
    exams.attempts.unshift(attempt); exams.attempts = exams.attempts.slice(0, 40);
    exams.current = null; viewAttempt = attempt.id; saveExams(); renderExams();
    qs('#ex-area').scrollIntoView({ behavior: 'smooth', block: 'start' });
    pushMessage({ kind: 'action', type: 'exam', status: 'done', title: `Marked: ${result.score}/${result.total} (${result.percent}%)`, sub: `${cur.exam.title}${result.weaknesses?.length ? ` · ${result.weaknesses.length} area${result.weaknesses.length === 1 ? '' : 's'} to revise` : ''}`, btn: { type: 'attempt', id: attempt.id, label: 'See feedback' } });
  } catch (err) {
    status.className = 'lab-status error'; status.textContent = `${err.message} Your answers are saved — try submitting again.`; btn.disabled = false;
  }
}
function weaknessActions(w) {
  const nb = findNotebookTopic(w.topic, w.unit);
  return `<div class="lin-topic-actions">
    <button class="lin-chip coral" type="button" data-weak="flashcards" data-topic="${h(w.topic)}" data-unit="${h(w.unit || '')}" data-issue="${h(w.issue)}">Flashcards on this</button>
    <button class="lin-chip" type="button" data-weak="explain" data-topic="${h(w.topic)}" data-issue="${h(w.issue)}">Explain with Lin</button>
    ${nb ? `<button class="lin-chip" type="button" data-weak="notes" data-topic="${h(nb.title)}" data-unit="${h(nb.unit)}" data-type="${h(nb.type)}">Open in notes</button>` : ''}</div>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-weak]'); if (!b) return;
  const { weak, topic, unit, issue, type } = b.dataset;
  if (weak === 'flashcards') generateFlashcards({ topic, unit: unit || null, count: 8, focus: issue });
  else if (weak === 'explain') ask(`I'm weak on "${topic}" — ${issue}. Teach it to me from my notes, then give me two quick check questions.`);
  else if (weak === 'notes') openTopic(topic, unit, type);
});
function renderResults(a) {
  const r = a.result, ex = a.exam;
  const band = r.percent >= 80 ? 'Excellent work' : r.percent >= 60 ? 'Solid — a few gaps to close' : r.percent >= 40 ? 'Getting there' : 'Keep going — focus on the weak areas below';
  return `<div class="exam-sheet">
    <div class="result-hero"><div class="score-ring" style="--p:${r.percent}"><div><span><b>${r.score}/${r.total}</b><small>${r.percent}%</small></span></div></div>
      <div class="result-summary"><span class="eyebrow">RESULTS · ${h(ex.title.toUpperCase())}</span><h3>${band}</h3><p>${h(r.summary || '')}</p></div>
      <button class="lab-button secondary small" type="button" data-ex="close-results">Close</button></div>
    ${(r.strengths?.length || r.nextSteps?.length) ? `<div class="result-cols"><div><h4>Strengths</h4><ul>${(r.strengths || []).map(s => `<li>${h(s)}</li>`).join('') || '<li>—</li>'}</ul></div><div><h4>Next steps</h4><ul>${(r.nextSteps || []).map(s => `<li>${h(s)}</li>`).join('') || '<li>—</li>'}</ul></div></div>` : ''}
    ${r.weaknesses?.length ? `<div class="weak-list"><h4>Areas that need revision</h4>${r.weaknesses.map(w => `<div class="weak-item"><strong>${h(w.topic)}${w.unit ? ` · ${h(unitName(w.unit))}` : ''}</strong><p>${h(w.issue)}</p><p><b>Revise:</b> ${h(w.revise)}</p>${weaknessActions(w)}</div>`).join('')}</div>` : ''}
    ${ex.questions.map((q, i) => {
      const res = r.results.find(x => x.id === q.id) || { mark: 0, max: q.marks, feedback: '' };
      const cls = res.mark >= res.max ? 'full' : res.mark > 0 ? 'part' : 'zero';
      const ans = a.answers[q.id];
      return `<div class="exam-q q-result"><div class="exam-q-meta"><span>QUESTION ${i + 1}</span>${q.commandTerm ? `<span>· ${h(q.commandTerm)}</span>` : ''}<span>· ${h(q.topic)}</span><span class="mark-badge ${cls}">${res.mark}/${res.max}</span></div>
        ${q.stimulus ? `<div class="stimulus">${h(q.stimulus)}</div>` : ''}<h4>${h(q.prompt)}</h4>
        ${q.type === 'mcq' ? `<div class="mcq-options">${q.options.map((o, j) => `<div class="mcq-option ${j === q.correct ? 'correct' : String(ans) === String(j) ? 'incorrect' : ''}">${String.fromCharCode(65 + j)}. ${h(o)}${j === q.correct ? ' ✓' : String(ans) === String(j) ? ' — your answer' : ''}</div>`).join('')}</div>`
          : `<div class="your-answer ${String(ans || '').trim() ? '' : 'blank'}">${h(String(ans || '').trim() || 'No answer given')}</div>`}
        <div class="feedback-box">${h(res.feedback)}${res.improvements?.length ? `<ul>${res.improvements.map(s => `<li>${h(s)}</li>`).join('')}</ul>` : ''}</div>
        ${q.type !== 'mcq' && (res.modelAnswer || q.markscheme?.length) ? `<details class="model"><summary>Model answer and mark scheme</summary><div>${h(res.modelAnswer || '')}${q.markscheme?.length ? `\n\nMark scheme:\n${q.markscheme.map(p => '• ' + p).join('\n')}` : ''}</div></details>` : ''}
        <div class="lin-topic-actions"><button class="lin-chip" type="button" data-ex="ask-q" data-q="${h(q.id)}">Ask Lin why</button></div></div>`;
    }).join('')}
  </div>`;
}

/* ================================================================ progress */
function aggregateWeaknesses() {
  const map = new Map();
  exams.attempts.slice(0, 8).forEach((a, idx) => (a.result.weaknesses || []).forEach(w => {
    const key = String(w.topic || '').toLowerCase(); if (!key) return;
    const prev = map.get(key);
    if (prev) prev.count++; else map.set(key, { ...w, count: 1, recency: idx });
  }));
  return [...map.values()].sort((a, b) => b.count - a.count || a.recency - b.recency);
}
function renderProgress() {
  const el = qs('#lab-progress'); if (!el) return;
  const due = cards.filter(c => (c.due || 0) <= Date.now()).length;
  const avg = exams.attempts.length ? Math.round(exams.attempts.reduce((s, a) => s + a.result.percent, 0) / exams.attempts.length) : null;
  const unitStats = {};
  exams.attempts.forEach(a => a.exam.questions.forEach(q => { const r = a.result.results.find(x => x.id === q.id); if (!r) return; const u = q.unit || a.exam.units[0]; unitStats[u] = unitStats[u] || { s: 0, t: 0 }; unitStats[u].s += r.mark; unitStats[u].t += r.max; }));
  const weak = aggregateWeaknesses();
  el.innerHTML = `
    <div class="progress-grid"><div><strong>${cards.length}</strong><span>Flashcards</span></div><div><strong>${due}</strong><span>Due for review</span></div>
      <div><strong>${exams.attempts.length}</strong><span>Mock exams taken</span></div><div><strong>${avg === null ? '–' : avg + '%'}</strong><span>Average exam score</span></div></div>
    <h3 class="lab-subhead">Exam performance by unit</h3>
    ${Object.keys(unitStats).length ? `<div class="unit-bars">${C.unitOrder.filter(u => unitStats[u]).map(u => { const p = Math.round(unitStats[u].s / unitStats[u].t * 100); return `<div class="unit-bar"><span>${h(unitName(u))}</span><span class="track"><span style="width:${p}%"></span></span><b>${p}%</b></div>`; }).join('')}</div>` : '<div class="lab-empty">Take a mock exam to see your performance by unit.</div>'}
    <h3 class="lab-subhead">Areas to revise</h3>
    ${weak.length ? weak.slice(0, 8).map(w => `<div class="weak-item"><strong>${h(w.topic)}${w.count > 1 ? ` · flagged ${w.count}×` : ''}</strong><p>${h(w.issue)}</p>${w.revise ? `<p><b>Revise:</b> ${h(w.revise)}</p>` : ''}${weaknessActions(w)}</div>`).join('') : '<div class="lab-empty">No weak areas recorded yet. Lin identifies them when it marks your mock exams.</div>'}
    <h3 class="lab-subhead">Your data</h3>
    <p class="content-count" style="font-size:12px">Flashcards, exam attempts and chat history are stored in this browser only. Export your flashcards from the Flashcards tab to back them up or move them to another device.</p>
    <button class="lab-button danger small" type="button" id="lin-reset">Clear all Study Lab data</button>`;
  qs('#lin-reset').onclick = () => {
    if (!confirm('Delete ALL flashcards, exam attempts and Lin chat history from this browser? This cannot be undone.')) return;
    cards = []; exams = { current: null, attempts: [] }; chat = []; saveCards(); saveExams(); saveChat();
    review = null; viewAttempt = null; renderReview(); renderDecks(); renderExams(); renderProgress(); renderMessages();
  };
}

/* ================================================================ boot */
renderFlashcardsShell(); renderDecks();
renderExamShell(); renderExams();
setLabTab(ui.labTab || 'flashcards');
updateContextChip();
setState(ui.state === 'open' && window.innerWidth < 600 ? 'minimised' : (ui.state || 'minimised'));
// Small public hook for debugging / future features.
window.Lin = { ask, open: () => setState('open'), minimise: () => setState('minimised'), hide: () => setState('hidden'), generateFlashcards, generateExam };
})();
