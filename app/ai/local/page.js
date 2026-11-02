import LocalAIChat from '../../../components/LocalAIChat';

export const metadata = {
  title: 'Free Local AI Chat | QuickToolBox',
  description: 'Run an open-source language model in your browser with WebGPU. No login or paid AI API required.',
  robots: { index: false, follow: true },
};

export default function LocalAIPage() {
  return <LocalAIChat />;
}
