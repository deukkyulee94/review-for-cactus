import Link from "next/link";

type Props = {
  searchParams: Promise<{ e?: string }>;
};

const errorText: Record<string, string> = {
  auth: "비밀번호가 올바르지 않습니다.",
  config:
    "서버에 ADMIN_SECRET 이 설정되지 않았습니다. .env.local 을 확인한 뒤 개발 서버를 다시 시작하세요.",
};

/**
 * 일반 HTML 폼 POST → /api/admin/login 으로 보냅니다.
 * 이렇게 하면 브라우저가 302 와 Set-Cookie 를 한 번에 처리해 로그인이 안정적으로 동작합니다.
 */
export default async function AdminLoginPage({ searchParams }: Props) {
  const { e } = await searchParams;
  const errMsg = e ? errorText[e] : null;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        어드민 로그인
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800 dark:text-zinc-200">
          .env.local
        </code>{" "}
        의{" "}
        <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800 dark:text-zinc-200">
          ADMIN_SECRET
        </code>{" "}
        과 동일한 값을 입력하세요. 값을 바꾼 뒤에는{" "}
        <strong className="text-zinc-800 dark:text-zinc-200">
          터미널에서 dev 서버를 껐다가 다시
        </strong>{" "}
        <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800 dark:text-zinc-200">
          npm run dev
        </code>{" "}
        해야 반영됩니다.
      </p>
      {errMsg ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {errMsg}
        </p>
      ) : null}
      <form
        action="/api/admin/login"
        method="post"
        className="flex flex-col gap-4"
      >
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          비밀번호
          <input
            name="secret"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          로그인
        </button>
      </form>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="underline hover:text-zinc-800 dark:hover:text-zinc-200">
          홈으로
        </Link>
      </p>
    </div>
  );
}
