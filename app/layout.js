import './globals.css';

export const metadata = {
  title: 'QuickToolBox | Free Online Tools',
  description: 'Free calculators, converters, PDF, QR, image and productivity tools.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4690893675414003"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
