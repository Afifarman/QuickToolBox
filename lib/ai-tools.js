// Shared helpers for the AI tool pages (prompt generator, learning, student kit).
// Every tool works without an API key: when no cloud AI provider answers,
// a purpose-built local builder produces a useful structured result.

export const SOURCE_LABEL = {
  openai: 'OpenAI',
  groq: 'Groq',
  gemini: 'Gemini',
  openrouter: 'OpenRouter',
  alibaba: 'Alibaba Qwen',
  local: 'Built-in assistant',
};

function clean(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function clip(text, max = 400) {
  const value = clean(text);
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

/**
 * Ask the /api/ai endpoint. When a real cloud provider answered, use its text.
 * When the API fell back to the generic local model (or failed entirely),
 * run the tailored local builder instead so the tool always stays on-topic.
 */
export async function askAI(prompt, localFallback) {
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.text && data.source && data.source !== 'local') {
      return { text: data.text, source: data.source };
    }
    return { text: localFallback(), source: 'local' };
  } catch {
    return { text: localFallback(), source: 'local' };
  }
}

/* ------------------------------------------------------------------ */
/* Prompt generator                                                     */
/* ------------------------------------------------------------------ */

export const PROMPT_TYPES = [
  { id: 'image', label: '🎨 Image / Photo' },
  { id: 'writing', label: '✍️ Writing' },
  { id: 'coding', label: '💻 Coding' },
  { id: 'study', label: '📚 Study' },
  { id: 'marketing', label: '📣 Marketing' },
  { id: 'email', label: '✉️ Email' },
  { id: 'chatbot', label: '🤖 Chatbot' },
  { id: 'business', label: '💼 Business' },
];

export function buildPrompt({ type, topic, tone, audience, format, extras }) {
  const subject = clip(topic, 220) || 'the topic';
  const style = clean(tone) || 'clear and professional';
  const who = clean(audience) || 'a general audience';
  const out = clean(format) || 'a well-structured answer';
  const more = clean(extras);

  const shells = {
    image: [
      `Create a high-quality image of ${subject}.`,
      `Visual style: ${style}.`,
      `Mood & lighting: match the style above, natural detail, balanced composition.`,
      `Audience / use: ${who}.`,
      `Output: ${out}.`,
      more ? `Extra details to include: ${more}` : 'Add rich, specific visual details.',
      'Avoid: text, watermarks, logos, blurry faces, extra limbs.',
    ],
    writing: [
      `You are an expert writer. Write ${out} about ${subject}.`,
      `Tone of voice: ${style}.`,
      `Target reader: ${who}.`,
      `Structure: start with a strong opening, use clear sections or paragraphs, end with a takeaway or call to action.`,
      more ? `Key points to cover: ${more}` : 'Use concrete examples and plain language.',
      'Constraints: original wording, no filler, no plagiarism.',
    ],
    coding: [
      `You are a senior software engineer. Task: ${subject}.`,
      `Deliver: ${out} — include clean, commented code and a short explanation.`,
      `Tone: ${style}.`,
      `Audience: ${who}.`,
      more ? `Requirements / stack: ${more}` : 'Prefer widely used, well-supported libraries.',
      'Constraints: handle edge cases, mention time complexity when relevant, no placeholder code.',
    ],
    study: [
      `You are a patient tutor. Teach ${subject} to ${who}.`,
      `Level & tone: ${style}.`,
      `Deliver: ${out} — include definitions, one worked example, and 3 review questions with answers.`,
      more ? `Focus areas: ${more}` : 'Use simple language first, then the correct terminology.',
      'Constraints: accurate facts, step-by-step reasoning, no skipped steps.',
    ],
    marketing: [
      `You are a marketing copywriter. Create ${out} for ${subject}.`,
      `Tone: ${style}.`,
      `Target customer: ${who}.`,
      `Structure: attention-grabbing headline, 2-3 benefit-driven bullets, a clear call to action.`,
      more ? `Offer / details: ${more}` : 'Focus on benefits over features.',
      'Constraints: persuasive but honest, no hype words, mobile-friendly length.',
    ],
    email: [
      `Write ${out} about ${subject}.`,
      `Tone: ${style}.`,
      `Recipient: ${who}.`,
      `Format: subject line, greeting, short body (max 150 words), sign-off.`,
      more ? `Points to include: ${more}` : 'Keep it polite, specific and easy to answer.',
      'Constraints: no fluff, clear next step, professional spelling and grammar.',
    ],
    chatbot: [
      `You are a helpful assistant for ${who}.`,
      `Personality & tone: ${style}.`,
      `Main job: ${subject}.`,
      `Format: ${out} — short paragraphs, bullet lists for steps, ask a clarifying question when input is unclear.`,
      more ? `Rules to follow: ${more}` : 'Never invent facts; say when you are unsure.',
      'Constraints: safe, respectful, concise answers.',
    ],
    business: [
      `Act as a business consultant. Deliver ${out} about ${subject}.`,
      `Tone: ${style}.`,
      `Audience: ${who}.`,
      `Structure: executive summary, key analysis, risks, recommended next steps.`,
      more ? `Context / data: ${more}` : 'Use bullet points and concrete numbers where possible.',
      'Constraints: actionable advice, no generic filler.',
    ],
  };

  return (shells[type] || shells.writing).join('\n');
}

export function enhancePromptLocally(prompt, type) {
  const base = clean(prompt);
  if (!base) return '';
  const role = {
    image: 'You are an expert AI image prompt engineer.',
    coding: 'You are a senior software engineer.',
    study: 'You are a patient tutor.',
    marketing: 'You are a senior marketing copywriter.',
    email: 'You are a professional communication coach.',
    chatbot: 'You are an AI assistant designer.',
    business: 'You are a business consultant.',
    writing: 'You are an expert editor.',
  }[type] || 'You are an expert assistant.';

  return [
    role,
    '',
    `Task: ${base}`,
    '',
    'Requirements:',
    '• Be specific and concrete — add subject, setting, style and constraints.',
    '• Use a clear structure: goal, context, steps or sections, output format.',
    '• Match the tone to the audience.',
    '• Avoid vague words like "good", "nice", "professional" without detail.',
    '',
    'Output format:',
    '• Start with the direct answer or result.',
    '• Then add supporting detail as short bullets.',
    '• End with one practical next step.',
  ].join('\n');
}

/* ------------------------------------------------------------------ */
/* Learning assistant                                                   */
/* ------------------------------------------------------------------ */

export const LEARN_MODES = [
  { id: 'explain', label: '💡 Explain simply' },
  { id: 'lesson', label: '📖 Full lesson' },
  { id: 'quiz', label: '❓ Quiz' },
  { id: 'flashcards', label: '🃏 Flashcards' },
  { id: 'summary', label: '📝 Summarize notes' },
  { id: 'plan', label: '🗓️ Study plan' },
  { id: 'terms', label: '🔑 Key terms' },
];

export function learnPrompt(mode, topic, level) {
  const subject = clip(topic, 500) || 'the topic';
  const lvl = clean(level) || 'student';
  const map = {
    explain: `Explain ${subject} in simple words for a ${lvl}. Use one everyday analogy, one example, and a 3-line recap.`,
    lesson: `Teach a complete beginner-friendly lesson on ${subject} for a ${lvl}. Include: definition, why it matters, core ideas with examples, common mistakes, and a summary.`,
    quiz: `Create a 8-question practice quiz on ${subject} for a ${lvl}: 5 multiple choice (with answers), 2 short answer, 1 challenge question. Provide an answer key.`,
    flashcards: `Create 10 study flashcards (Q&A pairs) on ${subject} for a ${lvl}, from easiest to hardest.`,
    summary: `Summarize these notes into clear study notes with bullet key points, 3 flashcards and 3 review questions:\n\n${topic}`,
    plan: `Make a practical 7-day study plan for ${subject} for a ${lvl}: daily goals, active-recall tasks, and a self-check for each day.`,
    terms: `List and define the 12 most important terms for ${subject} (for a ${lvl}), each with a one-line example.`,
  };
  return map[mode] || map.explain;
}

export function localLearning(mode, topic, level) {
  const subject = clip(topic, 160) || 'this topic';
  const lvl = clean(level) || 'student';

  if (mode === 'quiz') {
    return [
      `Practice quiz: ${subject}`,
      `Level: ${lvl}`,
      '',
      'Multiple choice',
      `1. What is the core idea of ${subject}?`,
      '   a) A minor detail  b) The central concept  c) An unrelated fact  d) None of these',
      `2. Which statement best describes ${subject}?`,
      '   a) It never changes  b) It applies only in theory  c) It connects ideas to real use  d) It is a formula only',
      `3. Where is ${subject} most often used?`,
      '   a) Only in exams  b) In real situations and problems  c) Nowhere  d) Only in history',
      `4. What is a common mistake with ${subject}?`,
      '   a) Practising it  b) Memorizing without understanding  c) Asking questions  d) Taking notes',
      `5. Which skill helps most with ${subject}?`,
      '   a) Guessing  b) Step-by-step reasoning  c) Skipping steps  d) Copying answers',
      '',
      'Short answer',
      `6. Define ${subject} in one sentence.`,
      `7. Give one real-life example connected to ${subject}.`,
      '',
      'Challenge',
      `8. Explain ${subject} to a classmate in under one minute — then list two questions they might ask.`,
      '',
      'Answer key',
      '1-b, 2-c, 3-b, 4-b, 5-b',
      '6-7: any accurate, example-based answers. 8: clarity + anticipation of questions.',
    ].join('\n');
  }

  if (mode === 'flashcards') {
    return [
      `Flashcards: ${subject}`,
      `Level: ${lvl}`,
      '',
      '1. Q: What is the definition of the topic?',
      `   A: A clear statement of what ${subject} means in one or two sentences.`,
      '2. Q: Why does it matter?',
      '   A: It explains or solves something people meet in real work, study or life.',
      '3. Q: Give a simple example.',
      '   A: One concrete case you can picture — write it in your own words.',
      '4. Q: What are the key parts or steps?',
      '   A: Break the topic into 3-4 parts and name each one.',
      '5. Q: What is a common mistake?',
      '   A: Memorizing words without understanding how the idea works.',
      '6. Q: How does it connect to what you already know?',
      '   A: Link it to a topic you studied earlier this term.',
      '7. Q: What vocabulary must you remember?',
      '   A: List the 5 most important terms and define each.',
      '8. Q: What happens if you change one condition?',
      '   A: Predict the effect, then verify with your notes or an example.',
      '9. Q: How could you explain it to a friend?',
      '   A: Teach it aloud in under one minute without notes.',
      '10. Q: What should you review next?',
      '   A: The part you answered slowest today.',
    ].join('\n');
  }

  if (mode === 'plan') {
    return [
      `7-day study plan: ${subject}`,
      `Level: ${lvl}`,
      '',
      'Day 1 — Understand: read the core definition, write it in your own words, list what you do not understand yet.',
      'Day 2 — Break down: split the topic into 3-4 sub-topics, make summary notes for each.',
      'Day 3 — Examples: solve or study 5 examples, write why each one works.',
      'Day 4 — Active recall: close your notes and write everything you remember, then check the gaps.',
      'Day 5 — Practice: answer 10 questions (mix of easy and hard), mark the weak spots.',
      'Day 6 — Teach: explain the topic out loud or to a friend; record questions you stumble on.',
      'Day 7 — Review test: full self-quiz under a time limit; review only the mistakes.',
      '',
      'Daily habit: 25 minutes focus + 5 minute break, phone away. End each session with a 3-line recap.',
      'Self-check: can you define it, give an example, and answer 3 questions without notes?',
    ].join('\n');
  }

  if (mode === 'summary') {
    const notes = String(topic || '').trim();
    const sentences = notes.split(/(?<=[.!?])\s+/).filter(Boolean);
    const keep = sentences.slice(0, Math.max(3, Math.ceil(sentences.length / 3)));
    return [
      `Study summary`,
      '',
      'Key points',
      ...(keep.length ? keep.map((s) => `• ${s}`) : ['• Paste your notes to get key points.']),
      '',
      'Flashcards',
      `1. Q: What is the main idea? A: ${clip(keep[0] || notes, 140)}`,
      `2. Q: Which detail is most important? A: ${clip(keep[1] || notes, 140)}`,
      '3. Q: What should you review again? A: The part you cannot yet explain without notes.',
      '',
      'Review questions',
      '1. Summarize the notes in two sentences from memory.',
      '2. Which term was hardest, and why?',
      '3. How does this connect to the previous chapter?',
    ].join('\n');
  }

  if (mode === 'terms') {
    return [
      `Key terms: ${subject}`,
      `Level: ${lvl}`,
      '',
      `1. ${subject} — the core idea you are studying; define it in your own words.`,
      '2. Definition — the exact meaning of a term, in one sentence.',
      '3. Example — a concrete case that shows the idea working.',
      '4. Application — where the idea is used in real problems or life.',
      '5. Cause & effect — what leads to what inside this topic.',
      '6. Comparison — how this idea is similar to / different from a related one.',
      '7. Process — the ordered steps, if the topic describes how something works.',
      '8. Evidence — facts, data or sources that support the main claims.',
      '9. Assumption — what must be true for the idea to hold.',
      '10. Limitation — where the idea stops working or needs caution.',
      '11. Method — the way you solve problems in this topic.',
      '12. Recap — a 3-sentence summary you can say from memory.',
    ].join('\n');
  }

  if (mode === 'lesson') {
    return [
      `Full lesson: ${subject}`,
      `Level: ${lvl}`,
      '',
      '1. Definition',
      `In simple words, ${subject} is the idea you need to understand first. Write your own definition after reading — that is the goal of this lesson.`,
      '',
      '2. Why it matters',
      'It shows up in exams, real tasks and later topics. Mastering it makes everything after it easier.',
      '',
      '3. Core ideas',
      '• Start with the smallest building blocks of the topic.',
      '• Connect each block to one example you can picture.',
      '• Practice one small problem for each idea before moving on.',
      '',
      '4. Worked example',
      `Take a simple case of ${subject}, solve it one step at a time, and write why each step is allowed.`,
      '',
      '5. Common mistakes',
      '• Memorizing steps without knowing why they work.',
      '• Skipping the definition and jumping to formulas.',
      '• Not checking the answer with a rough estimate.',
      '',
      '6. Recap',
      `You learned what ${subject} means, why it matters, how to solve one example, and which mistakes to avoid. Tomorrow: test yourself without notes.`,
    ].join('\n');
  }

  return [
    `Study notes: ${subject}`,
    `Level: ${lvl}`,
    '',
    'In simple words',
    `${subject} is easier than it looks: learn what it means, see one example, then explain it yourself. Everything else is practice.`,
    '',
    'Remember it this way',
    `• Definition — what ${subject} means in one sentence.`,
    '• Example — one real case you can picture.',
    '• Why — one reason it matters.',
    '',
    'Try this now',
    '1. Close your notes and write the definition from memory.',
    '2. Give one example to a friend (or out loud).',
    '3. Write two questions about it and answer them.',
    '',
    'Mini recap',
    `Understand the meaning of ${subject}, attach one example to it, and test yourself with questions — that is how it sticks.`,
  ].join('\n');
}

/* ------------------------------------------------------------------ */
/* Student kit                                                          */
/* ------------------------------------------------------------------ */

export const KIT_TABS = [
  { id: 'homework', label: '📚 Homework Helper' },
  { id: 'essay', label: '✍️ Essay Writer' },
  { id: 'math', label: '📐 Math Solver' },
  { id: 'citation', label: '📚 Citation Helper' },
  { id: 'feedback', label: '✅ Assignment Feedback' },
  { id: 'schedule', label: '🗓️ Study Schedule' },
];

export function kitPrompt(tab, values) {
  const v = (key) => clip(values[key], 800);
  const map = {
    homework: `Help me solve this homework step by step (do not just give the final answer — teach the method):\n\n${v('question')}\n\nSubject: ${v('subject') || 'any'}. Level: ${v('level') || 'student'}.`,
    essay: `Write a structured essay draft about: ${v('topic')}. Level: ${v('level') || 'student'}. Length guide: ${v('length') || '5 paragraphs'}. Include a thesis, topic sentences, evidence placeholders and a conclusion.`,
    math: `Solve this math problem with clear, numbered steps and a final answer. Then add one similar practice problem:\n\n${v('problem')}`,
    citation: `Create citations for this source in APA, MLA and Chicago styles. Source details (author | title | year | site/publisher):\n\n${v('source')}`,
    feedback: `Review this assignment draft like a teacher. Give: strengths (3), improvements (3), a corrected paragraph sample, and a grade estimate out of 100.\n\n${v('draft')}`,
    schedule: `Make a realistic weekly study schedule. Subjects: ${v('subjects')}. Hours available per day: ${v('hours') || '3'}. Goal: ${v('goal') || 'balanced revision'}. Include breaks and one active-recall block per subject.`,
  };
  return map[tab] || map.homework;
}

export function localStudentKit(tab, values) {
  const v = (key) => clean(values[key]);
  const question = v('question') || v('problem') || v('topic') || v('draft') || v('source') || v('subjects');

  if (tab === 'essay') {
    const topic = v('topic') || 'your topic';
    return [
      `Essay draft: ${topic}`,
      `Level: ${v('level') || 'student'} • Length guide: ${v('length') || '5 paragraphs'}`,
      '',
      'Thesis',
      `This essay argues that ${topic} matters because it shapes how we understand the subject, what evidence supports it, and what should happen next.`,
      '',
      '1. Introduction',
      `Start with a hook about ${topic}, give one line of context, then state the thesis above.`,
      '',
      '2. Background',
      'Define the key terms and explain the context a reader needs before your argument.',
      '',
      '3. Main argument',
      'Point A — first reason with a concrete example.',
      'Point B — second reason with data or a quote (add your source).',
      'Point C — third reason that connects back to the thesis.',
      '',
      '4. Counterpoint',
      'Acknowledge one strong opposing view, then answer it with evidence.',
      '',
      '5. Conclusion',
      'Restate the thesis in new words, summarize the three points, end with one action or question.',
      '',
      'Next step: replace each placeholder with your own evidence, then check every paragraph starts with a clear topic sentence.',
    ].join('\n');
  }

  if (tab === 'math') {
    return [
      'Step-by-step solution',
      `Problem: ${question || 'Enter a problem above (e.g. 2x + 4 = 10 or 15% of 240).'}`,
      '',
      'Method',
      '1. Write down what is given and what must be found.',
      '2. Choose the operation or formula that connects them.',
      '3. Work one step at a time — same operation on both sides.',
      '4. Check the answer by substituting it back.',
      '',
      ...(solveMath(v('problem') || v('question'))),
      '',
      'Practice problem',
      'Solve a similar problem with different numbers using the same four steps — that is how the method sticks.',
    ].join('\n');
  }

  if (tab === 'citation') {
    const [author, title, year, site] = v('source').split('|').map((s) => s.trim());
    const a = author || 'Author';
    const t = title || 'Title';
    const y = year || 'Year';
    const s = site || 'Publisher';
    return [
      'Citations',
      '',
      `APA: ${a}. (${y}). ${t}. ${s}.`,
      `MLA: ${a}. “${t}.” ${s}, ${y}.`,
      `Chicago: ${a}. ${t}. ${s}, ${y}.`,
      '',
      'Tips',
      '• Double-check author spelling and the year.',
      '• Website source? Add the URL and the date you visited it.',
      '• Keep one citation style for the whole paper.',
    ].join('\n');
  }

  if (tab === 'feedback') {
    const draft = v('draft') || question || '';
    const words = draft.split(/\s+/).filter(Boolean).length;
    return [
      'Teacher-style feedback',
      '',
      'Strengths',
      `• You wrote ${words} words — a real draft beats a perfect plan.`,
      '• The main idea is present; keep it visible in every paragraph.',
      '• Structure can be improved with topic sentences (see below).',
      '',
      'Improvements',
      '1. Open each paragraph with one clear topic sentence.',
      '2. Add evidence (quote, data, example) after each claim.',
      '3. End with a conclusion that answers the introduction directly.',
      '',
      'Sample improved paragraph',
      'Topic sentence → evidence → explanation → link back to the thesis. Repeat this pattern in every paragraph.',
      '',
      `Grade estimate: ${words > 120 ? '75' : '60'}/100 — finish the draft, then re-check clarity and evidence.`,
    ].join('\n');
  }

  if (tab === 'schedule') {
    const subjects = v('subjects') || 'Math, Science, English';
    const hours = Number(v('hours')) || 3;
    const focus = Math.max(25, Math.round((hours * 60) / 3 / 5) * 5);
    return [
      `Weekly study schedule (${hours}h/day)`,
      `Subjects: ${subjects}`,
      `Goal: ${v('goal') || 'balanced revision'}`,
      '',
      `Block 1 (${focus} min) — hardest subject first: new material + practice problems.`,
      `Break (10 min) — move, water, no phone.`,
      `Block 2 (${focus} min) — second subject: review notes + active recall.`,
      `Break (10 min)`,
      `Block 3 (${focus} min) — third subject or homework. Last 10 min: 3-line recap of everything studied.`,
      '',
      'Weekly rhythm',
      'Mon–Fri: the 3 blocks above. Sat: practice test under time limit. Sun: light review + plan next week.',
      '',
      'Rules that work',
      '• Phone in another room during blocks.',
      '• Recall from memory before re-reading notes.',
      '• Track what you actually finished — not hours sat.',
    ].join('\n');
  }

  // homework
  return [
    'Homework helper — solution path',
    `Question: ${question || 'Type your homework question above.'}`,
    `Subject: ${v('subject') || 'any'} • Level: ${v('level') || 'student'}`,
    '',
    'How to solve it',
    '1. Restate the question in your own words — what exactly is being asked?',
    '2. List what you know (facts, formulas, given numbers).',
    '3. Pick the method that connects the known to the unknown.',
    '4. Work one small step at a time and write the reason for each step.',
    '5. Check: does the answer make sense? Plug it back in or estimate.',
    '',
    'Then',
    '• Write the final answer as a full sentence.',
    '• Note the one step that was hardest — review that tonight.',
    '• Try a similar problem without help to lock it in.',
  ].join('\n');
}

function solveMath(problem) {
  const x = String(problem || '');
  const pct = x.match(/([0-9.]+)\s*%\s*of\s*([0-9.]+)/i);
  if (pct) {
    const value = (Number(pct[1]) * Number(pct[2])) / 100;
    return [
      `1. Convert the percentage to a decimal: ${pct[1]}% = ${Number(pct[1]) / 100}.`,
      `2. Multiply by the total: ${Number(pct[1]) / 100} × ${pct[2]} = ${value}.`,
      `Answer: ${value}`,
    ];
  }
  const eq = x.match(/^([0-9.]+)x\s*([+-])\s*([0-9.]+)\s*=\s*([0-9.]+)$/i);
  if (eq) {
    const a = Number(eq[1]);
    const b = (eq[2] === '+' ? 1 : -1) * Number(eq[3]);
    const c = Number(eq[4]);
    return [
      `1. Start with ${a}x ${eq[2]} ${Math.abs(b)} = ${c}.`,
      `2. Move the constant: ${a}x = ${c} - (${b}) = ${c - b}.`,
      `3. Divide both sides by ${a}: x = ${(c - b) / a}.`,
      `Answer: x = ${((c - b) / a).toFixed(4)}`,
    ];
  }
  const simple = x.match(/^\s*(-?\d+(?:\.\d+)?)\s*([+\-*/x×÷])\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (simple) {
    const a = Number(simple[1]);
    const b = Number(simple[3]);
    const op = simple[2];
    const r = op === '+' ? a + b : op === '-' ? a - b : (op === '*' || op === 'x' || op === '×') ? a * b : b === 0 ? 'undefined (division by zero)' : a / b;
    return [`1. Apply the operation directly: ${a} ${op} ${b}.`, `Answer: ${r}`];
  }
  return ['• Type an equation like "2x + 4 = 10", a percentage like "15% of 240", or an arithmetic like "45 / 5".'];
}
