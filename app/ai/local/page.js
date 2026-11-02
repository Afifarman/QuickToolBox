import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '../../../lib/security/auth';
import LocalAIChat from '../../../components/LocalAIChat';

export const metadata = {
  title: 'Free Local AI Chat | QuickToolBox',
  description: 'Run an open-source language model in your browser with WebGPU. No paid AI API required.',
  robots: { index: false, follow: true },
};

export default async function LocalAIPage() {
  const { user } = await getAuthenticatedUser();
  if (!user) redirect('/login?next=%2Fai%2Flocal');
  return <LocalAIChat />;
}
