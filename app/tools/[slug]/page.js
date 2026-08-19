import ToolClient from './ToolClient';
import { utilityTools, utilitySlugs } from '../../../lib/tools';

export function generateStaticParams() {
  return utilitySlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const meta = utilityTools.find(([s]) => s === slug);
  return {
    title: meta ? `${meta[2]} | QuickToolBox` : 'Tool | QuickToolBox',
    description: meta ? meta[3] : 'Free online tools.',
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  return <ToolClient slug={slug} />;
}
