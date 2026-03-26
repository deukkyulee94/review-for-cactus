import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 서버 컴포넌트·Server Action·Route Handler에서 anon 키로 Supabase에 접속합니다.
 * 쿠키 기반 세션을 쓰는 Supabase Auth와 연동할 때 사용하는 패턴입니다.
 * (이 프로젝트는 어드민을 별도 비밀번호로만 보호하고, Auth는 사용하지 않습니다.)
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component에서는 set이 제한될 수 있음 — Auth 사용 시 참고
          }
        },
      },
    },
  );
}
