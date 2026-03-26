import Link from "next/link";

/** slug 에 해당하는 공연이 없을 때 표시합니다. */
export default function ShowNotFound() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        공연을 찾을 수 없습니다
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        URL 이 잘못되었거나 삭제된 공연일 수 있습니다.
      </p>
      <Link
        href="/"
        className="mt-4 inline-block text-sm text-zinc-800 underline dark:text-zinc-200"
      >
        홈으로
      </Link>
    </div>
  );
}
