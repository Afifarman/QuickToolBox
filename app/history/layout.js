import { buildMetadata } from '../../lib/metadata';

export const metadata = buildMetadata({
  title: 'History',
  description: 'Tools you recently used on this device.',
  path: '/history',
  noindex: true,
});

export default function HistoryLayout({ children }) {
  return children;
}
