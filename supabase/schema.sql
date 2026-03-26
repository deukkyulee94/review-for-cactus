-- =============================================================================
-- Supabase 데이터베이스·스토리지 초기 설정 (SQL Editor에 붙여넣어 한 번에 실행)
-- =============================================================================
-- 이 스크립트는 다음을 수행합니다.
-- 1) 공연(performances), 배우(actors), 코멘트(comments) 테이블 생성
-- 2) Row Level Security(RLS) 정책: 누구나 읽기, 코멘트만 익명 작성 가능
-- 3) Storage 버킷(posters, actor-photos) 생성 및 공개 읽기 정책
--
-- 어드민에서의 공연/배우 등록·이미지 업로드는 서버에서 Service Role 키로 수행하므로
-- RLS를 우회합니다. (일반 방문자는 anon 키로 읽기/코멘트 작성만 가능)
-- =============================================================================

-- 확장: UUID 생성
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 테이블: performances (공연)
-- -----------------------------------------------------------------------------
create table if not exists public.performances (
  id uuid primary key default gen_random_uuid(),
  -- URL 경로에 쓰는 고유 문자열 (예: /show/hamlet-2025)
  slug text not null unique,
  title text not null,
  headline text,
  description text,
  poster_url text,
  period_start date not null,
  period_end date not null,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 테이블: actors (배우 — 공연에 종속)
-- -----------------------------------------------------------------------------
create table if not exists public.actors (
  id uuid primary key default gen_random_uuid(),
  performance_id uuid not null references public.performances (id) on delete cascade,
  name text not null,
  -- 공연에서 맡은 배역(캐릭터명 등), 선택 입력
  role_name text,
  profile_photo_url text,
  one_liner text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists actors_performance_id_idx on public.actors (performance_id);

-- -----------------------------------------------------------------------------
-- 테이블: comments (배우에게 남긴 코멘트 — 공연·배우와 연결)
-- -----------------------------------------------------------------------------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  performance_id uuid not null references public.performances (id) on delete cascade,
  actor_id uuid not null references public.actors (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_actor_id_idx on public.comments (actor_id);
create index if not exists comments_performance_id_idx on public.comments (performance_id);

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.performances enable row level security;
alter table public.actors enable row level security;
alter table public.comments enable row level security;

-- 기존 정책이 있으면 제거 후 재생성 (스크립트 재실행 대비)
drop policy if exists "performances_select_public" on public.performances;
drop policy if exists "actors_select_public" on public.actors;
drop policy if exists "comments_select_public" on public.comments;
drop policy if exists "comments_insert_public" on public.comments;

-- 누구나 공연·배우·코멘트 목록을 조회 가능 (anon + authenticated)
create policy "performances_select_public"
  on public.performances for select
  using (true);

create policy "actors_select_public"
  on public.actors for select
  using (true);

create policy "comments_select_public"
  on public.comments for select
  using (true);

-- 코멘트 작성: actor가 해당 performance에 속할 때만 허용
-- (EXISTS + FROM actors 일 때 performance_id 가 내부 테이블로만 해석되는 것을 피하려고
--  삽입 행(comments.*)은 바깥에 두고 performance 일치는 IN 으로 검사)
create policy "comments_insert_public"
  on public.comments for insert
  with check (
    comments.performance_id in (
      select a.performance_id
      from public.actors a
      where a.id = comments.actor_id
    )
  );

-- API(anon / authenticated 역할)가 RLS 정책을 통과한 읽기·코멘트 삽입을 할 수 있도록 권한 부여
grant usage on schema public to anon, authenticated;
grant select on public.performances to anon, authenticated;
grant select on public.actors to anon, authenticated;
grant select, insert on public.comments to anon, authenticated;

-- performances / actors 의 insert·update·delete 는 정책을 두지 않음 → anon 은 불가
-- Service Role(서버 전용 키)로만 어드민 작업 수행

-- -----------------------------------------------------------------------------
-- Storage: 포스터·배우 사진 버킷 (공개 읽기)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('posters', 'posters', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('actor-photos', 'actor-photos', true)
on conflict (id) do nothing;

drop policy if exists "posters_public_read" on storage.objects;
drop policy if exists "actor_photos_public_read" on storage.objects;

create policy "posters_public_read"
  on storage.objects for select
  using (bucket_id = 'posters');

create policy "actor_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'actor-photos');

-- 업로드 정책은 두지 않음 → 브라우저에서 직접 업로드 불가, 서버(Service Role)만 업로드
