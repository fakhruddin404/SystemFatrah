import { requireAdmin } from '@/lib/admin/auth';
import AdminShell from '@/components/admin/AdminShell';

// Admin pages always read fresh data for the signed-in user.
export const dynamic = 'force-dynamic';

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const { email } = await requireAdmin();
  return <AdminShell email={email}>{children}</AdminShell>;
}
