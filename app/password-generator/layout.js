import { buildMetadata } from '../../lib/metadata';

export const metadata = buildMetadata({
  title: 'Free Password Generator – Strong & Secure Passwords',
  description: 'Generate strong, random passwords with custom length and character sets, entirely in your browser.',
  path: '/password-generator',
});

export default function PasswordGeneratorLayout({ children }) {
  return children;
}