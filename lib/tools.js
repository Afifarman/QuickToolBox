// Single source of truth for every tool listed on the site.
// Slugs here MUST match the keys used by the tool pages, otherwise links 404.

export const utilityTools = [
  ['pdf-merge', '📑', 'PDF Merge', 'Merge multiple PDF files in your browser.'],
  ['pdf-split', '✂️', 'PDF Split', 'Split a PDF into selected pages.'],
  ['pdf-compressor', '🗜️', 'PDF Compressor', 'Optimize and save a PDF locally.'],
  ['image-to-pdf', '🖼️', 'Image → PDF', 'Convert JPG/PNG images to a PDF.'],
  ['image-compressor', '🗜️', 'Image Compressor', 'Shrink JPG/PNG images in your browser.'],
  ['passport-photo-maker', '🪪', 'Passport Photo Maker', 'Create a standard 2×2 inch passport photo.'],
  ['qr-generator', '🔳', 'QR Code Generator', 'Create a downloadable QR code.'],
  ['qr-scanner', '📷', 'QR Scanner', 'Scan a QR code with your camera when supported.'],
  ['gpa-calculator', '🎓', 'GPA/CGPA Calculator', 'Calculate GPA or CGPA from course grades.'],
  ['emi-calculator', '🏦', 'EMI Calculator', 'Calculate monthly loan EMI and total interest.'],
  ['salary-calculator', '💵', 'Salary Calculator', 'Estimate net salary from gross salary.'],
  ['tax-vat-calculator', '🧾', 'Tax/VAT Calculator', 'Calculate VAT and simple income tax estimates.'],
  ['percentage-calculator', '％', 'Percentage Calculator', 'Percentages, increase, decrease and ratios.'],
  ['age-calculator', '🎂', 'Age Calculator', 'Find exact age in years, months and days.'],
  ['date-calculator', '📆', 'Date Calculator', 'Add days to a date or find days between dates.'],
  ['unit-converter', '📏', 'Unit Converter', 'Convert length, weight and temperature.'],
  ['currency-converter', '💱', 'Currency Converter', 'Convert currencies with live exchange rates.'],
  ['word-counter', '📖', 'Word Counter', 'Count words, characters and reading time.'],
  ['password-generator', '🔑', 'Password Generator', 'Generate strong random passwords.'],
  ['password-strength-checker', '🔐', 'Password Strength Checker', 'Check password strength locally.'],
  ['invoice-generator', '🧮', 'Invoice Generator', 'Create and print a professional invoice.'],
  ['cover-letter-builder', '✉️', 'Cover Letter Builder', 'Generate a professional cover letter.'],
  ['url-shortener', '🔗', 'URL Shortener', 'Shorten a URL using a public shortening service.'],
  ['json-formatter', '{}', 'JSON Formatter', 'Format, validate and minify JSON.'],
  ['favicon-generator', '⭐', 'Favicon Generator', 'Create a favicon from an image.'],
  ['meta-tag-generator', '🏷️', 'Meta Tag Generator', 'Generate SEO meta tags.'],
  ['sitemap-generator', '🗺️', 'Sitemap Generator', 'Generate XML sitemap content from URLs.'],
  ['world-clock', '🌍', 'World Clock / Timezone', 'View current time across time zones.'],
];

export const aiTools = [
  ['ai', '🤖', 'AI Assistant', 'Generate, rewrite, summarize and improve text with AI.'],
  ['cv-maker', '📄', 'AI CV Maker', 'Build a professional CV with 120 templates.'],
];

export const studentTools = [
  ['gpa-cgpa-calculator', '🎓', 'GPA / CGPA Calculator', 'Enter course credits and grade points.'],
  ['grade-calculator', '📊', 'Grade & Percentage Calculator', 'Enter marks and total marks.'],
  ['assignment-planner', '📝', 'Assignment Planner', 'Add assignments and deadlines. Saved locally.'],
  ['study-timetable', '📅', 'Study Timetable Generator', 'Enter subjects and available study hours.'],
  ['pomodoro-timer', '⏱️', 'Pomodoro Study Timer', 'Focus with 25-minute sessions and short breaks.'],
  ['study-time-calculator', '⏰', 'Study Time Calculator', 'Split your target study hours across days.'],
  ['scientific-calculator', '🔢', 'Scientific Calculator', 'Calculate arithmetic and scientific expressions.'],
  ['math-problem-solver', '📐', 'Math Problem Solver', 'Solve percentages and simple linear equations.'],
  ['word-character-counter', '📖', 'Word & Character Counter', 'Count words, characters, lines and reading time.'],
  ['citation-generator', '📚', 'Citation Generator', 'Generate APA, MLA or Chicago-style citations.'],
  ['essay-outline-generator', '✍️', 'Essay Outline Generator', 'Create a clear essay structure from your topic.'],
  ['flashcard-generator', '🧠', 'Flashcard Generator', 'Create editable Q&A flashcards from notes.'],
  ['quiz-generator', '❓', 'Quiz Generator', 'Create practice questions from notes.'],
  ['ai-study-assistant', '🤖', 'AI Study Assistant', 'Ask the site AI a study question.'],
  ['notes-summarizer', '📄', 'Notes Summarizer', 'Make a concise summary from notes.'],
  ['grammar-checker', '🔤', 'Grammar Checker', 'Fix spacing, capitalization and punctuation issues.'],
  ['student-translator', '🌐', 'Student Translator', 'Translate study text between languages.'],
  ['pdf-notes-extractor', '📑', 'PDF Study Notes Extractor', 'Extract text from a selectable PDF or text file.'],
  ['semester-result-calculator', '📈', 'Semester Result Calculator', 'Calculate weighted GPA from credits.'],
  ['exam-countdown', '🎓', 'Exam Countdown', 'Set an exam date and see the remaining time.'],
  ['student-budget-calculator', '💰', 'Student Budget Calculator', 'Compare monthly income with expenses.'],
  ['notes-qr-generator', '🔗', 'Notes QR Generator', 'Turn a notes link into a scannable QR code.'],
  ['assignment-checklist', '☑️', 'Assignment Checklist', 'Create, complete and remove tasks. Saved locally.'],
  ['study-notes-organizer', '🗂️', 'Study Notes Organizer', 'Store subject notes locally in your browser.'],
];

export const utilitySlugs = utilityTools.map(([slug]) => slug);
export const studentSlugs = studentTools.map(([slug]) => slug);
