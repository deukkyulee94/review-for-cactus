import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

/**
 * 홈: 등록된 공연 목록을 Supabase에서 읽어 카드 형태로 표시합니다.
 */
export default async function HomePage() {
  const supabase = await createClient();
  const { data: performances, error } = await supabase
    .from("performances")
    .select("id, slug, title, poster_url, period_start, period_end")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
        공연 목록을 불러오지 못했습니다. 환경 변수와 Supabase 스키마를 확인하세요.
        <pre className="mt-2 whitespace-pre-wrap text-xs">{error.message}</pre>
      </div>
    );
  }

  if (!performances?.length) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
        <p className="mb-2">등록된 공연이 없습니다.</p>
        <p className="text-sm">
          어드민에서 공연을 등록한 뒤 이 페이지에 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        공연 목록
      </h1>
      <p className="mb-8 text-sm text-zinc-600 dark:text-zinc-400">
        공연을 선택하면 출연 배우에게 코멘트를 남길 수 있는 페이지로 이동합니다.
      </p>
      <ul className="grid gap-6 sm:grid-cols-2">
        {performances.map((p) => (
          <li key={p.id}>
            <Link
              href={`/show/${p.slug}`}
              className="group block overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
            >
              <div className="relative aspect-[3/4] w-full bg-zinc-100 dark:bg-zinc-800">
                {p.poster_url ? (
                  <Image
                    src={p.poster_url}
                    alt=""
                    fill
                    className="object-cover transition group-hover:opacity-95"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-400 dark:text-zinc-500">
                    포스터 없음
                  </div>
                )}
              </div>
              <div className="p-4">
                <h2 className="font-semibold text-zinc-900 group-hover:underline dark:text-zinc-100">
                  {p.title}
                </h2>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {p.period_start} ~ {p.period_end}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
