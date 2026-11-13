import { SITE_URL } from './site-config';

const SITE_NAME = 'QuickToolBox';

/**
 * Build per-route metadata.
 *
 * `title` is intentionally passed without the brand suffix: app/layout.js
 * defines `title.template = '%s | QuickToolBox'`, which Next.js appends to
 * every child segment. Adding the brand here would duplicate it.
 *
 * `path` must start with a slash. The canonical URL is resolved against
 * SITE_URL via `metadataBase`, so preview deployments never leak into
 * canonical tags.
 */
export function buildMetadata({ title, description, path = '/', noindex = false, keywords }) {
  const url = new URL(path, SITE_URL).toString();
  const image = {
    url: '/opengraph-image',
    width: 1200,
    height: 630,
    alt: 'QuickToolBox — free file, image, AI and student tools',
  };
  const metadata = {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      url,
      siteName: SITE_NAME,
      title,
      description,
      locale: 'en_US',
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/twitter-image'],
    },
  };

  if (keywords?.length) metadata.keywords = keywords;

  if (noindex) {
    metadata.robots = { index: false, follow: true };
  }

  return metadata;
}
