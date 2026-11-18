import { SITE_URL } from '../lib/site-config.js';

const studentToolSlugs = [
  'grade-calculator',
  'gpa-cgpa-calculator',
  'semester-result-calculator',
  'word-character-counter',
  'study-timetable',
  'study-time-calculator',
  'scientific-calculator',
  'math-problem-solver',
  'citation-generator',
  'essay-outline-generator',
  'quiz-generator',
  'notes-summarizer',
  'grammar-checker',
  'student-translator',
  'pdf-notes-extractor',
  'exam-countdown',
  'student-budget-calculator',
  'assignment-checklist',
  'study-notes-organizer',
];

const paths = [
  '/',
  '/ai-photo-editor',
  '/ai-prompts',
  '/cv-maker',
  '/file-converter',
  '/photo-studio',
  '/student-tools',
  ...studentToolSlugs.map((slug) => `/student-tools/${slug}`),
];

export default function sitemap() {
  return paths.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === '/' || path === '/student-tools' ? 'daily' : 'weekly',
    priority: path === '/'
      ? 1
      : path === '/student-tools'
        ? 0.85
        : path.startsWith('/student-tools/')
          ? 0.7
          : path === '/cv-maker' || path === '/file-converter' || path === '/photo-studio'
            ? 0.9
            : path === '/ai-photo-editor' || path === '/ai-prompts'
              ? 0.8
              : 0.7,
  }));
}
