import AiPlatformHub from '../../components/AiPlatformHub';
import { buildMetadata } from '../../lib/metadata';

export const metadata = buildMetadata({
  title: 'AI Platform',
  description: 'Explore AI tools and model options in the QuickToolBox AI platform without signing in.',
  path: '/ai-platform',
  noindex: true,
});

export default function AiPlatformPage() {
  return <AiPlatformHub />;
}
