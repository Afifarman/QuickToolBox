import { SITE_URL } from '../../../lib/site-config.js';

const TOOL_METADATA = {
  'grade-calculator': ['Grade & Percentage Calculator', 'Calculate percentage and grade from obtained marks and full marks.'],
  'gpa-cgpa-calculator': ['GPA / CGPA Calculator', 'Calculate credit-weighted GPA from course results on a 4.00 scale.'],
  'semester-result-calculator': ['Semester Result Calculator', 'Calculate your weighted semester GPA using course credits and grade points.'],
  'word-character-counter': ['Word & Character Counter', 'Count words, characters, lines and estimated reading time.'],
  'study-timetable': ['Study Timetable Generator', 'Create a simple weekly plan from your subjects.'],
  'study-time-calculator': ['Study Time Calculator', 'Divide total study hours into a daily target.'],
  'scientific-calculator': ['Scientific Calculator', 'Evaluate arithmetic and supported scientific expressions.'],
  'math-problem-solver': ['Math Problem Solver', 'Solve percentages and basic linear equations.'],
  'citation-generator': ['Citation Generator', 'Format a basic reference in APA, MLA and Chicago styles.'],
  'essay-outline-generator': ['Essay Outline Generator', 'Build a clear outline around your essay topic.'],
  'quiz-generator': ['Quiz Generator', 'Turn notes into revision questions.'],
  'notes-summarizer': ['Notes Summarizer', 'Create a short extractive summary from your notes.'],
  'grammar-checker': ['Grammar Checker', 'Clean common spacing, capitalization and punctuation issues.'],
  'student-translator': ['Student Translator', 'Translate text using the configured AI service, when available.'],
  'pdf-notes-extractor': ['PDF Study Notes Extractor', 'Extract selectable text from a PDF in your browser.'],
  'exam-countdown': ['Exam Countdown', 'Calculate the time remaining until your exam.'],
  'student-budget-calculator': ['Student Budget Calculator', 'Calculate monthly expenses and remaining balance.'],
  'assignment-checklist': ['Assignment Checklist', 'Save assignments, due dates and completion status on this device.'],
  'study-notes-organizer': ['Study Notes Organizer', 'Save and organize notes by subject.'],
};

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const [title, description] = TOOL_METADATA[slug] || ['Student Tool', 'Use a free QuickToolBox student utility.'];
  const canonical = `${SITE_URL}/student-tools/${slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: 'website', url: canonical, title: `${title} | QuickToolBox`, description },
  };
}

export default function StudentToolLayout({ children }) {
  return children;
}
