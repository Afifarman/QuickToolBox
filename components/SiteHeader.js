'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Home' },
  { href: '/ai-platform', label: 'AI Platform' },
  { href: '/file-converter', label: 'File Converter' },
  { href: '/photo-studio', label: 'Photo Studio' },
];

export default function SiteHeader() {
  const pathname = usePathname() || '/';
  return (
    <header className="qt-site-header">
      <Link className="qt-site-brand" href="/" aria-label="QuickToolBox home">
        <span className="qt-site-mark">Q</span><span>QuickToolBox</span><span className="qt-brand-dot" />
      </Link>
      <nav className="qt-site-nav" aria-label="Main navigation">
        {links.map(({ href, label }) => {
          const active = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
          return <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={active ? 'is-active' : ''}>{label}</Link>;
        })}
        <Link className="qt-site-register" href="/login?mode=register">Get started <span aria-hidden="true">↗</span></Link>
      </nav>
    </header>
  );
}
