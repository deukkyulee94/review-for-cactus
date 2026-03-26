import { redirect } from "next/navigation";

/** /admin 접근 시 공연 목록으로 보냅니다. */
export default function AdminIndexPage() {
  redirect("/admin/shows");
}
