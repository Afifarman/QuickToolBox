import './globals.css';
import Script from 'next/script';
import ThemeScript from './ThemeScript';

export const metadata = {
  title: 'QuickToolBox | Free Online Tools',
  description: 'Fast, free online calculators, converters, PDF, QR, image, productivity and AI tools.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><ThemeScript /></head>
      <body>
        {children}
        <Script
          async
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4690893675414003"
          crossOrigin="anonymous"
        />
      </body>
    </html>
  );
}
