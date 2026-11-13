import { buildMetadata } from '../../lib/metadata';

export const metadata = buildMetadata({
  title: 'Profile',
  description: 'Manage your QuickToolBox account information.',
  path: '/profile',
  noindex: true,
});

export default function ProfileLayout({ children }) {
  return children;
}
