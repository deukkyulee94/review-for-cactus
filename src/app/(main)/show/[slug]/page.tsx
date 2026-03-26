import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ActorRow } from "@/types/database";

type Props = { params: Promise<{ slug: string }> };

/**
 * 공연 상세: slug 로 공연을 조회하고, 출연 배우 목록(이름·프로필)을 보여줍니다.
 * 배우 카드를 클릭하면 해당 배우에게 코멘트를 남기는 페이지로 이동합니다.
 */
export default async function ShowPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: performance, error: pErr } = await supabase
    .from("performances")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (pErr || !performance) {
    notFound();
  }

  const { data: actors, error: aErr } = await supabase
    .from("actors")
    .select("*")
    .eq("performance_id", performance.id)
    .order("sort_order", { ascending: true });

  if (aErr) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        배우 정보를 불러오지 못했습니다: {aErr.message}
      </p>
    );
  }

  const headlineText =
    typeof performance.headline === "string"
      ? performance.headline.trim()
      : "";
  const hasHeadline = headlineText.length > 0;

  return (
    <article>
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:flex-wrap">
        <div className="relative mx-auto w-48 shrink-0 overflow-hidden rounded-lg bg-zinc-100 shadow dark:bg-zinc-800 sm:mx-0 sm:w-56">
          <div className="relative aspect-[2/3] w-full">
            {performance.poster_url ? (
              <Image
                src={performance.poster_url}
                alt=""
                fill
                className="object-cover"
                sizes="224px"
                priority
              />
            ) : null}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            {performance.title}
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {performance.period_start} ~ {performance.period_end}
          </p>
          {hasHeadline ? (
            <p className="mt-3 text-3xl font-semibold leading-snug text-zinc-800 dark:text-zinc-200 sm:hidden">
              {headlineText}
            </p>
          ) : null}
          {performance.description ? (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {performance.description}
            </p>
          ) : null}
        </div>
        {hasHeadline ? (
          <div className="hidden w-full basis-full sm:block">
            <p className="text-3xl font-semibold leading-snug text-zinc-800 dark:text-zinc-200">
              {headlineText}
            </p>
          </div>
        ) : null}
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          출연 배우
        </h2>
        {!actors?.length ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            등록된 배우가 없습니다.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {actors.map((row) => {
              const actor = row as ActorRow;
              return (
              <li key={actor.id}>
                <Link
                  href={`/show/${slug}/actor/${actor.id}`}
                  className="block rounded-lg border border-zinc-200 bg-white p-3 text-center shadow-sm transition hover:border-zinc-300 hover:shadow dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
                >
                  <div className="relative mx-auto mb-2 h-24 w-24 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    {actor.profile_photo_url ? (
                      <Image
                        src={actor.profile_photo_url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-zinc-400 dark:text-zinc-500">
                        사진
                      </div>
                    )}
                  </div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {actor.name}
                  </p>
                  {actor.role_name ? (
                    <p className="mt-0.5 text-xs font-medium text-violet-700 dark:text-violet-300">
                      {actor.role_name}
                    </p>
                  ) : null}
                  {actor.one_liner ? (
                    <p className="mt-1 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                      {actor.one_liner}
                    </p>
                  ) : null}
                </Link>
              </li>
            );
            })}
          </ul>
        )}
      </section>
    </article>
  );
}
