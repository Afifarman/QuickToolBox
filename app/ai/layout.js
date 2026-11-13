import { buildMetadata } from '../../lib/metadata';

export const metadata = buildMetadata({
  title: 'AI Workspace',
  description: 'Use the QuickToolBox AI workspace and chat assistant for free, without signing in.',
  path: '/ai',
  // The workspace UI is thin and mostly interactive; keep it out of the index.
  noindex: true,
});

export default function AILayout({ children }) {
  return children;
}
