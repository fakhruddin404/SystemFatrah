import Link from 'next/link';
import { signOut } from '@/app/admin/login/actions';
import { SITE_NAME } from '@/lib/site';

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/ready-stock', label: 'Ready stock' },
  { href: '/admin/products', label: 'Pre-order products' },
];

export default function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-sand">
      <header className="border-b border-ink bg-warm-white">
        <div className="max-w-[1100px] mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="font-serif text-lg font-medium">
              {SITE_NAME} <span className="text-xs font-sans text-ink-soft">Admin</span>
            </Link>
            <nav className="hidden sm:flex gap-6 text-sm font-medium">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-maroon transition-colors">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/" target="_blank" className="text-ink-soft hover:text-ink">
              View site
            </Link>
            <span className="hidden md:inline text-ink-soft">{email}</span>
            <form action={signOut}>
              <button type="submit" className="border border-ink px-3 py-1.5 text-xs font-semibold hover:bg-ink hover:text-warm-white transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </div>
        <nav className="sm:hidden flex gap-5 px-6 pb-3 text-sm font-medium overflow-x-auto">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap hover:text-maroon">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="max-w-[1100px] mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
