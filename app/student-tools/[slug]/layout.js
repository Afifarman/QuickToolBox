import { buildMetadata } from '../../../lib/metadata';
import { getStudentTool, STUDENT_TOOL_SLUGS } from '../../../lib/student-tools';

export function generateStaticParams() {
  return STUDENT_TOOL_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const tool = getStudentTool(slug);

  if (!tool) {
    return { title: 'Tool not found', robots: { index: false, follow: false } };
  }

  return buildMetadata({
    title: tool.title,
    description: `${tool.summary} Free, browser-based and no sign-up required.`,
    path: `/student-tools/${slug}`,
    keywords: [tool.title.toLowerCase(), 'student tools', 'free online calculator', 'study tools'],
  });
}

export default function StudentToolLayout({ children }) {
  return children;
}
