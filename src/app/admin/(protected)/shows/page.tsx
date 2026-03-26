import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

/**
 * 어드민 공연 목록: 삭제 기능은 예시 범위에서 제외했으며, 공개 URL 확인용 링크를 둡니다.
 */
export default async function AdminShowsPage() {
  const supabase = await createClient();
  const { data: performances, error } = await supabase
    .from("performances")
    .select("id, slug, title, poster_url, period_start, period_end, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        목록을 불러오지 못했습니다: {error.message}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          등록된 공연
        </h1>
        <Link
          href="/admin/shows/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          새 공연 등록
        </Link>
      </div>
      {!performances?.length ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          등록된 공연이 없습니다.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-700 dark:border-zinc-700 dark:bg-zinc-900">
          {performances.map((p) => (
            <li
              key={p.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
            >
              <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
                {p.poster_url ? (
                  <Image
                    src={p.poster_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {p.title}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {p.period_start} ~ {p.period_end}
                </p>
                <p className="mt-1 truncate text-xs text-zinc-400 dark:text-zinc-500">
                  슬러그: {p.slug}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-3">
                <Link
                  href={`/admin/shows/${p.id}/edit`}
                  className="text-sm font-medium text-zinc-900 underline hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
                >
                  수정
                </Link>
                <Link
                  href={`/show/${p.slug}`}
                  className="text-sm text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  공개 페이지 열기
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
