import { buildMetadata } from '../../lib/metadata';

export const metadata = buildMetadata({
  title: 'Free AI Agent – Plan, Summarize and Explain',
  description:
    'Chat with an AI agent that breaks goals into steps, builds checklists, summarizes text and explains topics. No account required.',
  path: '/ai-agent',
});

export default function AIAgentLayout({ children }) {
  return children;
}
