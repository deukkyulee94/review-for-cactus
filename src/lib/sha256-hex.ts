/**
 * Web Crypto API로 UTF-8 문자열의 SHA-256 해시를 16진 문자열로 반환합니다.
 * Edge 미들웨어와 Node 서버 액션 모두에서 동일하게 동작합니다.
 */
export async function sha256Hex(message: string): Promise<string> {
  const data = new TextEncoder().encode(message);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
