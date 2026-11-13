import { SITE_URL } from '../lib/site-config';
import { LISTED_STUDENT_TOOLS } from '../lib/student-tools';

// Only indexable routes belong here. /ai, /ai-platform and /ai/local are
// intentionally noindex and must stay out of the sitemap.
const corePages = [
  { path: '/', changeFrequency: 'daily', priority: 1 },
  { path: '/file-converter', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/photo-studio', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/cv-maker', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/student-tools', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/ai-photo-editor', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/ai-prompts', changeFrequency: 'weekly', priority: 0.8 },
];

export default function sitemap() {
  const pages = [
    ...corePages,
    ...LISTED_STUDENT_TOOLS.map(({ slug }) => ({
      path: `/student-tools/${slug}`,
      changeFrequency: 'monthly',
      priority: 0.7,
    })),
  ];

  return pages.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency,
    priority,
  }));
}
