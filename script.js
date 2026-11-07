
const concepts = [
  {
    name: "Bias",
    short: "When systematic influences distort research or interpretation.",
    detail: "Bias can enter psychological research at different stages, from selecting participants to interpreting findings. Researchers should consider how their expectations, methods and social context may influence conclusions.",
    example: "A researcher who expects a treatment to work may unintentionally interpret ambiguous participant responses in its favour.",
    question: "Ask yourself: whose perspective is represented, and whose might be missing?"
  },
  {
    name: "Causality",
    short: "Understanding whether one factor actually causes another.",
    detail: "Causality concerns whether a change in one variable produces a change in another. Correlation alone cannot establish causation because other variables or reverse explanations may account for a relationship.",
    example: "A correlation between stress and poor sleep does not, by itself, prove that stress causes poor sleep.",
    question: "Ask yourself: is there evidence of cause and effect, or only an association?"
  },
  {
    name: "Change",
    short: "How behaviour and mental processes develop or transform.",
    detail: "Psychologists investigate change across time, situations and experiences. Change can be gradual or rapid, and may involve biological maturation, learning or shifts in social environments.",
    example: "A person's memory strategies may change as they develop and gain experience.",
    question: "Ask yourself: what changed, over what period, and what may explain it?"
  },
  {
    name: "Measurement",
    short: "How psychological variables are defined and assessed.",
    detail: "Many psychological ideas, such as anxiety or attraction, cannot be directly observed in the same way as physical objects. Researchers therefore need to operationalise variables and choose suitable ways to measure them.",
    example: "A researcher investigating anxiety might use a validated questionnaire, physiological indicators or structured observations.",
    question: "Ask yourself: does the measure genuinely represent the concept being investigated?"
  },
  {
    name: "Perspective",
    short: "The viewpoint used to understand human behaviour.",
    detail: "Different psychological approaches may explain the same behaviour in different ways. Cultural and individual perspectives also influence how behaviour is understood.",
    example: "A behaviour may be explained through brain processes, individual thought patterns or social expectations.",
    question: "Ask yourself: what viewpoint is being used, and what might it overlook?"
  },
  {
    name: "Responsibility",
    short: "The ethical duties involved in psychological research and application.",
    detail: "Psychologists have responsibilities towards participants, communities and society. These include protecting privacy, considering possible harm and communicating findings carefully.",
    example: "A researcher interviewing people about well-being should consider confidentiality, informed consent and the possibility of discomfort.",
    question: "Ask yourself: who could be affected by this research, and how should they be protected?"
  }
];

const approaches = {
  biological: {
    title: "The biological approach",
    intro: "The biological approach examines how biological processes contribute to behaviour and mental processes.",
    why: "Behaviour is influenced by the functioning of the body and brain. Researchers investigate how biological systems interact with experience and the environment.",
    ideas: [
      "Brain structures and neural functioning",
      "Neurotransmitters and communication between neurons",
      "Hormones and the endocrine system",
      "Genetic influences and individual differences",
      "Interactions between biological and environmental factors"
    ],
    example: "A researcher investigating stress might examine physiological responses and the role of hormones in the body's stress response.",
    evaluate: "Biological explanations can offer measurable evidence, but they may overlook personal experience, social conditions and cultural influences if used alone."
  },
  cognitive: {
    title: "The cognitive approach",
    intro: "The cognitive approach investigates internal mental processes such as memory, attention, perception, language and thinking.",
    why: "People do not simply react to events. They interpret information, use prior knowledge and make decisions. These processes influence how they experience and respond to the world.",
    ideas: [
      "Memory processes and memory models",
      "Schemas and prior knowledge",
      "Attention and perception",
      "Thinking, judgement and decision-making",
      "Cognitive biases and information processing"
    ],
    example: "Two people may interpret the same ambiguous message differently because they have different expectations and prior experiences.",
    evaluate: "Cognitive research can explain mental processes, but laboratory tasks may simplify complex real-world thinking."
  },
  sociocultural: {
    title: "The sociocultural approach",
    intro: "The sociocultural approach examines how social and cultural environments influence behaviour and mental processes.",
    why: "People develop within families, communities and cultures. Social expectations, group membership and cultural values can shape how individuals think and behave.",
    ideas: [
      "Social identity and group membership",
      "Social norms and expectations",
      "Culture and cultural influences",
      "Social learning and interaction",
      "The relationship between individuals and society"
    ],
    example: "A person's communication style may be influenced by the expectations and social norms of the groups they belong to.",
    evaluate: "This approach recognises social context, but researchers must avoid treating cultures as uniform or assuming that everyone within a group behaves identically."
  },
  methodology: {
    title: "Research methodology",
    intro: "Research methodology concerns how psychologists design investigations, collect evidence and justify conclusions.",
    why: "Psychological knowledge develops through systematic inquiry. Researchers must choose methods that suit their research questions and evaluate the quality and ethical implications of the evidence they collect.",
    ideas: [
      "Experiments and non-experimental methods",
      "Interviews, observations and questionnaires",
      "Sampling and participant selection",
      "Operationalisation and measurement",
      "Validity, reliability and research ethics",
      "Qualitative and quantitative evidence"
    ],
    example: "To investigate how people describe stress, a researcher might use semi-structured interviews. To investigate whether a condition affects memory performance, an experiment may be more appropriate.",
    evaluate: "No single method is suitable for every research question. The quality of a study depends on the fit between its question, method, sample, measurements and ethical safeguards."
  }
};

const contexts = [
  {
    name: "Health and well-being",
    subtitle: "How psychological factors relate to health.",
    method: "INTERVIEW",
    sample: "One participant for an individual interview, or 3–8 participants in a focus group.",
    detail: "This context investigates psychological influences on health and well-being. Consider how biological processes, thoughts and social environments may interact.",
    themes: [
      "Stress and its psychological and biological influences",
      "Coping strategies and resilience",
      "Social support and well-being",
      "Health-related beliefs and behaviour"
    ],
    question: "How might psychological and social factors influence the way an individual experiences and manages stress?"
  },
  {
    name: "Human development",
    subtitle: "How people change across the lifespan.",
    method: "OBSERVATION",
    sample: "One participant.",
    detail: "This context explores how people develop and change. Consider the interaction of biological maturation, cognitive processes and social experiences.",
    themes: [
      "Cognitive and social development",
      "The role of early experiences",
      "Learning and developmental change",
      "Continuity and change across the lifespan"
    ],
    question: "How could a psychologist use observation to investigate a particular aspect of development?"
  },
  {
    name: "Human relationships",
    subtitle: "How people connect and interact.",
    method: "SURVEY / QUESTIONNAIRE",
    sample: "10 participants.",
    detail: "This context explores how people form, maintain and experience relationships. Consider attraction, communication, social influence and the role of culture.",
    themes: [
      "Interpersonal attraction",
      "Communication and interaction",
      "Social influence",
      "The role of social and cultural expectations"
    ],
    question: "How might similarity or communication style influence people's relationships?"
  },
  {
    name: "Learning and cognition",
    subtitle: "How people learn, remember and think.",
    method: "EXPERIMENT",
    sample: "5 participants.",
    detail: "This context explores how individuals acquire, process and use information. Consider learning mechanisms, memory, thinking and decision-making.",
    themes: [
      "Learning through association",
      "Learning through consequences and observation",
      "Memory and information processing",
      "Thinking and decision-making"
    ],
    question: "How could an experiment investigate the influence of one condition on a cognitive process?"
  }
];

const practicals = [
  {
    name: "Interview",
    context: "Health and well-being",
    number: "01",
    detail: "Can be structured, semi-structured or conducted as a focus group.",
    sample: "1 individual or 3–8 in a focus group"
  },
  {
    name: "Observation",
    context: "Human development",
    number: "02",
    detail: "Can be naturalistic or controlled, overt or covert, participant or non-participant.",
    sample: "1 participant"
  },
  {
    name: "Survey / questionnaire",
    context: "Human relationships",
    number: "03",
    detail: "Collects participants' reported attitudes, experiences or behaviours.",
    sample: "10 participants"
  },
  {
    name: "Experiment",
    context: "Learning and cognition",
    number: "04",
    detail: "Can be a true experiment or a quasi-experiment.",
    sample: "5 participants"
  }
];

const quiz = [
  {
    category: "CONCEPTS",
    question: "Which concept is most directly concerned with whether a measure accurately represents the psychological variable being investigated?",
    options: ["Causality", "Measurement", "Change", "Perspective"],
    answer: 1,
    explanation: "Measurement concerns how psychological variables are defined and assessed. The researcher must consider whether the chosen measure represents the intended concept."
  },
  {
    category: "CONTENT",
    question: "Which approach focuses most directly on schemas, memory and information processing?",
    options: ["Biological", "Sociocultural", "Cognitive", "Research methodology"],
    answer: 2,
    explanation: "The cognitive approach investigates internal mental processes, including memory, schemas, attention and thinking."
  },
  {
    category: "RESEARCH METHODOLOGY",
    question: "A researcher wants to explore an individual's personal experience of stress in depth. Which class practical method is most suitable?",
    options: ["Interview", "Experiment", "Observation", "Questionnaire only"],
    answer: 0,
    explanation: "An interview allows the researcher to explore an individual's experiences in depth and ask follow-up questions."
  },
  {
    category: "PAPER 2",
    question: "A study finds a relationship between two variables. What can the researcher conclude from correlation alone?",
    options: [
      "One variable definitely causes the other",
      "There is an association between the variables",
      "There are no alternative explanations",
      "The result applies to every population"
    ],
    answer: 1,
    explanation: "Correlation indicates an association. It does not, on its own, establish causation or rule out other variables."
  },
  {
    category: "ASSESSMENT",
    question: "What is the SL internal assessment for first assessment 2027?",
    options: [
      "A laboratory report",
      "A literature review",
      "A research proposal",
      "A third examination paper"
    ],
    answer: 2,
    explanation: "The SL internal assessment is a research proposal investigating a population of interest using one of the four methods used in the class practicals."
  }
];

const conceptGrid = document.getElementById("conceptGrid");
const approachPanel = document.getElementById("approachPanel");
const contextGrid = document.getElementById("contextGrid");
const contextPanel = document.getElementById("contextPanel");
const practicalGrid = document.getElementById("practicalGrid");
const quizCard = document.getElementById("quizCard");

function showView(name) {
  document.querySelectorAll(".view").forEach(view => {
    view.classList.toggle("active", view.id === name);
  });

  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.toggle("active", link.dataset.view === name);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("click", event => {
  const link = event.target.closest("[data-view]");
  if (link) {
    event.preventDefault();
    showView(link.dataset.view);
  }
});

function renderConcepts() {
  concepts.forEach((concept, index) => {
    const card = document.createElement("button");
    card.className = "concept-card";
    card.innerHTML = `
      <span class="number">CONCEPT 0${index + 1}</span>
      <h3>${concept.name}</h3>
      <p>${concept.short}</p>
      <p class="card-hint">SELECT TO EXPLORE ↗</p>
    `;

    card.addEventListener("click", () => {
      document.querySelectorAll(".concept-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");

      let panel = document.getElementById("conceptDetail");
      if (!panel) {
        panel = document.createElement("div");
        panel.id = "conceptDetail";
        panel.className = "detail-panel";
        conceptGrid.after(panel);
      }

      panel.innerHTML = `
        <div class="eyebrow">CONCEPT EXPLAINED</div>
        <h2>${concept.name}</h2>
        <p>${concept.detail}</p>
        <p><strong>Example:</strong> ${concept.example}</p>
        <p><strong>Think critically:</strong> ${concept.question}</p>
      `;
      panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

    conceptGrid.appendChild(card);
  });
}

function renderApproach(name) {
  const item = approaches[name];

  document.querySelectorAll(".approach-tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.approach === name);
  });

  approachPanel.innerHTML = `
    <article class="approach-panel">
      <div class="eyebrow">PSYCHOLOGICAL CONTENT</div>
      <h2>${item.title}</h2>
      <p class="lead">${item.intro}</p>
      <div class="approach-columns">
        <div class="info-block">
          <h3>WHY DOES IT MATTER?</h3>
          <p>${item.why}</p>
        </div>
        <div class="info-block">
          <h3>KEY AREAS TO STUDY</h3>
          <ul>${item.ideas.map(x => `<li>${x}</li>`).join("")}</ul>
        </div>
        <div class="info-block">
          <h3>APPLICATION</h3>
          <p>${item.example}</p>
        </div>
        <div class="info-block">
          <h3>CRITICAL EVALUATION</h3>
          <p>${item.evaluate}</p>
        </div>
      </div>
    </article>
  `;
}

document.querySelectorAll(".approach-tab").forEach(tab => {
  tab.addEventListener("click", () => renderApproach(tab.dataset.approach));
});

function renderContexts() {
  contexts.forEach((context, index) => {
    const card = document.createElement("button");
    card.className = "context-card";
    card.innerHTML = `
      <span class="number">CONTEXT 0${index + 1}</span>
      <h3>${context.name}</h3>
      <p>${context.subtitle}</p>
      <span class="method">${context.method}</span>
    `;

    card.addEventListener("click", () => {
      document.querySelectorAll(".context-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");

      contextPanel.innerHTML = `
        <div class="detail-panel">
          <div class="eyebrow">CONTEXT DETAIL</div>
          <h2>${context.name}</h2>
          <p>${context.detail}</p>
          <br>
          <p><strong>Class practical:</strong> ${context.method}</p>
          <p><strong>Minimum sample:</strong> ${context.sample}</p>
          <br>
          <h3>Possible areas to investigate</h3>
          <ul>${context.themes.map(x => `<li>${x}</li>`).join("")}</ul>
          <br>
          <p><strong>Think about:</strong> ${context.question}</p>
        </div>
      `;
      contextPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

    contextGrid.appendChild(card);
  });
}

function renderPracticals() {
  practicals.forEach(item => {
    const card = document.createElement("article");
    card.className = "practical-card";
    card.innerHTML = `
      <span class="number">PRACTICAL ${item.number}</span>
      <h3>${item.name}</h3>
      <p>${item.context}</p>
      <p>${item.detail}</p>
      <strong>MINIMUM SAMPLE: ${item.sample}</strong>
    `;
    practicalGrid.appendChild(card);
  });
}

let questionIndex = 0;

function renderQuiz() {
  const item = quiz[questionIndex];

  quizCard.innerHTML = `
    <div class="quiz-category">${item.category} · QUESTION ${questionIndex + 1} OF ${quiz.length}</div>
    <h3>${item.question}</h3>
    <div class="quiz-options">
      ${item.options.map((option, index) => `
        <button class="quiz-option" data-option="${index}">${String.fromCharCode(65 + index)}. ${option}</button>
      `).join("")}
    </div>
    <div class="quiz-feedback" id="quizFeedback"></div>
    <button class="quiz-next" id="quizNext" hidden>Next question →</button>
  `;

  quizCard.querySelectorAll(".quiz-option").forEach(button => {
    button.addEventListener("click", () => {
      const selected = Number(button.dataset.option);
      const feedback = document.getElementById("quizFeedback");

      quizCard.querySelectorAll(".quiz-option").forEach(option => {
        option.disabled = true;
        if (Number(option.dataset.option) === item.answer) {
          option.classList.add("correct");
        }
      });

      if (selected !== item.answer) {
        button.classList.add("incorrect");
      }

      feedback.textContent =
        (selected === item.answer ? "Correct! " : "Not quite. ") +
        item.explanation;
      feedback.classList.add("show");
      document.getElementById("quizNext").hidden = false;
    });
  });

  document.getElementById("quizNext").addEventListener("click", () => {
    questionIndex = (questionIndex + 1) % quiz.length;
    renderQuiz();
  });
}

renderConcepts();
renderApproach("biological");
renderContexts();
renderPracticals();
renderQuiz();
