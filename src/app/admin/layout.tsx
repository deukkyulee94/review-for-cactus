import { AdminHeader } from "@/components/admin/AdminHeader";

/** 어드민 구역 공통 레이아웃: AdminHeader 로 내비게이션을 제공합니다. */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-100">
      <AdminHeader />
      <div className="px-4 py-8">{children}</div>
    </div>
  );
}
