import { buildMetadata } from '../../lib/metadata';

export const metadata = buildMetadata({
  title: 'Free AI Prompt Generator – Image, Study, Coding & SEO Prompts',
  description:
    'Turn a rough goal into a clear, copy-ready prompt for image editing, image generation, study, coding, SEO or social media.',
  path: '/ai-prompts',
});

export default function AIPromptsLayout({ children }) {
  return children;
}
