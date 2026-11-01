import AiPlatformHub from '../../components/AiPlatformHub';

export const metadata = {
  title: 'QuickToolBox AI Platform',
  description: 'Sign in to explore AI tools and model options in the QuickToolBox AI platform.',
  alternates: { canonical: 'https://quicktoolbox-bd.vercel.app/ai-platform' },
  robots: { index: false, follow: true },
};

export default function AiPlatformPage() {
  return <AiPlatformHub />;
}
