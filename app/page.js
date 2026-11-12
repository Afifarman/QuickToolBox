import ToolDirectoryHome from "../components/ToolDirectoryHome";

export const metadata = {
  title: "Free Online Tools — PDF, Image, AI & Productivity | QuickToolBox",
  description: "Find browser-first PDF, image, AI and productivity tools in one searchable workspace. See available tools and open each workflow.",
  alternates: { canonical: "https://quicktoolbox-bd.vercel.app" },
};

export default function Home() {
  return <ToolDirectoryHome />;
}
