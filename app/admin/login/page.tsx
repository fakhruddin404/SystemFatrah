import { redirect } from 'next/navigation';
import { getAdmin } from '@/lib/admin/auth';
import { SITE_NAME } from '@/lib/site';
import LoginForm from '@/components/admin/LoginForm';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  // Already signed in as an admin: go straight to the dashboard.
  if (await getAdmin()) redirect('/admin');

  return (
    <main className="min-h-screen bg-sand flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-[400px] border border-ink bg-warm-white p-8">
        <p className="text-xs font-semibold tracking-[0.12em] text-maroon uppercase mb-3">Admin</p>
        <h1 className="font-serif text-3xl font-medium mb-1">{SITE_NAME}</h1>
        <p className="text-sm text-ink-soft mb-8">Sign in to manage products and ready stock.</p>
        <LoginForm />
      </div>
    </main>
  );
}
