import { buildMetadata } from '../../lib/metadata';

export const metadata = buildMetadata({
  title: 'Reset password',
  description: 'Reset the password for your QuickToolBox account.',
  path: '/reset-password',
  noindex: true,
});

export default function ResetPasswordLayout({ children }) {
  return children;
}
