import { buildMetadata } from '../../lib/metadata';

export const metadata = buildMetadata({
  title: 'Free CV Maker – Build and Export a Professional Resume',
  description:
    'Pick a template, add your details and export a polished CV as a PDF. Live preview, 12 layouts and no sign-up required.',
  path: '/cv-maker',
});

export default function CVMakerLayout({ children }) {
  return children;
}
