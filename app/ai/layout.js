import { SITE_URL } from '../../lib/site-config';

const title = 'Free AI Writing Assistant Online | QuickToolBox AI';
const description =
  'Use QuickToolBox AI for free to draft, rewrite, summarize, translate and improve text for study, work, CVs and emails. No account required to try the tool.';

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
    index: true,
    follow: true,
  },
};

export default function AILayout({ children }) {
  return children;
}
