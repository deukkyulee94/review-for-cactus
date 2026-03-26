-- =============================================================================
-- 코멘트가 DB에 저장되지 않는 문제 수정
-- 1) anon/authenticated 에 comments INSERT (및 필요한 SELECT) 권한
-- 2) RLS INSERT 정책: 서브쿼리에서 comments 행의 performance_id 를 명시적으로 참조
-- =============================================================================
-- Supabase SQL Editor 에서 한 번 실행하세요.
-- =============================================================================

drop policy if exists "comments_insert_public" on public.comments;

create policy "comments_insert_public"
  on public.comments for insert
  with check (
    comments.performance_id in (
      select a.performance_id
      from public.actors a
      where a.id = comments.actor_id
    )
  );

grant usage on schema public to anon, authenticated;
grant select on public.performances to anon, authenticated;
grant select on public.actors to anon, authenticated;
grant select, insert on public.comments to anon, authenticated;
