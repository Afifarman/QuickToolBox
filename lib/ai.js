function sentences(text) {
  return text.replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+/).filter(Boolean);
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
    const r = op === '+' ? a + b : op === '-' ? a - b : (op === '*' || op === 'x' || op === '×') ? a * b : b === 0 ? 'undefined (division by zero)' : a / b;
    return `${a} ${op} ${b} = ${r}`;
  }

  const pct = p.match(/([0-9.]+)\s*%\s*of\s*([0-9.]+)/i);
  if (pct) return `${pct[1]}% of ${pct[2]} = ${(Number(pct[1]) * Number(pct[2]) / 100).toFixed(4)}`;

  if (/\b(summar|tl;dr|brief)\b/.test(lower)) {
    const parts = sentences(p.replace(/^(please\s+)?(summarize|summary|tl;dr)[:\s-]*/i, ''));
    const keep = parts.slice(0, Math.max(2, Math.ceil(parts.length / 3)));
    return keep.length ? keep.join(' ') : `Summary: ${p.slice(0, 280)}`;
  }

  if (/\b(rewrite|improve|polish|professional)\b/.test(lower)) {
    const body = p.replace(/^(please\s+)?(rewrite|improve|polish|make professional)[:\s-]*/i, '').trim();
    const clean = body.replace(/\s+/g, ' ').replace(/\bi\b/g, 'I');
    return clean.charAt(0).toUpperCase() + clean.slice(1) + (/[.!?]$/.test(clean) ? '' : '.');
  }

  if (/\b(cv|resume|cover letter)\b/.test(lower)) {
    return [
      'Professional summary',
      '',
      'Results-focused professional with strong communication, problem-solving and delivery skills. Comfortable working independently and in teams, and ready to contribute from day one.',
      '',
      'Suggested bullet points',
      '• Delivered work on time and improved everyday processes.',
      '• Communicated clearly with teammates and stakeholders.',
      '• Learned new tools quickly and applied them to real tasks.',
      '',
      'Based on your request:',
      p.slice(0, 500)
    ].join('\n');
  }

  if (/\b(email|letter)\b/.test(lower)) {
    return `Subject: Follow-up\n\nHello,\n\nI hope you are well. ${p.replace(/\s+/g, ' ')}\n\nPlease let me know if you need anything else.\n\nKind regards`;
  }

  if (/\b(quiz|question)\b/.test(lower)) {
    const topic = p.replace(/.*\b(about|on)\b/i, '').slice(0, 80) || 'this topic';
    return [1, 2, 3, 4, 5].map(i => `${i}. What is an important idea about ${topic.trim()}?`).join('\n');
  }

  if (/\b(outline|essay)\b/.test(lower)) {
    return `Essay outline\n\n1. Introduction — ${p.slice(0, 120)}\n2. Background and definitions\n3. Main argument with examples\n4. Counterpoint and response\n5. Conclusion and next steps`;
  }

  if (/\b(translate|bangla|bengali|বাংলা)\b/.test(lower)) {
    return `Translation notes\n\nOriginal:\n${p}\n\nA simple English restatement:\n${p.replace(/\s+/g, ' ').trim()}`;
  }

  const bits = sentences(p);
  if (bits.length >= 3) {
    return `Here is a clear response:\n\n${bits.slice(0, 6).join(' ')}\n\nKey takeaway: ${bits[0]}`;
  }

  return [
    `Here is a useful answer to: "${p.slice(0, 180)}"`,
    '',
    '1. Restate the goal in one sentence so the request is clear.',
    '2. Break the work into small steps you can finish today.',
    '3. Write a first draft, then tighten wording and check facts.',
    '4. End with one action you can take immediately.',
    '',
    `Draft: ${p.charAt(0).toUpperCase()}${p.slice(1)}${/[.!?]$/.test(p) ? '' : '.'}`
  ].join('\n');
}
