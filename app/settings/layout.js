import { buildMetadata } from '../../lib/metadata';

export const metadata = buildMetadata({
  title: 'Settings',
  description: 'Theme, language and notification preferences for QuickToolBox.',
  path: '/settings',
  noindex: true,
});

export default function SettingsLayout({ children }) {
  return children;
}
