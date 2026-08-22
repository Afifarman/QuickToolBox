const baseUrl = 'https://www.quick-tool-box-vercel.app';

const paths = [
  '/', '/login', '/ai', '/cv-maker', '/tools', '/student-tools',
  '/tools/pdf-merge', '/tools/pdf-split', '/tools/pdf-compressor', '/tools/image-to-pdf',
  '/tools/passport-photo-maker', '/tools/gpa-calculator', '/tools/emi-calculator',
  '/tools/salary-calculator', '/tools/tax-vat-calculator', '/tools/invoice-generator',
  '/tools/cover-letter-builder', '/tools/qr-scanner', '/tools/url-shortener',
  '/tools/json-formatter', '/tools/favicon-generator', '/tools/meta-tag-generator',
  '/tools/sitemap-generator', '/tools/password-strength-checker', '/tools/world-clock',
  '/student-tools/grade-calculator', '/student-tools/assignment-planner', '/student-tools/study-timetable',
  '/student-tools/pomodoro-timer', '/student-tools/study-time-calculator', '/student-tools/scientific-calculator',
  '/student-tools/math-problem-solver', '/student-tools/citation-generator', '/student-tools/essay-outline-generator',
  '/student-tools/flashcard-generator', '/student-tools/quiz-generator', '/student-tools/ai-study-assistant',
  '/student-tools/notes-summarizer', '/student-tools/grammar-checker', '/student-tools/student-translator',
  '/student-tools/pdf-notes-extractor', '/student-tools/semester-result-calculator', '/student-tools/exam-countdown',
  '/student-tools/student-budget-calculator', '/student-tools/assignment-checklist', '/student-tools/study-notes-organizer',
];

export default function sitemap() {
  return paths.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '/' ? 'daily' : 'weekly',
    priority: path === '/' ? 1 : path === '/ai' || path === '/cv-maker' ? 0.9 : 0.7,
  }));
}
