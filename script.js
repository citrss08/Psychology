/* IB Psychology SL 2027 — interactive study site.
   Notes are paraphrased from the supplied class PDFs. Key-term wording follows their end-of-unit lists.
   The glossary definitions are concise revision explanations; check your teacher's wording where required. */
'use strict';
// Course data now lives in content.js (shared with Lin's server-side retrieval).
const { course, glossary, quizBank, unitOrder, unitNames } = window.PSYCH_CONTENT;
const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
let currentUnit = 'investigations';
let currentTab = 'notes';
let quizIndex = 0;
let quizAnswered = false;
function esc(value=''){return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
// The course content is stored as compact arrays from the supplied notes:
// [topic title, core explanation, extra explanation, example, semicolon-separated terms].
// Convert those arrays into objects before rendering so every unit uses one consistent format.
function topicFromRow(row){
 return {
  title: row[0] || '',
  definition: row[1] || '',
  body: row[2] || '',
  example: row[3] || '',
  terms: row[4] ? row[4].split(';').map(term => term.trim()).filter(Boolean) : []
 };
}
function topicSearchText(topic){
 return [topic.title,topic.definition,topic.body,topic.example,topic.why,topic.evaluation,
  ...(topic.sections||[]).flatMap(section=>[section.heading,section.body,...(section.points||[])])]
  .join(' ').toLowerCase();
}
function renderTopic(topic,index){
 const sections=(topic.sections||[]).map(section=>`<section class="detail-section"><h4>${esc(section.heading)}</h4><p>${esc(section.body)}</p>${section.points?.length?`<ul>${section.points.map(point=>`<li>${esc(point)}</li>`).join('')}</ul>`:''}</section>`).join('');
 return `<article class="topic-card"><button class="topic-toggle" type="button" aria-expanded="false"><span class="toggle-title"><span class="toggle-number">${String(index+1).padStart(2,'0')}</span>${esc(topic.title)}</span><span class="toggle-chevron">⌄</span></button><div class="topic-body"><div class="definition"><span class="box-label">CORE IDEA</span>${esc(topic.definition)}</div><p>${esc(topic.body)}</p>${topic.example?`<div class="example-box"><span class="box-label">EXAMPLE / APPLICATION</span>${esc(topic.example)}</div>`:''}${topic.why?`<div class="why-box"><span class="box-label">WHY IT MATTERS</span>${esc(topic.why)}</div>`:''}${topic.evaluation?`<div class="evaluation-box"><span class="box-label">EVALUATION</span>${esc(topic.evaluation)}</div>`:''}${sections}${topic.terms.length?`<div class="pill-row">${topic.terms.map(term=>`<span class="pill">${esc(term)}</span>`).join('')}</div>`:''}</div></article>`;
}
function renderNotes(query=''){
 const unit=course[currentUnit];let html='',count=0;const q=query.trim().toLowerCase();
 (unit.groups||[]).forEach(group=>{
  const groupTitle=group[0] || 'Course notes';
  const topicRows=group[1] || [];
  const matched=topicRows.map(topicFromRow).filter(topic=>!q||topicSearchText(topic).includes(q));
  if(!matched.length)return;
  html+=`<div class="content-group"><h3 class="group-heading">${esc(groupTitle)}</h3>`;
  matched.forEach(topic=>{html+=renderTopic(topic,count++);});
  html+='</div>';
 });
 $('#unit-content').innerHTML=html||'<div class="empty-state">No notes match that search. Try another keyword.</div>';
 $('#content-count').textContent=`${count} topic${count===1?'':'s'}`;
}
function renderStudies(query=''){
 const q=query.toLowerCase();let html='',count=0;
 const studies=window.PSYCH_CONTENT.studies;
 (studies[currentUnit]||[]).forEach((s,i)=>{if((s.join(' ')).toLowerCase().includes(q)){count++;html+=`<article class="study-card"><button class="study-toggle" type="button" aria-expanded="false"><span class="toggle-title">${esc(s[0])}<small class="study-subtitle">CLASS HANDOUT CONNECTION</small></span><span class="toggle-chevron">⌄</span></button><div class="study-body"><p>${esc(s[1])}</p><div class="evaluation-box"><span class="box-label">HOW TO USE THIS IN AN ANSWER</span>${esc(s[2])}</div></div></article>`;}});
 $('#unit-content').innerHTML=html||'<div class="empty-state">No study references match that search.</div>';$('#content-count').textContent=`${count} reference${count===1?'':'s'}`;
}
function renderPractice(query=''){
 const prompts=window.PSYCH_CONTENT.practice;
 let count=0,html='';(prompts[currentUnit]||[]).forEach((p,i)=>{if(p[0].toLowerCase().includes(query.toLowerCase())||p[1].toLowerCase().includes(query.toLowerCase())){count++;html+=`<article class="practice-card"><div class="question-meta">IB-STYLE PRACTICE · ${i+1}</div><h3>${esc(p[0])}</h3><button class="reveal-button" type="button">Show planning guidance</button><div class="practice-body"><p>${esc(p[1])}</p><div class="exam-tip"><span class="box-label">ANSWER CHECK</span>Define the relevant term, apply it to the question, use specific evidence where available, and evaluate the limits of the explanation.</div></div></article>`;}});
 $('#unit-content').innerHTML=html||'<div class="empty-state">No practice prompts match that search.</div>';$('#content-count').textContent=`${count} question${count===1?'':'s'}`;
}
function renderQuiz(){
 const list=quizBank[currentUnit]||[];if(!list.length){$('#unit-content').innerHTML='<div class="empty-state">Quiz questions are being prepared.</div>';return;}
 const item=list[quizIndex%list.length];
 $('#unit-content').innerHTML=`<article class="quiz-card"><div class="quiz-progress">QUESTION ${(quizIndex%list.length)+1} OF ${list.length}</div><h3>${esc(item.q)}</h3><div class="quiz-options">${item.a.map((a,i)=>`<button class="quiz-option" type="button" data-answer="${i}">${String.fromCharCode(65+i)}. ${esc(a)}</button>`).join('')}</div><button class="check-button" type="button" disabled>Check answer</button><div class="quiz-feedback" role="status"></div><button class="next-button" type="button" hidden>Next question →</button></article>`;
}
function render(){
 const unit=course[currentUnit];$('#unit-eyebrow').textContent=unit.number||`UNIT 0${unitOrder.indexOf(currentUnit)+1}`;$('#unit-title').textContent=unit.title;$('#unit-description').textContent=unit.description;$('#unit-tag').textContent=unit.tag;
 $$('.unit-card').forEach(card=>card.classList.toggle('active',card.dataset.unit===currentUnit));
 $$('.tab').forEach(tab=>{const active=tab.dataset.tab===currentTab;tab.classList.toggle('active',active);tab.setAttribute('aria-selected',String(active));});
 const q=$('#course-search').value||'';
 if(currentTab==='notes')renderNotes(q);else if(currentTab==='studies')renderStudies(q);else if(currentTab==='practice')renderPractice(q);else renderQuiz();
 const showExpand=currentTab==='notes'||currentTab==='studies';$('.expand-controls').hidden=!showExpand;$('#course-search').placeholder=currentTab==='notes'?'Search notes in this section...':`Search ${currentTab}...`;
}
function renderGlossary(){
 const q=($('#glossary-search').value||'').trim().toLowerCase(),filter=$('#glossary-unit').value;
 let entries=[];
 unitOrder.forEach(unit=>{if(filter!=='all'&&filter!==unit)return;Object.entries(glossary[unit]||{}).forEach(([term,definition])=>{if(!q||(term+' '+definition).toLowerCase().includes(q))entries.push({term,definition,unit});});});
 entries.sort((a,b)=>a.term.localeCompare(b.term));
 $('#glossary-count').textContent=`${entries.length} definition${entries.length===1?'':'s'} found`;
 $('#glossary-results').innerHTML=entries.length?entries.map(e=>`<article class="glossary-item"><h3>${esc(e.term)}</h3><p>${esc(e.definition)}</p><span class="glossary-unit">${esc(unitNames[e.unit])}</span></article>`).join(''):'<div class="empty-state">No matching terms. Try a shorter search or choose another unit.</div>';
}
document.addEventListener('click',event=>{
 const unitButton=event.target.closest('.unit-card');
 if(unitButton){currentUnit=unitButton.dataset.unit;currentTab='notes';quizIndex=0;quizAnswered=false;$('#course-search').value='';render();$('#study-area').scrollIntoView({behavior:'smooth',block:'start'});return;}
 const tab=event.target.closest('.tab');
 if(tab){currentTab=tab.dataset.tab;if(currentTab==='quiz')quizAnswered=false;render();return;}
 const topicToggle=event.target.closest('.topic-toggle,.study-toggle');
 if(topicToggle){const card=topicToggle.closest('.topic-card,.study-card');const open=card.classList.toggle('is-open');topicToggle.setAttribute('aria-expanded',String(open));return;}
 if(event.target.closest('#expand-all')){$$('.topic-card,.study-card').forEach(c=>{c.classList.add('is-open');const b=$('.topic-toggle,.study-toggle',c);if(b)b.setAttribute('aria-expanded','true');});return;}
 if(event.target.closest('#collapse-all')){$$('.topic-card,.study-card').forEach(c=>{c.classList.remove('is-open');const b=$('.topic-toggle,.study-toggle',c);if(b)b.setAttribute('aria-expanded','false');});return;}
 const reveal=event.target.closest('.reveal-button');
 if(reveal){reveal.nextElementSibling.classList.toggle('visible');const body=reveal.parentElement.querySelector('.practice-body');body.style.display=body.style.display==='block'?'none':'block';return;}
 const option=event.target.closest('.quiz-option');
 if(option&&!quizAnswered){$$('.quiz-option').forEach(b=>b.classList.remove('selected'));option.classList.add('selected');$('.check-button').disabled=false;return;}
 if(event.target.closest('.check-button')&&!quizAnswered){
  const item=quizBank[currentUnit][quizIndex%quizBank[currentUnit].length],selected=$('.quiz-option.selected'),feedback=$('.quiz-feedback');
  if(!selected)return;quizAnswered=true;const correct=Number(selected.dataset.answer)===item.c;
  $$('.quiz-option').forEach((b,i)=>{if(i===item.c)b.classList.add('correct');else if(b===selected)b.classList.add('incorrect');});
  feedback.textContent=(correct?'Correct. ':'Not quite. ')+item.e;feedback.className='quiz-feedback visible '+(correct?'good':'bad');$('.next-button').hidden=false;$('.check-button').disabled=true;return;
 }
 if(event.target.closest('.next-button')){quizIndex++;quizAnswered=false;renderQuiz();return;}
});
document.addEventListener('input',event=>{if(event.target.id==='course-search'){if(currentTab==='notes')renderNotes(event.target.value);else if(currentTab==='studies')renderStudies(event.target.value);else if(currentTab==='practice')renderPractice(event.target.value);}});
$('#glossary-search').addEventListener('input',renderGlossary);
$('#glossary-unit').addEventListener('change',renderGlossary);
render();renderGlossary();
