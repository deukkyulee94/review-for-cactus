"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createPerformanceWithActors } from "@/app/actions/admin";

type ActorField = { key: number };

/**
 * 공연 등록 폼: 배우 행을 동적으로 추가/삭제하고, 제출 시 Server Action으로 전송합니다.
 * - 각 배우마다 이름·맡은 배역·한마디·프로필 사진 파일을 받습니다.
 * - 포스터는 공연 단위로 하나만 업로드합니다.
 */
export function NewShowForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [actorRows, setActorRows] = useState<ActorField[]>([{ key: 0 }]);
  const [nextKey, setNextKey] = useState(1);

  function addRow() {
    setActorRows((rows) => [...rows, { key: nextKey }]);
    setNextKey((k) => k + 1);
  }

  function removeRow(key: number) {
    setActorRows((rows) => (rows.length <= 1 ? rows : rows.filter((r) => r.key !== key)));
  }

  return (
    <form
      className="mx-auto flex max-w-2xl flex-col gap-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        const form = e.currentTarget;
        const fd = new FormData(form);
        startTransition(async () => {
          const result = await createPerformanceWithActors(fd);
          if (result.ok) {
            router.push("/admin/shows");
            router.refresh();
          } else {
            setMessage(result.message);
          }
        });
      }}
    >
      <h1 className="text-xl font-semibold text-zinc-900">공연 등록</h1>

      {message ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {message}
        </p>
      ) : null}

      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">공연 기본 정보</legend>
        <label className="text-sm font-medium text-zinc-700">
          URL 슬러그
          <input
            name="slug"
            required
            placeholder="예: hamlet-2025"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
          />
        </label>
        <p className="text-xs text-zinc-500">
          공연 페이지 주소는 /show/슬러그 형태입니다. 영문·숫자·하이픈을 권장합니다.
        </p>
        <label className="text-sm font-medium text-zinc-700">
          공연 제목
          <input
            name="title"
            required
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
          />
        </label>
        <label className="text-sm font-medium text-zinc-700">
          공연 기간 시작
          <input
            name="period_start"
            type="date"
            required
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
          />
        </label>
        <label className="text-sm font-medium text-zinc-700">
          공연 기간 종료
          <input
            name="period_end"
            type="date"
            required
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
          />
        </label>
        <label className="text-sm font-medium text-zinc-700">
          공연 설명
          <textarea
            name="description"
            rows={4}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
          />
        </label>
        <label className="text-sm font-medium text-zinc-700">
          포스터 이미지
          <input
            name="poster"
            type="file"
            accept="image/*"
            required
            className="mt-1 w-full text-sm text-zinc-600"
          />
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="text-sm font-semibold text-zinc-800">배우</legend>
        {actorRows.map((row, idx) => (
          <div
            key={row.key}
            className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-700">
                배우 {idx + 1}
              </span>
              {actorRows.length > 1 ? (
                <button
                  type="button"
                  className="text-xs text-red-600 hover:underline"
                  onClick={() => removeRow(row.key)}
                >
                  행 삭제
                </button>
              ) : null}
            </div>
            <label className="block text-sm font-medium text-zinc-700">
              이름
              <input
                name={`actor_name_${row.key}`}
                required
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
              />
            </label>
            <label className="mt-2 block text-sm font-medium text-zinc-700">
              맡은 배역
              <input
                name={`actor_role_${row.key}`}
                placeholder="예: 햄릿, 엘리자 역"
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
              />
            </label>
            <label className="mt-2 block text-sm font-medium text-zinc-700">
              배우 한마디
              <input
                name={`actor_oneliner_${row.key}`}
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
              />
            </label>
            <label className="mt-2 block text-sm font-medium text-zinc-700">
              프로필 사진
              <input
                name={`actor_photo_${row.key}`}
                type="file"
                accept="image/*"
                required
                className="mt-1 w-full text-sm text-zinc-600"
              />
            </label>
          </div>
        ))}
        <button
          type="button"
          onClick={addRow}
          className="self-start rounded-md border border-dashed border-zinc-400 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100"
        >
          + 배우 추가
        </button>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {pending ? "저장 중…" : "등록하기"}
      </button>
    </form>
  );
}
