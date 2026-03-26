import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-session";

/**
 * 로그인이 필요한 어드민 하위 경로만 감쌉니다.
 * Node 런타임에서 `isAdminAuthenticated` 가 `.env.local` 의 ADMIN_SECRET 과
 * 동일한 규칙으로 쿠키를 검증합니다. (Edge 미들웨어는 환경 변수가 비는 경우가 있어 제거함)
 */
export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
  return <>{children}</>;
}
