"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { updatePerformanceWithActors } from "@/app/actions/admin";
import type { PerformanceRow } from "@/types/database";

type ActorEditSeed = {
  id: string;
  name: string;
  role_name: string | null;
  one_liner: string | null;
  profile_photo_url: string | null;
};

type ActorField = { key: number; dbId: string | null };

type Props = {
  performance: PerformanceRow;
  actors: ActorEditSeed[];
};

/**
 * 공연 수정 폼: 기존 배우는 `actor_db_id_*` 로 구분하고, 새 행은 사진 필수입니다.
 */
export function EditShowForm({ performance, actors: initialActors }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const initialRows: ActorField[] = initialActors.map((a, i) => ({
    key: i,
    dbId: a.id,
  }));
  const [actorRows, setActorRows] = useState<ActorField[]>(
    initialRows.length > 0 ? initialRows : [{ key: 0, dbId: null }],
  );
  const [nextKey, setNextKey] = useState(
    initialRows.length > 0 ? initialRows.length : 1,
  );

  const actorPreviewUrlsRef = useRef<Map<number, string>>(new Map());
  const [actorPhotoPreviewSrc, setActorPhotoPreviewSrc] = useState<
    Record<number, string>
  >({});

  useEffect(
    () => () => {
      actorPreviewUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      actorPreviewUrlsRef.current.clear();
    },
    [],
  );

  function updateActorPhotoPreview(rowKey: number, file: File | null) {
    const prev = actorPreviewUrlsRef.current.get(rowKey);
    if (prev) {
      URL.revokeObjectURL(prev);
      actorPreviewUrlsRef.current.delete(rowKey);
    }
    if (file && file.size > 0) {
      const url = URL.createObjectURL(file);
      actorPreviewUrlsRef.current.set(rowKey, url);
      setActorPhotoPreviewSrc((s) => ({ ...s, [rowKey]: url }));
    } else {
      setActorPhotoPreviewSrc((s) => {
        if (!(rowKey in s)) return s;
        const next = { ...s };
        delete next[rowKey];
        return next;
      });
    }
  }

  function addRow() {
    setActorRows((rows) => [...rows, { key: nextKey, dbId: null }]);
    setNextKey((k) => k + 1);
  }

  function removeRow(key: number) {
    updateActorPhotoPreview(key, null);
    setActorRows((rows) =>
      rows.length <= 1 ? rows : rows.filter((r) => r.key !== key),
    );
  }

  return (
    <form
      className="mx-auto flex max-w-2xl flex-col gap-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        const form = e.currentTarget;
        const fd = new FormData(form);
        startTransition(async () => {
          const result = await updatePerformanceWithActors(fd);
          if (result.ok) {
            router.push("/admin/shows");
            router.refresh();
          } else {
            setMessage(result.message);
          }
        });
      }}
    >
      <input type="hidden" name="performance_id" value={performance.id} />

      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        공연 수정
      </h1>

      {message ? (
        <p
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
        >
          {message}
        </p>
      ) : null}

      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">공연 기본 정보</legend>
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          URL 슬러그
          <input
            name="slug"
            required
            defaultValue={performance.slug}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </label>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          주소가 바뀌면 기존 링크는 더 이상 동작하지 않습니다.
        </p>
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          공연 제목
          <input
            name="title"
            required
            defaultValue={performance.title}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </label>
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          공연 기간 시작
          <input
            name="period_start"
            type="date"
            required
            defaultValue={performance.period_start.slice(0, 10)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </label>
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          공연 기간 종료
          <input
            name="period_end"
            type="date"
            required
            defaultValue={performance.period_end.slice(0, 10)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </label>
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          헤드라인
          <input
            name="headline"
            defaultValue={performance.headline ?? ""}
            placeholder="예: 고생한 배우들에게 코멘트를 남겨주세요❤️"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </label>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          공연 페이지에서 제목·일자와 소개 사이(모바일), 또는 소개 아래·출연 배우 위(데스크톱)에 표시됩니다. 비워 두면 표시하지 않습니다.
        </p>
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          공연 설명
          <textarea
            name="description"
            rows={4}
            defaultValue={performance.description ?? ""}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </label>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            포스터 이미지
          </span>
          {performance.poster_url ? (
            <div className="relative h-40 w-28 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
              <Image
                src={performance.poster_url}
                alt=""
                fill
                className="object-cover"
                sizes="112px"
              />
            </div>
          ) : null}
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            바꾸지 않으려면 파일을 비워 두세요.
          </p>
          <input
            name="poster"
            type="file"
            accept="image/*"
            className="text-sm text-zinc-600 dark:text-zinc-400"
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          배우
        </legend>
        {actorRows.map((row, idx) => {
          const seed = row.dbId
            ? initialActors.find((a) => a.id === row.dbId)
            : undefined;
          return (
            <div
              key={row.key}
              className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  배우 {idx + 1}
                  {row.dbId ? " (등록됨)" : " (신규)"}
                </span>
                {actorRows.length > 1 ? (
                  <button
                    type="button"
                    className="text-xs text-red-600 hover:underline dark:text-red-400"
                    onClick={() => removeRow(row.key)}
                  >
                    행 삭제
                  </button>
                ) : null}
              </div>
              {row.dbId ? (
                <input type="hidden" name={`actor_db_id_${row.key}`} value={row.dbId} />
              ) : null}
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                이름
                <input
                  name={`actor_name_${row.key}`}
                  required
                  defaultValue={seed?.name ?? ""}
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </label>
              <label className="mt-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                맡은 배역
                <input
                  name={`actor_role_${row.key}`}
                  defaultValue={seed?.role_name ?? ""}
                  placeholder="예: 햄릿, 엘리자 역"
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </label>
              <label className="mt-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                배우 한마디
                <input
                  name={`actor_oneliner_${row.key}`}
                  defaultValue={seed?.one_liner ?? ""}
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </label>
              <div className="mt-2">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  프로필 사진
                </span>
                {actorPhotoPreviewSrc[row.key] ? (
                  <div className="mt-1">
                    <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-emerald-500/70 bg-zinc-100 dark:bg-zinc-800">
                      <Image
                        src={actorPhotoPreviewSrc[row.key]}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>
                    <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                      저장 전 미리보기
                    </p>
                  </div>
                ) : null}
                {!actorPhotoPreviewSrc[row.key] &&
                seed?.profile_photo_url ? (
                  <div className="relative mt-1 h-24 w-24 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
                    <Image
                      src={seed.profile_photo_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                ) : null}
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {row.dbId
                    ? "바꾸지 않으려면 파일을 비워 두세요."
                    : "신규 배우는 사진이 필요합니다."}
                </p>
                <input
                  name={`actor_photo_${row.key}`}
                  type="file"
                  accept="image/*"
                  required={!row.dbId}
                  className="mt-1 w-full text-sm text-zinc-600 dark:text-zinc-400"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    updateActorPhotoPreview(row.key, file);
                  }}
                />
              </div>
            </div>
          );
        })}
        <button
          type="button"
          onClick={addRow}
          className="self-start rounded-md border border-dashed border-zinc-400 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-500 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          + 배우 추가
        </button>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending ? "저장 중…" : "변경 저장"}
      </button>
    </form>
  );
}
