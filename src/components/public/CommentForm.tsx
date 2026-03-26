"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { addComment } from "@/app/actions/comments";
import {
  commentFormInitialState,
  type CommentFormState,
} from "@/types/comment-form";

type Props = {
  performanceId: string;
  actorId: string;
  slug: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
    >
      {pending ? "전송 중…" : "코멘트 남기기"}
    </button>
  );
}

/**
 * 코멘트 작성 폼: Server Action을 form action으로 연결해, JS 없이/하이드레이션 전에도
 * GET 새로고침이 아니라 POST Server Action으로만 제출되게 합니다.
 */
export function CommentForm({ performanceId, actorId, slug }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState<CommentFormState, FormData>(
    addComment,
    commentFormInitialState,
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4"
    >
      <input type="hidden" name="performance_id" value={performanceId} />
      <input type="hidden" name="actor_id" value={actorId} />
      <input type="hidden" name="slug" value={slug} />
      <label className="text-sm font-medium text-zinc-700">
        메시지
        <textarea
          name="body"
          required
          rows={4}
          maxLength={2000}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
        />
      </label>
      {state.message ? (
        <p
          className={
            state.status === "success"
              ? "text-sm text-emerald-600"
              : "text-sm text-red-600"
          }
        >
          {state.message}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
