import { buildMetadata } from '../../lib/metadata';

export const metadata = buildMetadata({
  title: 'Sign in',
  description: 'Sign in to QuickToolBox to save tools, history and AI results. Every tool also works without an account.',
  path: '/login',
  noindex: true,
});

export default function LoginLayout({ children }) {
  return children;
}
