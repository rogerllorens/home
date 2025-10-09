import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/mod/admin-nav';
import { verifyAccessToken } from '@/lib/server/session';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get('accessToken')?.value;

  if (!token) {
    redirect('/auth/login');
  }

  try {
    const payload = await verifyAccessToken(token);
    if (payload.scope !== 'admin') {
      redirect('/auth/login');
    }
  } catch (error) {
    redirect('/auth/login');
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <AdminNav />
      <div className="flex-1 space-y-6">{children}</div>
    </div>
  );
}
