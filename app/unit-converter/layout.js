import { buildMetadata } from '../../lib/metadata';

export const metadata = buildMetadata({
  title: 'Free Unit Converter – Length, Weight, Temperature & More',
  description: 'Convert units of length, weight, temperature, volume, area, speed and time instantly in your browser.',
  path: '/unit-converter',
});

export default function UnitConverterLayout({ children }) {
  return children;
}