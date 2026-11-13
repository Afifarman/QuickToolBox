import FileConverterHub from "../../components/FileConverterHub";

export const metadata = {
  title: "Free File Converter – PDF, Image, Audio & Video",
  description: "Convert and compress files online for free without an account. Browser-based PDF and image tools, with more formats coming in tested releases.",
  alternates: { canonical: "/file-converter" },
};

export default function FileConverterPage() {
  return <FileConverterHub />;
}
