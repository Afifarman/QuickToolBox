const baseUrl = 'https://quick-tool-box-gamma.vercel.app';

export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
