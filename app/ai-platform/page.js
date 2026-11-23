import AiPlatformHub from '../../components/AiPlatformHub';

export const metadata = {
  title: 'AI Studio & Free AI Tools Directory',
  description: 'Discover Nano Banana, Consensus, Hedra, Cursor, Stable Diffusion, PhotoRoom, Hailuo, Publer and Udio, plus QuickToolBox AI workspaces.',
  alternates: { canonical: '/ai-platform' },
  robots: { index: true, follow: true },
};

export default function AiPlatformPage() {
  return <AiPlatformHub />;
}
