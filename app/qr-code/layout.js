import { buildMetadata } from '../../lib/metadata';

export const metadata = buildMetadata({
  title: 'Free QR Code Generator – Create QR Codes Instantly',
  description: 'Generate QR codes for text, URLs and more, directly in your browser. No uploads, no tracking.',
  path: '/qr-code',
});

export default function QrCodeLayout({ children }) {
  return children;
}