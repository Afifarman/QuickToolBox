import { SITE_URL } from '../../lib/site-config';

const title = 'QuickToolBox AI Workspace';
const description =
  'Sign in to access the QuickToolBox AI workspace, chat assistant and free-tier AI tools.';

export const metadata = {
  title,
  description,
  alternates: {
    canonical: `${SITE_URL}/ai`,
  },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/ai`,
    siteName: 'QuickToolBox',
    title,
    description,
  },
  twitter: {
    card: 'summary',
    title,
    description,
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function AILayout({ children }) {
  return children;
}
