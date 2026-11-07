/* ===== CONTENT: add more notes/questions by copying an object ===== */
const UNITS = [
{ id:1, name:"Psychological investigations", blurb:"How psychologists collect evidence, and how far we can trust it.",
 notes:[
 {h:"Experiments and causation", p:"An experiment manipulates an independent variable (IV) and measures the dependent variable (DV) while controlling other variables. Why does this allow cause-and-effect claims? Because random allocation spreads participant differences evenly across conditions, so a difference in the DV is most plausibly due to the IV. Lab experiments give the strongest control (high internal validity) but the setting can be artificial, so findings may not generalise (low ecological validity)."},
 {h:"Sampling", p:"Random sampling gives everyone an equal chance of selection, which reduces bias but is hard to achieve. Convenience sampling is quick, yet it often over-represents students or one culture, so results may not apply to other groups. Why does this matter? A sample that differs from the target population limits population validity."},
 {h:"Reliability and validity", p:"Reliability is consistency: would the same procedure give the same result again? Validity is accuracy: does the study measure what it claims to? A study can be reliable without being valid (a faulty scale that always shows 2 kg too much), but it cannot be valid if it is unreliable."},
 {h:"Ethics", p:"Key principles include informed consent, protection from harm, confidentiality, right to withdraw and debriefing. Why is deception sometimes used? Knowing the real aim can change behaviour (demand characteristics), so researchers weigh the scientific value against the cost to participants and must debrief afterwards."}],
 tips:["Always link a strength or limitation to its effect on the findings, not just name it.","When evaluating a method, use the pattern: point, evidence from a study, consequence for validity or generalisability."],
 qs:[
 {paper:"Paper 1", marks:"Describe", q:"Describe one ethical consideration in psychological research.", how:"Name the consideration, define it, then show how it is applied in practice. Two or three developed points beat a list.", a:"Informed consent means participants are told the purpose, procedure and their rights before agreeing to take part. Researchers usually provide a consent form and explain that participation is voluntary. This respects autonomy and lets people judge risks. For example, in a memory study participants would be told what tasks they will do, and that they can leave at any time without penalty."},
 {paper:"Paper 2", marks:"Evaluate", q:"Evaluate the use of laboratory experiments in psychological research.", how:"Give strengths and limitations, each explained, then a judgement. Use a named study as evidence.", a:"Laboratory experiments allow tight control of extraneous variables, so researchers can establish cause and effect, and standardised procedures make replication easy, which strengthens reliability. However, artificial tasks and settings reduce ecological validity: Loftus and Palmer (1974) showed film clips to students, which lacks the emotion of a real crash, so witnesses may be less accurate in reality than in the lab. Also, demand characteristics may lead participants to guess the aim. Overall, labs are strong for testing causal theories, but should be supported by field research to show findings apply in real life."},
 {paper:"Paper 1", marks:"Explain", q:"Explain why random allocation is used in experiments.", how:"Define it, explain the mechanism, state the consequence for the conclusion.", a:"Random allocation means each participant has an equal chance of being placed in any condition. This spreads individual differences such as age or intelligence evenly across groups. As a result, any difference in the DV is less likely to be caused by participant variables and more likely caused by the IV, increasing internal validity."}]},
{ id:2, name:"Health and wellbeing", blurb:"Stress, coping and mental health, and why people respond differently.",
 notes:[
 {h:"The biopsychosocial model", p:"This model proposes health is shaped by biological (genes, neurotransmitters), psychological (thoughts, coping) and social (support, culture) factors acting together. Why is it useful? It explains why two people with the same stressor differ, and it guides multi-part treatment. A limitation is that it is hard to test which factor matters most."},
 {h:"Stress and appraisal", p:"Lazarus and Folkman argued that stress depends on appraisal: primary appraisal asks if a situation is a threat, secondary appraisal asks if I can cope. Why does this matter? The same exam can be a challenge for one student and a threat for another, because their perceived resources differ."},
 {h:"The stress response", p:"The body releases adrenaline and cortisol through the sympathetic nervous system and HPA axis, preparing for fight or flight. Short-term, this is adaptive. Chronic activation keeps cortisol high, which is linked to weakened immune function, so long-term stress can raise illness risk."},
 {h:"Resilience and coping", p:"Problem-focused coping tackles the stressor, whereas emotion-focused coping manages feelings. Why is flexibility key? Problem-focused works best when the situation is controllable, and emotion-focused when it is not. Social support can buffer stress by raising perceived coping resources."}],
 tips:["Use correct terms: appraisal, cortisol, HPA axis, biopsychosocial.","For evaluation, mention individual and cultural differences in stress and coping."],
 qs:[
 {paper:"Paper 1", marks:"Outline", q:"Outline the biopsychosocial model of health.", how:"Name the three factors, give an example of each, show that they interact.", a:"The biopsychosocial model states that health and illness result from interaction of biological, psychological and social factors. Biological factors include genetics and hormones, psychological factors include thinking styles and coping, and social factors include family support and socioeconomic status. For example, depression may involve low serotonin, negative thinking and social isolation, which reinforce one another."},
 {paper:"Paper 2", marks:"Discuss", q:"Discuss the role of cognitive appraisal in stress.", how:"Explain the theory, apply it, then offer a counterpoint or limitation, and conclude.", a:"Lazarus and Folkman proposed that stress arises when a person appraises demands as exceeding their resources. In primary appraisal, an event is judged irrelevant, positive or threatening, and in secondary appraisal the person judges coping options. This explains individual differences: two students facing the same exam react differently because of perceived preparation and support. Supporting evidence comes from studies in which reframing a task as a challenge reduces stress responses. However, appraisal is difficult to measure objectively because it relies on self-report, and biological factors such as baseline cortisol also affect stress. Therefore appraisal is a valuable explanation, but not a complete one."}]},
{ id:3, name:"Human development", blurb:"How thinking, attachment and identity change across life.",
 notes:[
 {h:"Piaget: cognitive development", p:"Piaget proposed that children actively build schemas through assimilation (fitting new information into existing schemas) and accommodation (changing schemas). Why do stages exist? He argued that disequilibrium pushes thinking forward. Limitations: he underestimated young children, and later research shows abilities appear earlier when tasks are simplified."},
 {h:"Vygotsky: social learning", p:"Vygotsky emphasised that learning happens through interaction. The zone of proximal development is the gap between what a child can do alone and with guidance. Why does scaffolding work? Support is matched to the learner and then withdrawn as skill grows."},
 {h:"Attachment", p:"Bowlby argued that infants are biologically prepared to attach, since staying close to a caregiver aids survival. Ainsworth's Strange Situation (1970s) classified secure and insecure attachment. Why is it criticised? It was developed with American samples, so the categories may not apply equally across cultures where child-rearing differs."},
 {h:"Brain development", p:"Neuroplasticity means the brain changes with experience. Maguire et al. (2000) found that London taxi drivers had larger posterior hippocampi, consistent with spatial navigation shaping structure. Why can we not be certain? The study was correlational, so people with larger hippocampi might choose to become taxi drivers."}],
 tips:["Pair every theory with a study and one limitation.","Avoid saying that a study proves something: use supports, suggests or is consistent with."],
 qs:[
 {paper:"Paper 1", marks:"Describe", q:"Describe the process of scaffolding in cognitive development.", how:"Define, give mechanism, then a brief example linked to Vygotsky.", a:"Scaffolding is temporary support from a more knowledgeable person that helps a learner complete tasks just beyond their current ability. It operates within the zone of proximal development. The helper adjusts guidance to the learner, such as modelling or hints, and gradually reduces it as competence grows. For example, a parent first helps a child with a puzzle then lets the child complete it independently."},
 {paper:"Paper 2", marks:"Evaluate", q:"Evaluate one theory of attachment.", how:"Outline the theory with a study, then at least two evaluation points explained, then conclude.", a:"Bowlby's theory proposes that attachment is an innate survival mechanism, with a sensitive period in the first years. Ainsworth's research supports the idea that sensitive caregiving is linked with secure attachment. A strength is that it has had practical impact, shaping hospital and childcare policies. However, the Strange Situation is culturally biased because behaviours such as distress at separation mean different things in different cultures, which limits generalisability. Also, the evidence is correlational, so temperament may influence caregiver behaviour, rather than the reverse. Overall, the theory is influential, but its claims should be applied with caution across cultures."}]},
{ id:4, name:"Relationships", blurb:"Why people attach, cooperate, conform and form groups.",
 notes:[
 {h:"Personal relationships", p:"Social exchange theory suggests people stay in relationships when rewards outweigh costs. Why is that appealing? It explains commitment in terms of simple cost-benefit logic. A limitation is that it may overlook altruism and cannot easily measure rewards."},
 {h:"Social identity theory", p:"Tajfel proposed that we gain self-esteem from group membership, so we favour the in-group. In the minimal group studies (1971), boys assigned to arbitrary groups still gave more rewards to their own group. Why is this important? It shows that group categorisation alone can trigger bias, though the sample was all male and the setting artificial."},
 {h:"Conformity", p:"Asch (1951) found that participants gave incorrect answers about line lengths in about a third of trials when confederates did so. Why do people conform? Normative influence (wanting acceptance) and informational influence (assuming others know better). The study reflects a particular time and culture (1950s USA), so it may not generalise."},
 {h:"Cooperation and conflict", p:"Sherif's Robbers Cave study suggested that competition produces hostility, while shared goals reduce it. Why does a shared goal help? It makes groups interdependent, which replaces rivalry with cooperation."}],
 tips:["Distinguish normative from informational influence clearly.","Use a study to evidence each claim, and comment on the sample."],
 qs:[
 {paper:"Paper 1", marks:"Outline", q:"Outline social identity theory.", how:"State the three processes (categorisation, identification, comparison) and add a study.", a:"Social identity theory proposes that people categorise themselves and others into groups, identify with their in-group and compare it with out-groups to maintain positive self-esteem. This can create in-group favouritism and discrimination. Tajfel's minimal group research found that even arbitrary groups led participants to allocate more resources to their own group."},
 {paper:"Paper 2", marks:"Discuss", q:"Discuss factors that influence conformity.", how:"Give two or three factors, each with explanation and evidence, then consider limits of the research.", a:"Group size and unanimity affect conformity. In Asch's study conformity rose with up to three confederates, and fell sharply when one confederate disagreed, because the participant gained social support. Another factor is the type of influence: informational influence is stronger when a task is ambiguous, as people rely on others for guidance. Culture also matters, as collectivist societies often show higher conformity. However, much of the research used artificial tasks with students, limiting ecological validity, and the findings reflect the era studied. Therefore these factors are significant, but their effect depends on context."}]},
{ id:5, name:"Learning and thinking", blurb:"How we learn, remember and make (sometimes faulty) decisions.",
 notes:[
 {h:"Classical and operant conditioning", p:"In classical conditioning, a neutral stimulus paired with an unconditioned stimulus becomes a conditioned stimulus that triggers a response (Pavlov). In operant conditioning, behaviour followed by reinforcement becomes more likely. Why does it matter? It explains habits and phobias, but it underplays thinking."},
 {h:"Social learning", p:"Bandura (1961) found that children who watched an aggressive model imitated it, showing learning without direct reinforcement. Why does imitation happen? Attention, retention, reproduction and motivation. Limitation: a doll such as Bobo is designed to be hit, so the aggression may not reflect real violence."},
 {h:"Memory", p:"The multi-store model describes sensory, short-term and long-term stores. Reconstructive memory (Bartlett) argues that recall is rebuilt using schemas, which explains distortions. Why do eyewitnesses err? Loftus and Palmer (1974) found that the verb in a question (smashed versus hit) changed speed estimates, suggesting that leading questions alter memory."},
 {h:"Thinking and bias", p:"Kahneman distinguished fast, intuitive thinking from slow, effortful thinking. Fast thinking uses heuristics, which are efficient but produce biases such as availability, where we judge likelihood by how easily examples come to mind."}],
 tips:["For memory questions, compare models by what each can and cannot explain.","Mention that lab memory tasks often lack real-life relevance."],
 qs:[
 {paper:"Paper 1", marks:"Explain", q:"Explain how leading questions can affect eyewitness memory.", how:"Give the mechanism, a study, and the consequence.", a:"Leading questions suggest a particular answer and can alter how an event is reconstructed. Loftus and Palmer (1974) asked participants how fast cars were going when they smashed or hit, and the smashed group estimated higher speeds. This suggests that the wording supplied new information that was integrated into memory, so eyewitness testimony can be unreliable."},
 {paper:"Paper 2", marks:"Evaluate", q:"Evaluate the multi-store model of memory.", how:"Outline, give supporting evidence, then limitations and an alternative.", a:"The multi-store model proposes that information flows from sensory to short-term to long-term memory through rehearsal. Case studies of patients with impaired long-term memory but intact short-term memory support separate stores. However, the model is oversimplified, since rehearsal is not the only route to long-term memory and short-term memory is not a single store, as the working memory model suggests. Also, much supporting evidence comes from artificial tasks such as word lists, lowering ecological validity. Overall, the model was influential, but has been refined by later theories."}]}
];

const EXAM = [
 {h:"Paper 1 and Paper 2: what to expect", p:"Check your official guide for exact timings, marks and question types for 2027. In general, expect short-answer questions that test knowledge and understanding, and extended responses that test evaluation with evidence from research."},
 {h:"Command terms", p:"Describe: give a detailed account. Outline: a brief account. Explain: give reasons and causes (the why). Discuss: weigh different views, with evidence. Evaluate: strengths and limitations, ending with a judgement. To what extent: reach a reasoned conclusion about how far something is true."},
 {h:"A reliable paragraph structure", p:"Point (answer the question), Evidence (named study with finding), Explanation (why it supports or limits the point), Link (back to the question)."}
];

/* ===== RENDERING ===== */
const nav = document.getElementById("units");
const view = document.getElementById("view");
const esc = s => s.replace(/&/g,"&amp;").replace(/</g,"&lt;");

UNITS.forEach(u => {
  const b = document.createElement("button");
  b.className = "unit-btn"; b.dataset.id = u.id;
  b.innerHTML = "<b>" + u.id + "</b><span>" + esc(u.name) + "</span>";
  b.addEventListener("click", () => { location.hash = "unit-" + u.id; });
  nav.appendChild(b);
});
document.getElementById("examBtn").addEventListener("click", () => { location.hash = "exam"; });

function card(c, cls) { return '<div class="card ' + (cls||"") + '"><h3>' + esc(c.h) + '</h3><p>' + esc(c.p) + '</p></div>'; }

function showUnit(u, tab) {
  document.querySelectorAll(".unit-btn").forEach(b => b.classList.toggle("on", +b.dataset.id === u.id));
  let body = "";
  if (tab === "notes") {
    body = u.notes.map(n => card(n)).join("") +
      u.tips.map(t => '<div class="card tip"><p>' + esc(t) + '</p></div>').join("");
  } else {
    const list = tab === "p1" ? u.qs.filter(q => q.paper === "Paper 1") : tab === "p2" ? u.qs.filter(q => q.paper === "Paper 2") : u.qs;
    body = list.map(q => '<div class="card"><span class="tag">' + q.paper + '</span><span class="tag">' + q.marks + '</span><h3>' + esc(q.q) + '</h3>' +
      '<details><summary>How to answer</summary><p>' + esc(q.how) + '</p></details>' +
      '<details><summary>Model answer</summary><div class="model"><p>' + esc(q.a) + '</p></div></details></div>').join("") || "<p>No questions yet.</p>";
  }
  const tabs = [["notes","Notes"],["all","All questions"],["p1","Paper 1"],["p2","Paper 2"]]
    .map(t => '<button data-t="' + t[0] + '" class="' + (t[0] === tab ? "on" : "") + '">' + t[1] + '</button>').join("");
  view.innerHTML = '<section class="reveal"><h2>Unit ' + u.id + ': ' + esc(u.name) + '</h2><p>' + esc(u.blurb) + '</p><div class="tabs">' + tabs + '</div>' + body + '</section>';
  view.querySelectorAll(".tabs button").forEach(b => b.addEventListener("click", () => showUnit(u, b.dataset.t)));
}

function route() {
  const h = location.hash.slice(1);
  const m = h.match(/^unit-(\d)$/);
  if (m) {
    const u = UNITS.find(x => x.id === +m[1]);
    if (u) { showUnit(u, "notes"); view.focus({preventScroll:true}); view.scrollIntoView({behavior:"smooth"}); return; }
  }
  if (h === "exam") {
    document.querySelectorAll(".unit-btn").forEach(b => b.classList.remove("on"));
    view.innerHTML = '<section class="reveal"><h2>Exam guide</h2>' + EXAM.map(e => card(e, "tip")).join("") + '</section>';
    view.scrollIntoView({behavior:"smooth"}); return;
  }
  view.innerHTML = "";
}
window.addEventListener("hashchange", route);
route();
