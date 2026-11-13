import { buildMetadata } from '../../lib/metadata';

export const metadata = buildMetadata({
  title: 'Saved results',
  description: 'Results saved locally in this browser.',
  path: '/saved',
  noindex: true,
});

export default function SavedLayout({ children }) {
  return children;
}
