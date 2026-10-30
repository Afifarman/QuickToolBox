import AiPlatformHub from '../../components/AiPlatformHub';

export const metadata = {
  title: 'AI Platform & Tools Directory',
  description: 'Explore AI tools, chat with configured AI providers, and review model provider configuration in QuickToolBox.',
  alternates: { canonical: '/ai-platform' },
};

export default function AiPlatformPage() {
  return <AiPlatformHub />;
}
