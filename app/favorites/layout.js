import { buildMetadata } from '../../lib/metadata';

export const metadata = buildMetadata({
  title: 'Favourites',
  description: 'Your favourite QuickToolBox tools, saved on this device.',
  path: '/favorites',
  noindex: true,
});

export default function FavoritesLayout({ children }) {
  return children;
}
