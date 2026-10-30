'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Home' },
  { href: '/ai-platform', label: 'AI Platform' },
  { href: '/tools', label: 'Tools' },
  { href: '/student-tools', label: 'Student' },
  { href: '/ai', label: 'AI Assistant' },
];

export default function SiteHeader() {
  const pathname = usePathname() || '/';
  const inAiPlatform = pathname.startsWith('/ai-platform');
  return (
    <header className={`qt-site-header${inAiPlatform ? ' qt-site-header-dark' : ''}`}>
      <Link className="qt-site-brand" href="/" aria-label="QuickToolBox home">
        <span className="qt-site-mark">Q</span><span>QuickToolBox</span>
      </Link>
      <nav className="qt-site-nav" aria-label="Main navigation">
        {links.map(({ href, label }) => {
          const active = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
          return <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={active ? 'is-active' : ''}>{label}</Link>;
        })}
        <Link className="qt-site-register" href="/login?mode=register">Register</Link>
      </nav>
    </header>
  );
}
