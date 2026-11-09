/**
 * A same-site path to continue to after sign-in, or "/". Rejects protocol-relative
 * ("//x"), backslash ("/\x") and control-character tricks that browsers resolve
 * to another host, so the auth callback cannot be used as an open redirect.
 */
export function safeNext(raw: string | null, origin = "http://localhost"): string {
  if (!raw || !/^\/(?![/\\])/.test(raw) || /[\x00-\x1f\\]/.test(raw)) return "/";
  const url = new URL(raw, origin);
  return url.origin === new URL(origin).origin ? url.pathname + url.search + url.hash : "/";
}
