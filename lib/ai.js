const SYSTEM_HINT = 'You are QuickToolBox AI, a practical writing and study assistant.';

function clean(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function sentences(text) {
  return clean(text).split(/(?<=[.!?])\s+/).filter(Boolean);
}

function titleCase(text) {
  return clean(text).replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

function finish(text) {
  const value = clean(text);
  if (!value) return '';
  return /[.!?]$/.test(value) ? value : `${value}.`;
}

function bodyAfter(prompt, pattern) {
  const raw = String(prompt || '');
  const afterBreak = raw.split(/\n+/).slice(1).join('\n').trim();
  if (afterBreak) return afterBreak;
  return clean(raw.replace(pattern, ''));
}

function extractRole(prompt) {
  const match = prompt.match(/\b(?:for|as)\s+(?:an?\s+)?([a-z][a-z\s/&-]{2,60}?)(?:\.|,|$)/i);
  return match ? titleCase(match[1]) : '';
}

export function localAI(prompt) {
  const p = String(prompt || '').trim();
  if (!p) return 'Write a prompt first.';
  const lower = p.toLowerCase();

  const math = p.match(/^\s*(-?\d+(?:\.\d+)?)\s*([+\-*/x×÷])\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (math) {
    const a = Number(math[1]);
    const b = Number(math[3]);
    const op = math[2];
    const r = op === '+'
      ? a + b
      : op === '-'
        ? a - b
        : (op === '*' || op === 'x' || op === '×')
          ? a * b
          : b === 0
            ? 'undefined (division by zero)'
            : a / b;
    return `${a} ${op} ${b} = ${r}`;
  }

  const pct = p.match(/([0-9.]+)\s*%\s*of\s*([0-9.]+)/i);
  if (pct) return `${pct[1]}% of ${pct[2]} = ${((Number(pct[1]) * Number(pct[2])) / 100).toFixed(4)}`;

  if (/\b(summar|tl;?dr|brief|shorten)\b/.test(lower) && !/\b(cv|resume)\b/.test(lower)) {
    const source = bodyAfter(p, /^(please\s+)?(summarize|summary|tl;?dr|briefly|shorten)[:\s-]*/i);
    const parts = sentences(source);
    const keep = parts.slice(0, Math.max(2, Math.ceil(parts.length / 3)));
    const bullets = keep.map((s) => `• ${s}`).join('\n');
    return keep.length
      ? `Summary\n\n${keep.join(' ')}\n\nKey points\n${bullets}`
      : `Summary: ${source.slice(0, 320)}`;
  }

  if (/\b(cv|resume|curriculum vitae)\b/.test(lower)) {
    const role = extractRole(p) || 'Professional';
    return [
      `${role} — professional summary`,
      '',
      `Results-focused ${role.toLowerCase()} with strong communication, problem-solving and delivery skills. Comfortable working independently and in teams, and ready to contribute from day one.`,
      '',
      'Suggested bullet points',
      `• Delivered ${role.toLowerCase()} work on time and improved everyday processes.`,
      '• Communicated clearly with teammates, clients and stakeholders.',
      '• Learned new tools quickly and applied them to real tasks.',
      '• Took ownership of assigned work and followed through to completion.',
      '',
      'Skills to highlight',
      'Communication • Teamwork • Problem solving • Microsoft Office • Time management',
      '',
      'Based on your request',
      p.slice(0, 500),
    ].join('\n');
  }

  if (/\bcover letter\b/.test(lower)) {
    const role = extractRole(p) || 'the open role';
    return `Dear Hiring Manager,\n\nI am writing to apply for ${role}. I bring reliable communication, a strong work ethic and a willingness to learn quickly. I am motivated to contribute to your team and to deliver careful, on-time work.\n\nI would welcome the chance to discuss how I can help. Thank you for your time and consideration.\n\nSincerely,\nYour Name`;
  }

  if (/\b(rewrite|improve|polish|proofread|fix grammar|make professional)\b/.test(lower)) {
    const body = bodyAfter(p, /^(please\s+)?(rewrite|improve|polish|proofread|make professional|fix grammar)[:\s-]*/i);
    const polished = finish(
      body
        .replace(/\bi\b/g, 'I')
        .replace(/\bdont\b/gi, "don't")
        .replace(/\bcant\b/gi, "can't")
        .replace(/\bwont\b/gi, "won't")
        .replace(/\bim\b/gi, "I'm")
        .replace(/\s+,/g, ',')
        .replace(/\s+\./g, '.')
    );
    return `Improved version\n\n${polished.charAt(0).toUpperCase()}${polished.slice(1)}\n\nWhy this is clearer\n• Everyday wording was tightened.\n• Grammar and capitalization were cleaned up.\n• The meaning of your original request was kept.`;
  }

  if (/\b(email|letter|message)\b/.test(lower)) {
    const body = bodyAfter(p, /^(please\s+)?(write|draft|create)?\s*(an?\s+)?(email|letter|message)[:\s-]*/i);
    return `Subject: Follow-up\n\nHello,\n\nI hope you are well. ${finish(body || p)}\n\nPlease let me know if you need anything else from me.\n\nKind regards`;
  }

  if (/\b(quiz|question|mcq)\b/.test(lower)) {
    const topic = clean(p.replace(/.*\b(about|on)\b/i, '')).slice(0, 80) || 'this topic';
    return [
      `Practice questions about ${topic}`,
      '',
      `1. What is the main idea of ${topic}?`,
      `2. Why does ${topic} matter in real life?`,
      `3. Name one example connected to ${topic}.`,
      `4. What common mistake should someone avoid with ${topic}?`,
      `5. Explain ${topic} in two sentences as if teaching a classmate.`,
    ].join('\n');
  }

  if (/\b(outline|essay)\b/.test(lower)) {
    const topic = bodyAfter(p, /^(please\s+)?(write|create|make)?\s*(an?\s+)?(essay outline|outline|essay)[:\s-]*/i) || p;
    return `Essay outline\n\nTopic: ${topic.slice(0, 160)}\n\n1. Introduction — explain the topic and your main claim.\n2. Background — define key terms and give context.\n3. Main argument — two or three supporting points with examples.\n4. Counterpoint — one opposing view and a short response.\n5. Conclusion — restate the claim and one practical next step.`;
  }

  if (/\b(translate|bangla|bengali|বাংলা)\b/.test(lower)) {
    return `Translation draft\n\nOriginal\n${p}\n\nClear English restatement\n${finish(p.replace(/^(please\s+)?(translate|in bangla|in bengali|to english)[:\s-]*/i, ''))}\n\nTip: For a full Bangla/English translation, add an AI provider key (OpenAI, Groq or Gemini) in environment variables.`;
  }

  if (/\b(explain|study|teach|what is|define|how does|how do)\b/.test(lower)) {
    const topic = bodyAfter(p, /^(please\s+)?(explain|teach|define|what is|how does|how do)[:\s-]*/i) || p;
    return [
      `Study notes: ${topic.slice(0, 120)}`,
      '',
      `In simple words: ${finish(topic)}`,
      '',
      'Remember it this way',
      `• Start with the definition of ${clean(topic).slice(0, 80)}.`,
      '• Add one real-life example you already know.',
      '• Write two review questions and answer them without notes.',
      '',
      'Mini recap',
      `You asked about ${clean(topic).slice(0, 160)}. Focus on the definition, one example, and why it matters.`,
    ].join('\n');
  }

  if (/\b(idea|brainstorm|suggest|names?)\b/.test(lower)) {
    return [
      `Ideas for: ${p.slice(0, 140)}`,
      '',
      '1. Start with the simplest version you can finish today.',
      '2. Make a clearer, more professional version of the same idea.',
      '3. Add a student-friendly or beginner version.',
      '4. Create a short checklist people can follow.',
      '5. Turn the best idea into a one-paragraph pitch.',
    ].join('\n');
  }

  const bits = sentences(p);
  if (bits.length >= 3) {
    return `Here is a clear response:\n\n${bits.slice(0, 6).join(' ')}\n\nKey takeaway: ${bits[0]}`;
  }

  return [
    `QuickToolBox answer`,
    '',
    `You asked: "${p.slice(0, 220)}"`,
    '',
    '1. Restate the goal in one sentence so the request is clear.',
    '2. Break the work into small steps you can finish today.',
    '3. Write a first draft, then tighten wording and check facts.',
    '4. End with one action you can take immediately.',
    '',
    `Draft: ${finish(p.charAt(0).toUpperCase() + p.slice(1))}`,
  ].join('\n');
}

export function extractModelText(data) {
  if (!data) return '';
  if (typeof data === 'string') return data.trim();
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  const chat = data.choices?.[0]?.message?.content;
  if (typeof chat === 'string' && chat.trim()) return chat.trim();
  if (Array.isArray(chat)) {
    const joined = chat.map((part) => part?.text || part?.content || '').join('').trim();
    if (joined) return joined;
  }
  const parts = [];
  for (const item of data.output || []) {
    if (typeof item?.text === 'string') parts.push(item.text);
    for (const content of item?.content || []) {
      if (typeof content === 'string') parts.push(content);
      else if (content?.text) parts.push(content.text);
    }
  }
  if (parts.length) return parts.join('\n').trim();
  const gemini = (data.candidates || [])
    .flatMap((candidate) => candidate?.content?.parts || [])
    .map((part) => part?.text || '')
    .join('')
    .trim();
  return gemini;
}

export const AI_SYSTEM_PROMPT = SYSTEM_HINT;
