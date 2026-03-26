/** 코멘트 폼 `useActionState` + Server Action `addComment` 가 공유하는 상태 */
export type CommentFormState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const commentFormInitialState: CommentFormState = {
  status: "idle",
  message: null,
};
