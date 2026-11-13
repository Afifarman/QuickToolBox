import { buildMetadata } from '../../lib/metadata';

export const metadata = buildMetadata({
  title: 'Settings',
  description: 'Choose the colour theme for QuickToolBox. Preferences are stored in this browser.',
  path: '/settings',
  noindex: true,
});

export default function SettingsLayout({ children }) {
  return children;
}
