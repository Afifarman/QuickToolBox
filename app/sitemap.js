import { SITE_URL } from '../lib/site-config';

const paths = [
  '/', '/ai', '/ai-platform', '/cv-maker', '/ai-photo-editor', '/ai-prompts', '/ai/local',
];

export default function sitemap() {
  return paths.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === '/' ? 'daily' : 'weekly',
    priority: path === '/' ? 1 : path === '/ai' || path === '/ai-platform' || path === '/cv-maker' ? 0.9 : 0.7,
  }));
}
