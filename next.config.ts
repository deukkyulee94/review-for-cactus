import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Next.js 16: Server Action 본문 한도(기본 1MB). 포스터+배우 사진 합이 넘으면 413/HTML 응답으로
    // "An unexpected response was received from the server" 가 납니다.
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  // Supabase Storage 공개 URL 이미지를 next/image 로 최적화하려면 호스트를 허용합니다.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
