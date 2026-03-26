/**
 * 앱에서 사용하는 공연·배우·코멘트 레코드의 TypeScript 형태입니다.
 * (Supabase가 생성하는 Database 제네릭 대신, 입문용으로 단순 타입을 둡니다.)
 */

/** DB `performances` 한 행 */
export type PerformanceRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  period_start: string;
  period_end: string;
  created_at: string;
};

/** DB `actors` 한 행 */
export type ActorRow = {
  id: string;
  performance_id: string;
  name: string;
  /** 맡은 배역(캐릭터명 등) */
  role_name: string | null;
  profile_photo_url: string | null;
  one_liner: string | null;
  sort_order: number;
  created_at: string;
};

/** DB `comments` 한 행 */
export type CommentRow = {
  id: string;
  performance_id: string;
  actor_id: string;
  body: string;
  created_at: string;
};
