import { cookies } from "next/headers";
import { sha256Hex } from "@/lib/sha256-hex";

/** 어드민 세션 쿠키 이름 (API Route·레이아웃에서 공통 사용) */
export const ADMIN_SESSION_COOKIE = "theater_admin_session";

/**
 * 쿠키에 저장할 값(ADMIN_SECRET 기반 해시). .env 줄바꿈·앞뒤 공백은 제거합니다.
 * 로그인 응답과 검증 시 동일한 함수를 씁니다.
 */
export async function computeAdminSessionCookieValue(): Promise<string> {
  const secret = (process.env.ADMIN_SECRET ?? "").trim();
  return sha256Hex(`theater-admin|${secret}`);
}

/** NextResponse.cookies.set 에 넘길 공통 옵션 */
export function adminSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** 어드민 로그인 여부: 쿠키 값이 기대 해시와 일치하는지 확인합니다. */
export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const raw = store.get(ADMIN_SESSION_COOKIE)?.value;
  if (!raw) return false;
  const expected = await computeAdminSessionCookieValue();
  return timingSafeEqualHex(raw, expected);
}
