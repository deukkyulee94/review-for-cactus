import { SiteHeader } from "@/components/public/SiteHeader";

/**
 * 방문자 영역 레이아웃: 공연 목록·코멘트 페이지에 공통 헤더를 둡니다.
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}
