import './globals.css';
import Script from 'next/script';

// Currently working production Vercel domain.
const siteUrl = 'https://quick-tool-box-gamma.vercel.app';
const googleVerification = 'cmHigTtC-Ea9xH7WZYPLXIUU_7WRBaov-wg5cT8Q8Do';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'QuickToolBox | Free Online Tools',
    template: '%s | QuickToolBox',
  },
  description:
    'Free online PDF, image, calculator, student, productivity, SEO and AI tools. Fast, simple and mobile-friendly.',
  applicationName: 'QuickToolBox',
  verification: {
    google: googleVerification,
  },
  keywords: [
    'free online tools',
    'PDF tools',
    'calculator',
    'student tools',
    'AI tools',
    'SEO tools',
    'image tools',
    'QuickToolBox',
  ],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'QuickToolBox',
    title: 'QuickToolBox | Free Online Tools',
    description:
      'Free PDF, calculator, student, productivity, SEO and AI tools in one toolbox.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QuickToolBox | Free Online Tools',
    description: 'Free PDF, calculator, student, productivity, SEO and AI tools.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Explicit Google verification tag for Search Console. */}
        <meta name="google-site-verification" content={googleVerification} />
      </head>
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
