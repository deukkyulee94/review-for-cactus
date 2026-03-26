import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  computeAdminSessionCookieValue,
} from "@/lib/admin-session";

/**
 * 브라우저가 폼을 POST 하면, 여기서 비밀번호를 검사하고
 * Redirect 응답과 함께 Set-Cookie 를 붙입니다.
 * (Server Action 의 cookies().set() 은 환경에 따라 응답에 안 실리는 경우가 있어 이 방식을 씁니다.)
 */
export async function POST(req: NextRequest) {
  const configured = (process.env.ADMIN_SECRET ?? "").trim();
  const formData = await req.formData();
  const secret = String(formData.get("secret") ?? "").trim();

  const loginUrl = new URL("/admin/login", req.url);

  if (!configured) {
    loginUrl.searchParams.set("e", "config");
    return NextResponse.redirect(loginUrl, 303);
  }

  if (secret !== configured) {
    loginUrl.searchParams.set("e", "auth");
    return NextResponse.redirect(loginUrl, 303);
  }

  const token = await computeAdminSessionCookieValue();
  const ok = new URL("/admin/shows", req.url);
  // NextResponse.redirect 기본값은 307(메서드 유지)이라 폼 POST가 /admin/shows 로 다시 POST 되어
  // 페이지 네비게이션이 깨지고 세션 검증이 실패하는 경우가 있습니다. PRG 패턴으로 303(GET)을 씁니다.
  const res = NextResponse.redirect(ok, 303);
  res.cookies.set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions());
  return res;
}
