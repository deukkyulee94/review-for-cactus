import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CommentForm } from "@/components/public/CommentForm";
import type { ActorRow } from "@/types/database";

type Props = { params: Promise<{ slug: string; actorId: string }> };

/**
 * 배우 코멘트 페이지: 배우 정보, 다른 관객 코멘트 목록, 새 코멘트 작성 폼을 표시합니다.
 */
export default async function ActorCommentPage({ params }: Props) {
  const { slug, actorId } = await params;
  const supabase = await createClient();

  const { data: performance, error: pErr } = await supabase
    .from("performances")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (pErr || !performance) {
    notFound();
  }

  const { data: actor, error: aErr } = await supabase
    .from("actors")
    .select("*")
    .eq("id", actorId)
    .eq("performance_id", performance.id)
    .maybeSingle();

  if (aErr || !actor) {
    notFound();
  }

  const a = actor as ActorRow;

  const { data: comments, error: cErr } = await supabase
    .from("comments")
    .select("*")
    .eq("actor_id", a.id)
    .eq("performance_id", performance.id)
    .order("created_at", { ascending: false });

  if (cErr) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        코멘트를 불러오지 못했습니다: {cErr.message}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <nav className="text-sm text-zinc-500 dark:text-zinc-400">
        <Link
          href="/"
          className="hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          홈
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/show/${slug}`}
          className="hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          {performance.title}
        </Link>
      </nav>

      <header className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          {a.profile_photo_url ? (
            <Image
              src={a.profile_photo_url}
              alt=""
              fill
              className="object-cover"
              sizes="128px"
            />
          ) : null}
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {a.name}
          </h1>
          {a.role_name ? (
            <p className="mt-1 text-sm font-medium text-violet-800 dark:text-violet-300">
              배역 · {a.role_name}
            </p>
          ) : null}
          {a.one_liner ? (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {a.one_liner}
            </p>
          ) : null}
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {performance.title}
          </p>
        </div>
      </header>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          이 공연에서 남긴 코멘트
        </h2>
        {!comments?.length ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            아직 코멘트가 없습니다.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {comments.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <time
                  className="block text-xs text-zinc-400 dark:text-zinc-500"
                  dateTime={c.created_at}
                >
                  {new Date(c.created_at).toLocaleString("ko-KR", {
                    timeZone: "Asia/Seoul",
                  })}
                </time>
                <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                  {c.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          코멘트 남기기
        </h2>
        <CommentForm
          performanceId={performance.id}
          actorId={a.id}
          slug={slug}
        />
      </section>
    </div>
  );
}
