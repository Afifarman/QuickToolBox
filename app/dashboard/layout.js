import { buildMetadata } from '../../lib/metadata';

export const metadata = buildMetadata({
  title: 'Dashboard',
  description: 'Your QuickToolBox workspace shortcuts.',
  path: '/dashboard',
  noindex: true,
});

export default function DashboardLayout({ children }) {
  return children;
}
