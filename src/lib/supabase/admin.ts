import { createClient } from "@supabase/supabase-js";

/**
 * Service Role 키로 Supabase 클라이언트를 만듭니다.
 * - RLS를 우회하므로 **서버에서만** 호출해야 합니다. (브라우저에 키를 노출하면 안 됩니다.)
 * - 공연·배우 등록, Storage 업로드 등 어드민 전용 작업에 사용합니다.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 가 설정되지 않았습니다.",
    );
  }
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
