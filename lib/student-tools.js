/**
 * Single source of truth for the student tool routes.
 *
 * Used by:
 * - app/student-tools/page.js (directory grid)
 * - app/student-tools/[slug]/page.js (tool UI)
 * - app/student-tools/[slug]/layout.js (per-page metadata)
 * - app/sitemap.js
 *
 * Keep the object order: it defines the directory order.
 */
export const STUDENT_TOOLS = {
  'grade-calculator': {
    icon: '📊',
    title: 'Grade & Percentage Calculator',
    summary: 'Calculate percentage and grade from obtained marks.',
    card: 'Calculate your percentage and grade from obtained and total marks.',
  },
  'study-timetable': {
    icon: '📅',
    title: 'Study Timetable Generator',
    summary: 'Create a simple weekly plan from your subjects.',
    card: 'Organize your subjects into a clear, practical weekly study plan.',
  },
  'study-time-calculator': {
    icon: '⏰',
    title: 'Study Time Calculator',
    summary: 'Divide total study hours into a daily target.',
    card: 'Divide your study goal into manageable daily sessions.',
  },
  'scientific-calculator': {
    icon: '🔢',
    title: 'Scientific Calculator',
    summary: 'Evaluate arithmetic and supported scientific expressions.',
    card: 'Work through everyday calculations and common scientific expressions.',
  },
  'math-problem-solver': {
    icon: '📐',
    title: 'Math Problem Solver',
    summary: 'Solve percentages and basic linear equations.',
    card: 'Get help with arithmetic, percentages and basic linear equations.',
  },
  'citation-generator': {
    icon: '📚',
    title: 'Citation Generator',
    summary: 'Format a basic reference in APA, MLA and Chicago styles.',
    card: 'Format a basic reference in APA, MLA or Chicago style.',
  },
  'essay-outline-generator': {
    icon: '✍️',
    title: 'Essay Outline Generator',
    summary: 'Build a clear outline around your essay topic.',
    card: 'Turn an essay topic into a structured outline with key sections.',
  },
  'quiz-generator': {
    icon: '❓',
    title: 'Quiz Generator',
    summary: 'Turn notes into revision questions.',
    card: 'Turn your study notes into quick practice questions.',
  },
  'notes-summarizer': {
    icon: '📄',
    title: 'Notes Summarizer',
    summary: 'Create a short extractive summary from your notes.',
    card: 'Condense your notes into a shorter, easier-to-review summary.',
  },
  'grammar-checker': {
    icon: '📝',
    title: 'Grammar Checker',
    summary: 'Clean common spacing, capitalization and punctuation issues.',
    card: 'Review common spacing, capitalization and punctuation issues.',
  },
  'student-translator': {
    icon: '🌐',
    title: 'Student Translator',
    summary: 'Translate text using the configured AI service, when available.',
    card: 'Translate text when a supported translation service is available.',
  },
  'pdf-notes-extractor': {
    icon: '📑',
    title: 'PDF Study Notes Extractor',
    summary: 'Extract selectable text from a PDF in your browser.',
    card: 'Extract selectable text from a PDF for easier study and revision.',
  },
  'semester-result-calculator': {
    icon: '📈',
    title: 'Semester Result Calculator',
    summary: 'Calculate your weighted semester GPA.',
    card: 'Calculate your weighted semester GPA using course credits and grade points.',
  },
  'exam-countdown': {
    icon: '🎯',
    title: 'Exam Countdown',
    summary: 'Calculate the time remaining until your exam.',
    card: 'Track the time left until your next exam.',
  },
  'student-budget-calculator': {
    icon: '💰',
    title: 'Student Budget Calculator',
    summary: 'Calculate monthly expenses and remaining balance.',
    card: 'Compare your monthly income, expenses and remaining budget.',
  },
  'assignment-checklist': {
    icon: '☑️',
    title: 'Assignment Checklist',
    summary: 'Save assignments, due dates and completion status on this device.',
    card: 'Create assignments, track progress and manage due dates on this device.',
  },
  'study-notes-organizer': {
    icon: '🗂️',
    title: 'Study Notes Organizer',
    summary: 'Save and organize notes by subject.',
    card: 'Keep your subject notes organized in this browser.',
  },
  // Routable, but intentionally not listed in the directory or sitemap.
  'gpa-cgpa-calculator': {
    icon: '🎓',
    title: 'GPA / CGPA Calculator',
    summary: 'Calculate credit-weighted GPA from course results.',
    card: 'Calculate credit-weighted GPA from course results.',
    hidden: true,
  },
  'word-character-counter': {
    icon: '🔤',
    title: 'Word & Character Counter',
    summary: 'Count words, characters, lines and reading time.',
    card: 'Count words, characters, lines and reading time.',
    hidden: true,
  },
};

export const STUDENT_TOOL_SLUGS = Object.keys(STUDENT_TOOLS);

/** Directory order (excludes routes marked hidden). */
export const LISTED_STUDENT_TOOLS = Object.entries(STUDENT_TOOLS)
  .filter(([, tool]) => !tool.hidden)
  .map(([slug, tool]) => ({ slug, ...tool }));

export function getStudentTool(slug) {
  return STUDENT_TOOLS[slug] || null;
}
