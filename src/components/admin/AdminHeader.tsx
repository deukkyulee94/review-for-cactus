"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * 어드민 영역 상단 네비게이션. 로그인 페이지에서는 숨깁니다.
 * 로그아웃은 POST /api/admin/logout (폼 제출)로 쿠키를 확실히 지웁니다.
 */
export function AdminHeader() {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return null;
  }

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
        <nav className="flex items-center gap-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Link href="/admin/shows" className="hover:text-zinc-950 dark:hover:text-white">
            공연 목록
          </Link>
          <Link href="/admin/shows/new" className="hover:text-zinc-950 dark:hover:text-white">
            공연 등록
          </Link>
        </nav>
        <form action="/api/admin/logout" method="post">
          <button
            type="submit"
            className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            로그아웃
          </button>
        </form>
      </div>
    </header>
  );
}
