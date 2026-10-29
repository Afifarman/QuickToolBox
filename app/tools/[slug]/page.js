import ToolClient from './ToolClient';
import { SITE_URL } from '../../../lib/site-config';

const TOOL_META = {
  'pdf-merge': ['PDF Merge', 'Merge multiple PDF files in your browser with this free online PDF tool.'],
  'pdf-split': ['PDF Split', 'Split a PDF into selected pages with this free online PDF tool.'],
  'pdf-compressor': ['PDF Compressor', 'Optimize and save a PDF in your browser. Results depend on the file.'],
  'image-to-pdf': ['Image to PDF Converter', 'Convert JPG and PNG images into a PDF file in your browser.'],
  'passport-photo-maker': ['Passport Photo Maker', 'Create a square passport-style photo from an image in your browser.'],
  'gpa-calculator': ['GPA and CGPA Calculator', 'Calculate a weighted GPA from course credits and grade points using this free GPA calculator.'],
  'emi-calculator': ['EMI Calculator', 'Estimate monthly loan payments and total interest with this free EMI calculator.'],
  'salary-calculator': ['Salary Calculator', 'Estimate net salary after a percentage-based deduction. This is a general estimate.'],
  'tax-vat-calculator': ['VAT Calculator', 'Calculate VAT and total price from an amount and VAT percentage.'],
  'invoice-generator': ['Invoice Generator', 'Create an itemized invoice and print or save it as a PDF.'],
  'cover-letter-builder': ['Cover Letter Builder', 'Draft a professional cover letter for a job application.'],
  'qr-scanner': ['QR Code Scanner', 'Scan QR codes using a supported browser and camera.'],
  'url-shortener': ['URL Shortener', 'Create a shorter link using an external URL-shortening service.'],
  'json-formatter': ['JSON Formatter and Validator', 'Format, validate, and minify JSON in your browser.'],
  'favicon-generator': ['Favicon Generator', 'Create and download a PNG favicon from an image.'],
  'meta-tag-generator': ['Meta Tag Generator', 'Generate HTML title, description, canonical, and Open Graph meta tags.'],
  'sitemap-generator': ['XML Sitemap Generator', 'Generate an XML sitemap from a list of page URLs.'],
  'password-strength-checker': ['Password Strength Checker', 'Estimate password strength locally without sending it to a server.'],
  'world-clock': ['World Clock and Time Zone Converter', 'Check the current time in cities and time zones around the world.'],
};

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const item = TOOL_META[slug];
  if (!item) {
    return {
      title: 'Tool Not Found',
      robots: { index: false, follow: true },
    };
  }
  const [title, description] = item;
  const canonical = new URL(`/tools/${slug}`, SITE_URL).toString();
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      siteName: 'QuickToolBox',
      title: `${title} | QuickToolBox`,
      description,
    },
    twitter: {
      card: 'summary',
      title: `${title} | QuickToolBox`,
      description,
    },
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  return <ToolClient slug={slug} />;
}
