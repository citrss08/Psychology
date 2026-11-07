
const units = {
  investigations: {
    number: "UNIT 01",
    title: "Psychological investigations",
    description: "Understand how psychologists investigate behaviour, collect evidence and evaluate research.",
    tag: "RESEARCH METHODS",
    notes: [
      {
        title: "What is psychological research?",
        text: "Psychology uses systematic methods to investigate behaviour and mental processes. Researchers collect evidence, analyse patterns and evaluate explanations rather than relying only on intuition.",
        definition: "An operational definition explains exactly how a variable is measured or manipulated in a particular study.",
        why: "Psychological concepts such as stress, intelligence and attraction cannot always be observed directly. Researchers therefore need clear ways to measure them."
      },
      {
        title: "Research methods",
        text: "Different methods answer different research questions. The method should be selected according to the aim, the variables and the practical and ethical limits of the investigation.",
        bullets: [
          "Experiment: manipulates an independent variable to investigate its effect on a dependent variable.",
          "Observation: systematically records behaviour as it occurs.",
          "Interview: collects detailed verbal information from participants.",
          "Questionnaire or survey: gathers responses to a set of questions."
        ],
        why: "No single method is suitable for every psychological question. For example, an experiment may investigate a possible causal relationship, while an interview can explore participants' experiences in greater depth."
      },
      {
        title: "Variables and experimental design",
        text: "The independent variable (IV) is the variable manipulated by the researcher. The dependent variable (DV) is the outcome measured. Extraneous variables are other factors that could influence the results.",
        bullets: [
          "Independent groups: different participants take part in each condition.",
          "Repeated measures: the same participants take part in every condition.",
          "Matched pairs: participants are paired according to relevant characteristics."
        ],
        why: "Researchers need to control other possible explanations. If an extraneous variable changes alongside the IV, it becomes harder to determine what caused the results."
      },
      {
        title: "Sampling and generalisability",
        text: "A sample is the group of people who participate in a study. The target population is the wider group to which researchers hope to apply their findings.",
        bullets: [
          "Opportunity sampling: selecting people who are readily available.",
          "Volunteer sampling: participants choose to take part.",
          "Random sampling: each member of the target population has an equal chance of selection."
        ],
        why: "A sample that differs substantially from the target population may produce findings that cannot be confidently generalised. Sample size alone does not guarantee representativeness."
      },
      {
        title: "Reliability and validity",
        text: "Reliability concerns the consistency of a measure or research procedure. Validity concerns whether the research actually measures what it intends to measure.",
        bullets: [
          "Test-retest reliability: whether a measure produces consistent results over time.",
          "Inter-rater reliability: whether different observers record similar results.",
          "Internal validity: whether the findings support the proposed explanation.",
          "External validity: whether findings can apply beyond the original study."
        ],
        why: "A measure can be reliable without being valid. A scale that consistently gives readings that are too high may be reliable, but it is not accurately measuring the intended value."
      },
      {
        title: "Ethics in psychological research",
        text: "Researchers have responsibilities towards participants and must consider the possible consequences of their procedures.",
        bullets: [
          "Informed consent: participants should understand what participation involves.",
          "Right to withdraw: participants should be able to leave the study.",
          "Confidentiality: personal information should be protected.",
          "Protection from harm: researchers should minimise physical and psychological risk.",
          "Deception: should be justified and followed by appropriate debriefing."
        ],
        why: "Ethical research protects participants and helps maintain public trust in psychology. Scientific value does not automatically justify every research procedure."
      }
    ],
    research: [
      {
        title: "Class practical: interview",
        text: "Health and well-being context. You may use a structured interview, semi-structured interview or focus group. The minimum is one participant for an individual interview, or three to eight participants for a focus group.",
        evaluation: "Interviews can provide detailed explanations, but interviewer effects and social desirability may influence responses."
      },
      {
        title: "Class practical: observation",
        text: "Human development context. Observation can be naturalistic or controlled, overt or covert, and participant or non-participant. The minimum is one participant.",
        evaluation: "Observation can record behaviour in context, but observer bias and the Hawthorne effect may affect findings."
      },
      {
        title: "Class practical: questionnaire",
        text: "Human relationships context. A survey or questionnaire requires a minimum of ten participants.",
        evaluation: "Questionnaires can collect standardised responses efficiently, but poorly worded questions and social desirability can reduce validity."
      },
      {
        title: "Class practical: experiment",
        text: "Learning and cognition context. The experiment can be true or quasi-experimental and requires a minimum of five participants.",
        evaluation: "Experiments can investigate causal relationships, but artificial settings and uncontrolled variables may limit conclusions."
      }
    ],
    practice: [
      {
        question: "Define the term operationalisation. [2 marks]",
        answer: "Operationalisation is the process of defining a variable in a specific, measurable way. For example, a researcher could operationalise memory performance as the number of words correctly recalled from a list."
      },
      {
        question: "Explain one difference between reliability and validity. [4 marks]",
        answer: "Reliability refers to the consistency of a measure, whereas validity refers to whether the measure assesses what it is intended to assess. A questionnaire could produce consistent scores every time it is completed, making it reliable, but if its questions do not accurately measure stress, it may lack validity."
      },
      {
        question: "Explain one ethical consideration when conducting an experiment. [4 marks]",
        answer: "Informed consent requires participants to understand the nature of the study before agreeing to participate. This is important because participants should be able to make a voluntary and informed decision about whether they wish to take part."
      }
    ]
  },

  health: {
    number: "UNIT 02",
    title: "Health and well-being",
    description: "Explore psychological explanations of health, illness, stress and well-being.",
    tag: "CONTEXT 01",
    notes: [
      {
        title: "Understanding health and well-being",
        text: "Health is broader than simply the absence of illness. Psychological research considers physical, mental and social aspects of well-being, as well as how they interact.",
        definition: "Well-being refers to a person's overall psychological and physical state, including factors such as emotional functioning and life satisfaction.",
        why: "A person may not have a diagnosed physical illness but may still experience poor psychological well-being. This is why psychological explanations consider more than physical symptoms."
      },
      {
        title: "The biological approach",
        text: "The biological approach explains behaviour and mental processes through biological mechanisms, including brain structures, neurotransmitters, hormones and genetic influences.",
        bullets: [
          "Neurotransmitters transmit signals between neurons.",
          "Hormones are chemical messengers released by endocrine glands.",
          "Genetic factors may contribute to individual differences.",
          "Brain structures can be associated with particular functions."
        ],
        why: "Biological explanations can help identify mechanisms involved in health and behaviour. However, they may overlook social environments and individual experiences."
      },
      {
        title: "The cognitive approach",
        text: "The cognitive approach focuses on mental processes such as attention, memory, interpretation and thinking. It examines how people process information and how this can influence behaviour.",
        why: "Two people may interpret the same situation differently. Their interpretations can influence emotional responses and the decisions they make."
      },
      {
        title: "The sociocultural approach",
        text: "The sociocultural approach investigates how social relationships, cultural expectations, group membership and wider environments influence behaviour.",
        why: "Health-related behaviour does not occur in isolation. Family expectations, social norms and access to resources can all influence individual choices."
      },
      {
        title: "Evaluating explanations",
        text: "A strong psychological explanation should be considered in relation to evidence from more than one perspective.",
        bullets: [
          "Biological explanations may identify underlying mechanisms.",
          "Cognitive explanations may explain interpretations and decision-making.",
          "Sociocultural explanations may explain environmental and social influences."
        ],
        why: "A multi-level explanation can provide a more complete account than assuming that one factor explains every person's experience."
      }
    ],
    research: [
      {
        title: "Example: stress and biological responses",
        text: "Research into stress may investigate physiological responses, including hormonal activity and changes in the body's stress-response systems.",
        evaluation: "Biological measures can provide objective data, although they do not necessarily explain how a person interprets or experiences stress."
      },
      {
        title: "Example: cognitive interpretations",
        text: "Researchers may investigate how interpretations of challenging situations relate to emotional responses and coping behaviour.",
        evaluation: "Self-report measures can provide access to personal experiences, but participants may not always report their thoughts accurately."
      },
      {
        title: "Example: social influences on health",
        text: "Research may explore how family, peers, cultural expectations and social environments influence health-related behaviour.",
        evaluation: "Social research can explain environmental influences, but it can be difficult to isolate the contribution of one factor."
      }
    ],
    practice: [
      {
        question: "Explain one way in which the biological approach can contribute to understanding health and well-being. [4 marks]",
        answer: "The biological approach investigates how physiological mechanisms may influence health. For example, researchers may investigate the role of hormones in the body's response to stress. This can help explain how biological processes are associated with changes in behaviour and physical functioning."
      },
      {
        question: "Discuss how two psychological approaches could explain health-related behaviour. [6 marks]",
        answer: "The cognitive approach could explain health-related behaviour through the way individuals interpret information and make decisions. The sociocultural approach could explain how social norms, family expectations and cultural environments influence those decisions. Together, these approaches show that behaviour may be influenced by both individual thought processes and the surrounding social environment."
      }
    ]
  },

  development: {
    number: "UNIT 03",
    title: "Human development",
    description: "Investigate psychological change and continuity throughout human development.",
    tag: "CONTEXT 02",
    notes: [
      {
        title: "What is human development?",
        text: "Human development concerns changes in behaviour, thinking, emotion and social functioning over time. Researchers investigate both continuity and change throughout the lifespan.",
        definition: "Development refers to changes in psychological characteristics and behaviour across time.",
        why: "Understanding development helps psychologists distinguish between abilities that remain relatively stable and those that change with age, experience or environment."
      },
      {
        title: "Biological influences on development",
        text: "Biological development includes changes in the brain, nervous system and hormonal activity. Genetic factors may also contribute to individual differences.",
        why: "Biological maturation can influence what individuals are able to do at different stages of development. However, development is not determined by biology alone."
      },
      {
        title: "Cognitive development",
        text: "Cognitive development concerns changes in mental processes such as memory, language, reasoning, attention and problem-solving.",
        why: "Cognitive abilities can change as the brain matures and as individuals gain experience. Researchers therefore investigate how thinking develops over time."
      },
      {
        title: "Social and cultural influences",
        text: "Family relationships, education, peers and cultural environments can influence developmental experiences.",
        why: "Individuals grow up in different environments. These differences can shape opportunities, expectations and the experiences that influence development."
      },
      {
        title: "Nature and nurture",
        text: "Nature refers to biological and genetic influences, while nurture refers to environmental and experiential influences.",
        why: "Nature and nurture interact. It is often misleading to treat development as the result of only genes or only environment."
      }
    ],
    research: [
      {
        title: "Class practical: observation",
        text: "For the human development context, your class practical uses observation. You may use naturalistic or controlled observation, and different observer roles.",
        evaluation: "Observations can record behaviour as it occurs, but the presence of an observer or the interpretation of behaviour may influence the data."
      },
      {
        title: "Longitudinal research",
        text: "A longitudinal design studies the same participants over an extended period of time.",
        evaluation: "It can reveal patterns of change within individuals, but participant attrition and time demands may be limitations."
      },
      {
        title: "Cross-sectional research",
        text: "A cross-sectional design compares different groups at a particular point in time.",
        evaluation: "It can be quicker than longitudinal research, but differences between age groups may reflect cohort effects rather than developmental change."
      }
    ],
    practice: [
      {
        question: "Explain the difference between nature and nurture. [4 marks]",
        answer: "Nature refers to biological influences, including genetic factors, while nurture refers to environmental influences and experiences. For example, an individual's development may be influenced by inherited characteristics as well as their family, education and social environment."
      },
      {
        question: "Evaluate the use of a longitudinal design in developmental research. [6 marks]",
        answer: "A strength of longitudinal research is that the same participants are studied over time, allowing researchers to examine patterns of individual change. However, participants may drop out, creating attrition bias. The design can also require substantial time and resources, making it difficult to conduct."
      }
    ]
  },

  relationships: {
    number: "UNIT 04",
    title: "Human relationships",
    description: "Explore how psychological processes and social environments influence relationships.",
    tag: "CONTEXT 03",
    notes: [
      {
        title: "Understanding human relationships",
        text: "Human relationships include social connections between individuals and groups. Psychology investigates how relationships form, develop and influence behaviour.",
        why: "Relationships can influence emotional experiences, identity, behaviour and social functioning. They are therefore studied from biological, cognitive and sociocultural perspectives."
      },
      {
        title: "The biological perspective",
        text: "Biological explanations may examine the role of hormones, brain systems and evolutionary influences in social behaviour and relationships.",
        why: "Biological mechanisms may contribute to social behaviour, but they cannot independently explain the complexity of relationships."
      },
      {
        title: "The cognitive perspective",
        text: "Cognitive explanations investigate how people perceive, interpret and remember information about other people.",
        bullets: [
          "Attributions: explanations people make about the causes of behaviour.",
          "Schemas: mental frameworks that organise information.",
          "Social cognition: mental processes involved in understanding other people."
        ],
        why: "People do not respond only to what others do. They also respond to how they interpret those actions."
      },
      {
        title: "The sociocultural perspective",
        text: "Sociocultural explanations consider the influence of group norms, social roles, culture and social environments on relationships.",
        why: "Expectations about friendship, family and social behaviour can differ across cultural and social contexts."
      },
      {
        title: "Researching relationships",
        text: "Researchers may use questionnaires, interviews, observations and experiments to investigate different aspects of relationships.",
        why: "A questionnaire can identify patterns across many participants, while an interview may provide more detailed insight into personal experiences."
      }
    ],
    research: [
      {
        title: "Class practical: questionnaire",
        text: "The human relationships context uses a survey or questionnaire with a minimum of ten participants.",
        evaluation: "Questionnaires allow standardised data collection, but leading questions, ambiguous wording and social desirability can influence responses."
      },
      {
        title: "Example: self-report research",
        text: "Self-report methods can investigate participants' attitudes, perceptions and experiences of relationships.",
        evaluation: "Participants can describe their own experiences, but their answers may be affected by memory, interpretation or a desire to present themselves positively."
      },
      {
        title: "Example: social observation",
        text: "Observational research can investigate how people interact in social settings.",
        evaluation: "It can provide behavioural evidence, although researchers may disagree about how to interpret complex social behaviour."
      }
    ],
    practice: [
      {
        question: "Explain one limitation of using questionnaires to study human relationships. [4 marks]",
        answer: "One limitation is social desirability bias. Participants may provide answers they believe are socially acceptable rather than expressing their genuine opinions. This can reduce the validity of the findings because the responses may not accurately represent their attitudes or experiences."
      },
      {
        question: "Explain how the sociocultural approach can contribute to understanding relationships. [4 marks]",
        answer: "The sociocultural approach investigates how social norms and cultural expectations influence behaviour. For example, expectations about communication and family roles may influence how individuals interact with other people."
      }
    ]
  },

  learning: {
    number: "UNIT 05",
    title: "Learning and cognition",
    description: "Explore how people acquire information, process experiences, remember and make decisions.",
    tag: "CONTEXT 04",
    notes: [
      {
        title: "What is cognition?",
        text: "Cognition refers to mental processes involved in acquiring, processing, storing and using information. These processes include attention, perception, memory and decision-making.",
        definition: "Learning refers to a relatively lasting change in knowledge or behaviour resulting from experience.",
        why: "Cognitive processes influence how individuals understand their environment and respond to new information."
      },
      {
        title: "The biological approach",
        text: "The biological approach investigates how brain structures, neural activity and biological mechanisms contribute to learning and cognitive processes.",
        why: "Learning involves changes in the nervous system. Biological research can therefore help explain the mechanisms associated with acquiring and retaining information."
      },
      {
        title: "The cognitive approach",
        text: "The cognitive approach focuses on information processing, including attention, memory, perception and reasoning.",
        bullets: [
          "Encoding: transforming information into a form that can be stored.",
          "Storage: retaining information over time.",
          "Retrieval: accessing stored information.",
          "Attention: selecting information for further processing."
        ],
        why: "Understanding how information is processed helps explain why some information is remembered while other information is forgotten."
      },
      {
        title: "The sociocultural approach",
        text: "The sociocultural approach considers how learning and thinking are influenced by social interaction, language, culture and shared knowledge.",
        why: "Learning can occur through interaction with other people. Social environments can influence the information individuals encounter and the strategies they develop."
      },
      {
        title: "Researching learning and cognition",
        text: "Researchers may use experiments to investigate memory, attention and learning. They can manipulate conditions and measure performance.",
        why: "Experiments can help investigate relationships between variables, although results from controlled tasks may not always reflect everyday cognitive activity."
      }
    ],
    research: [
      {
        title: "Class practical: experiment",
        text: "The learning and cognition context uses an experiment, either true or quasi-experimental, with a minimum of five participants.",
        evaluation: "An experiment can control conditions and investigate relationships between variables, but artificial tasks may reduce ecological validity."
      },
      {
        title: "Example: memory experiments",
        text: "Memory research may compare recall or recognition under different conditions, such as different presentation methods or delays.",
        evaluation: "Performance can be measured systematically, but results may be affected by individual differences and the artificial nature of the task."
      },
      {
        title: "Example: attention research",
        text: "Attention studies may investigate how distractions or competing information affect performance on a task.",
        evaluation: "Controlled tasks can isolate variables, although everyday attention is more complex than performance on a single laboratory task."
      }
    ],
    practice: [
      {
        question: "Define encoding in relation to memory. [2 marks]",
        answer: "Encoding is the process of transforming information into a form that can be stored in memory."
      },
      {
        question: "Explain one strength and one limitation of using experiments to investigate memory. [6 marks]",
        answer: "A strength is that researchers can manipulate an independent variable and measure its effect on memory performance, allowing greater control over conditions. A limitation is that laboratory memory tasks may be artificial and may not reflect how people use memory in everyday life."
      }
    ]
  }
};

let currentUnit = "investigations";
let currentTab = "notes";

const unitButtons = document.querySelectorAll(".unit-card");
const tabs = document.querySelectorAll(".tab");
const content = document.getElementById("unit-content");

function renderNotes(unit) {
  return unit.notes.map((item) => `
    <article class="topic-block">
      <h3>${item.title}</h3>
      <p>${item.text}</p>
      ${item.definition ? `
        <div class="definition"><strong>Key definition</strong><br>${item.definition}</div>
      ` : ""}
      ${item.bullets ? `
        <ul>${item.bullets.map(point => `<li>${point}</li>`).join("")}</ul>
      ` : ""}
      ${item.why ? `
        <div class="why-box"><strong>WHY DOES THIS MATTER?</strong>${item.why}</div>
      ` : ""}
    </article>
  `).join("");
}

function renderResearch(unit) {
  return unit.research.map((item) => `
    <article class="research-card">
      <h3>${item.title}</h3>
      <p>${item.text}</p>
      <div class="why-box"><strong>CRITICAL EVALUATION</strong>${item.evaluation}</div>
    </article>
  `).join("");
}

function renderPractice(unit) {
  return unit.practice.map((item, index) => `
    <article class="question-card">
      <p class="eyebrow">PRACTICE QUESTION ${index + 1}</p>
      <h3>${item.question}</h3>
      <button class="answer-button" type="button" aria-expanded="false">
        Reveal model answer +
      </button>
      <div class="answer">${item.answer}</div>
    </article>
  `).join("");
}

function renderUnit() {
  const unit = units[currentUnit];

  document.getElementById("unit-eyebrow").textContent = unit.number;
  document.getElementById("unit-title").textContent = unit.title;
  document.getElementById("unit-description").textContent = unit.description;
  document.getElementById("unit-tag").textContent = unit.tag;

  if (currentTab === "notes") {
    content.innerHTML = renderNotes(unit);
  } else if (currentTab === "research") {
    content.innerHTML = renderResearch(unit);
  } else {
    content.innerHTML = renderPractice(unit);
  }
}

unitButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentUnit = button.dataset.unit;

    unitButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    currentTab = "notes";
    tabs.forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.tab === "notes");
    });

    renderUnit();
    document.getElementById("study-area").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    currentTab = tab.dataset.tab;

    tabs.forEach((item) => {
      item.classList.toggle("active", item === tab);
    });

    renderUnit();
  });
});

content.addEventListener("click", (event) => {
  const button = event.target.closest(".answer-button");
  if (!button) return;

  const answer = button.nextElementSibling;
  const isVisible = answer.classList.toggle("visible");

  button.textContent = isVisible
    ? "Hide model answer −"
    : "Reveal model answer +";

  button.setAttribute("aria-expanded", String(isVisible));
});

document.querySelectorAll("[data-go]").forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.go;
    const unitButton = document.querySelector(`[data-unit="${target}"]`);
    if (unitButton) unitButton.click();
  });
});

renderUnit();
