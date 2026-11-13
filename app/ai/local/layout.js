import { buildMetadata } from '../../../lib/metadata';

export const metadata = buildMetadata({
  title: 'Local AI Chat – Run a Model in Your Browser',
  description:
    'Run an open-source language model in your browser with WebGPU. No login and no paid AI API required.',
  path: '/ai/local',
  // Experimental and device-dependent: keep it out of search results.
  noindex: true,
});

export default function LocalAILayout({ children }) {
  return children;
}
