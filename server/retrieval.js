/* Lin — course-content retrieval.
   Builds a searchable index from content.js (the same data the website renders) so that every
   answer, flashcard and exam question Lin produces is grounded in the platform's own notes.
   Pure Node, no dependencies: BM25 ranking over topic, glossary, study, practice and quiz chunks. */
'use strict';
const CONTENT = require('../content.js');

const STOP = new Set(('a an and are as at be been but by can could did do does for from had has have how i if in into is it its ' +
  'me my of on or our so such than that the their them then there these they this to was we were what when where which ' +
  'who why will with would you your about also any each more most other some only own same very just over under between ' +
  'explain describe outline evaluate discuss compare contrast define give make tell please lin using use one two').split(/\s+/));

function slug(text) {
  return String(text).toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}
function stem(word) {
  if (word.length > 5 && word.endsWith('ies')) return word.slice(0, -3) + 'y';
  if (word.length > 5 && word.endsWith('ing')) return word.slice(0, -3);
  if (word.length > 4 && word.endsWith('ed')) return word.slice(0, -2);
  if (word.length > 4 && word.endsWith('es') && !word.endsWith('ses')) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}
function tokenize(text) {
  return String(text).toLowerCase().replace(/[’']/g, '').split(/[^a-z0-9]+/)
    .filter(w => w.length > 1 && !STOP.has(w)).map(stem);
}

function buildChunks() {
  const { course, glossary, studies, practice, quizBank, unitOrder, unitNames } = CONTENT;
  const chunks = [];
  for (const unit of unitOrder) {
    const u = course[unit];
    chunks.push({ id: `unit:${unit}`, type: 'unit', unit, title: u.title, group: '',
      text: `${u.title}. ${u.description} Sections: ${u.groups.map(g => g[0]).join('; ')}.` });
    for (const [groupTitle, rows] of u.groups) {
      for (const row of rows) {
        const [title, definition, body, example, terms] = row;
        chunks.push({ id: `topic:${unit}:${slug(title)}`, type: 'topic', unit, group: groupTitle, title,
          text: [definition, body, example ? `Example / application: ${example}` : '', terms ? `Key terms: ${terms}` : '']
            .filter(Boolean).join('\n') });
      }
    }
    for (const [term, definition] of Object.entries(glossary[unit] || {})) {
      chunks.push({ id: `term:${unit}:${slug(term)}`, type: 'glossary', unit, group: 'Glossary', title: term, text: definition });
    }
    for (const [title, covers, use] of studies[unit] || []) {
      chunks.push({ id: `study:${unit}:${slug(title)}`, type: 'study', unit, group: 'Research studies', title,
        text: `${covers}\nHow to use this in an answer: ${use}` });
    }
    (practice[unit] || []).forEach(([q, guide], i) => {
      chunks.push({ id: `practice:${unit}:${i}`, type: 'practice', unit, group: 'Exam practice', title: q,
        text: `Planning guidance: ${guide}` });
    });
    (quizBank[unit] || []).forEach((item, i) => {
      chunks.push({ id: `quiz:${unit}:${i}`, type: 'quiz', unit, group: 'Quick quiz', title: item.q,
        text: `Correct answer: ${item.a[item.c]}. ${item.e}` });
    });
  }
  for (const c of chunks) {
    c.unitName = unitNames[c.unit];
    c.titleTokens = tokenize(c.title);
    c.tokens = tokenize(`${c.title} ${c.title} ${c.group} ${c.text}`);
    c.tf = new Map();
    for (const t of c.tokens) c.tf.set(t, (c.tf.get(t) || 0) + 1);
  }
  return chunks;
}

const CHUNKS = buildChunks();
const BY_ID = new Map(CHUNKS.map(c => [c.id, c]));
const AVG_LEN = CHUNKS.reduce((s, c) => s + c.tokens.length, 0) / CHUNKS.length;
const DF = new Map();
for (const c of CHUNKS) for (const t of new Set(c.tokens)) DF.set(t, (DF.get(t) || 0) + 1);
const TYPE_WEIGHT = { topic: 1.25, study: 1.0, glossary: 0.9, unit: 0.7, practice: 0.75, quiz: 0.6 };

/** Rank course chunks for a free-text query.
 *  opts.unit: restrict to a unit; opts.preferUnit: boost (not restrict); opts.types: allowed chunk types. */
function search(query, opts = {}) {
  const { unit, preferUnit, types, limit = 8 } = opts;
  const q = tokenize(query);
  const qLower = String(query).toLowerCase();
  const k1 = 1.4, b = 0.75, N = CHUNKS.length;
  const scored = [];
  for (const c of CHUNKS) {
    if (unit && c.unit !== unit) continue;
    if (types && !types.includes(c.type)) continue;
    let score = 0;
    for (const t of q) {
      const f = c.tf.get(t);
      if (!f) continue;
      const idf = Math.log(1 + (N - DF.get(t) + 0.5) / (DF.get(t) + 0.5));
      score += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * c.tokens.length / AVG_LEN));
      if (c.titleTokens.includes(t)) score += idf * 0.8;
    }
    if (!score) continue;
    if (c.title.length > 3 && qLower.includes(c.title.toLowerCase())) score *= 1.6; // exact title mentioned
    score *= TYPE_WEIGHT[c.type] || 1;
    if (preferUnit && c.unit === preferUnit) score *= 1.3;
    scored.push({ chunk: c, score });
  }
  scored.sort((a, b2) => b2.score - a.score);
  return scored.slice(0, limit).map(s => ({ ...publicChunk(s.chunk), score: +s.score.toFixed(3) }));
}

function publicChunk(c) {
  return { id: c.id, type: c.type, unit: c.unit, unitName: c.unitName, group: c.group, title: c.title, text: c.text };
}
function getChunk(id) { const c = BY_ID.get(id); return c ? publicChunk(c) : null; }
function findTopicByTitle(title, unit) {
  const t = String(title || '').trim().toLowerCase();
  if (!t) return null;
  const c = CHUNKS.find(x => (x.type === 'topic' || x.type === 'study') && x.title.toLowerCase() === t && (!unit || x.unit === unit));
  return c ? publicChunk(c) : null;
}
/** All topic chunks of the given units (used to build whole-unit exams). */
function unitTopics(units) {
  return CHUNKS.filter(c => units.includes(c.unit) && (c.type === 'topic' || c.type === 'study')).map(publicChunk);
}
/** Render chunks as a compact, labelled block for the model prompt, capped by characters. */
function formatForPrompt(chunks, maxChars = 14000) {
  let out = '', used = 0;
  for (const c of chunks) {
    const label = c.type === 'glossary' ? 'Key term' : c.type === 'study' ? 'Research study reference' :
      c.type === 'practice' ? 'Practice question' : c.type === 'quiz' ? 'Quiz item' : c.type === 'unit' ? 'Unit overview' : 'Topic';
    const block = `[${c.id}] ${label}: "${c.title}" — ${c.unitName}${c.group ? ' › ' + c.group : ''}\n${c.text}\n\n`;
    if (used + block.length > maxChars) break;
    out += block; used += block.length;
  }
  return out.trim();
}
/** Merge several result lists, de-duplicating by id and keeping order. */
function mergeResults(...lists) {
  const seen = new Set(), out = [];
  for (const list of lists) for (const c of list || []) if (c && !seen.has(c.id)) { seen.add(c.id); out.push(c); }
  return out;
}

module.exports = { search, getChunk, findTopicByTitle, unitTopics, formatForPrompt, mergeResults,
  UNITS: CONTENT.unitOrder, UNIT_NAMES: CONTENT.unitNames, chunkCount: CHUNKS.length };
