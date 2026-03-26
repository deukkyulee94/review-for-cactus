import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-session";

/** 세션 쿠키 삭제 후 로그인 페이지로 보냅니다. */
export async function POST(req: NextRequest) {
  const login = new URL("/admin/login", req.url);
  const res = NextResponse.redirect(login, 303);
  res.cookies.set(ADMIN_SESSION_COOKIE, "", {
    path: "/",
    maxAge: 0,
  });
  return res;
}
