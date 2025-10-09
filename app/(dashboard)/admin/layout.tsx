import { AdminNav } from '@/components/mod/admin-nav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <AdminNav />
      <div className="flex-1 space-y-6">{children}</div>
    </div>
  );
}
