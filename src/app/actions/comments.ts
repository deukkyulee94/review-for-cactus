"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CommentFormState } from "@/types/comment-form";

/**
 * 관객이 배우에게 코멘트를 남깁니다. anon Supabase 클라이언트로 insert 하며,
 * RLS 정책(comments_insert_public)이 actor-performance 관계를 검증합니다.
 *
 * 폼은 `<form action={formAction}>` 로만 호출합니다 (GET 네비게이션·하이드레이션 전 제출 방지).
 */
export async function addComment(
  _prev: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const performance_id = String(formData.get("performance_id") ?? "");
  const actor_id = String(formData.get("actor_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!performance_id || !actor_id || !slug || !body) {
    return { status: "error", message: "메시지를 입력하세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({
    performance_id,
    actor_id,
    body,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath(`/show/${slug}`);
  revalidatePath(`/show/${slug}/actor/${actor_id}`);
  return { status: "success", message: "등록되었습니다." };
}
