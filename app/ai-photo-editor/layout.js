import { buildMetadata } from '../../lib/metadata';

export const metadata = buildMetadata({
  title: 'Free AI Photo Editor – Retouch and Restyle Photos',
  description:
    'Upload a photo, describe the change you want and let AI restyle it. Brightness, contrast and saturation controls work directly in your browser.',
  path: '/ai-photo-editor',
});

export default function AIPhotoEditorLayout({ children }) {
  return children;
}
