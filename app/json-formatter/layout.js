import { buildMetadata } from '../../lib/metadata';

export const metadata = buildMetadata({
  title: 'Free JSON Formatter & Validator – Pretty Print JSON',
  description: 'Format, validate and minify JSON instantly in your browser. No data leaves your device.',
  path: '/json-formatter',
});

export default function JsonFormatterLayout({ children }) {
  return children;
}