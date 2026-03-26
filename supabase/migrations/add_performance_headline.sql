-- =============================================================================
-- 기존 프로젝트용: performances 테이블에 헤드라인(headline) 컬럼 추가
-- =============================================================================
-- Supabase SQL Editor 에서 이 스크립트만 실행하세요.
-- (새로 schema.sql 로 DB를 만들 때는 이 마이그레이션은 생략 가능)
-- =============================================================================

alter table public.performances
  add column if not exists headline text;

comment on column public.performances.headline is '공연 상세 페이지에 표시하는 짧은 강조 문구(제목·일자와 소개 사이 등)';
