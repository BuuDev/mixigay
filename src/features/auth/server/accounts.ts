import "server-only";
import { createHmac, randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { adminClient } from "@/server/supabase/admin";
import { serverClient } from "@/server/supabase/server";
import { handleProblem, passphraseProblem } from "../lib/handle";
import { ipv6Prefix64 } from "../lib/network";

// Private accounts (ADR-013): "tên Bộ Tộc" + passphrase, no email/phone/Google.
// Public sign-up is disabled in Supabase, so auth users exist only if this module
// created them. It uses the service role (documented exception, docs/07-conventions.md):
// to create users, to map a handle to its synthetic auth address, and to count attempts.

export type AuthResult = { ok: true } | { ok: false; message: string };

const SIGNUP_PER_IP = { limit: 3, window: "1 hour" };
const SIGNUP_SITE_WIDE = { limit: 60, window: "1 hour" };
// Sign-in limits count FAILED attempts only, so a stranger guessing on purpose cannot
// keep someone else locked out: per handle+network is tight, per handle alone is loose.
const LOGIN_FAILS_HANDLE_IP = { limit: 5, window: "10 minutes" };
const LOGIN_FAILS_HANDLE = { limit: 50, window: "1 hour" };
const LOGIN_FAILS_IP = { limit: 30, window: "10 minutes" };
const INVITE_PER_IP = { limit: 10, window: "1 hour" };

const WRONG = "Sai tên hoặc mã khóa.";
const BUSY = "Thử quá nhiều lần, đợi một lát rồi thử lại nhé.";

/** The caller's network, hashed (raw IPs are never stored). IPv6 is keyed on its /64:
 * one subscriber gets a whole /64, so per-address limits would be meaningless. */
async function clientKey(): Promise<string> {
  const h = await headers();
  const raw = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const ip = raw.includes(":") ? ipv6Prefix64(raw) : raw;
  const salt = process.env.AUTH_HASH_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || "dev";
  return createHmac("sha256", salt).update(ip).digest("hex").slice(0, 32);
}

async function exceeded(kind: string, key: string, rule: { limit: number; window: string }): Promise<boolean> {
  const { data, error } = await adminClient().rpc("auth_attempts_exceeded", { p_kind: kind, p_key: key, p_limit: rule.limit, p_window: rule.window });
  if (error) throw new Error(`auth_attempts_exceeded: ${error.message}`);
  return data === true;
}

async function noteFailure(kind: string, key: string) {
  await adminClient().rpc("note_auth_failure", { p_kind: kind, p_key: key });
}

async function take(kind: string, key: string, rule: { limit: number; window: string }): Promise<boolean> {
  const { data, error } = await adminClient().rpc("take_auth_attempt", { p_kind: kind, p_key: key, p_limit: rule.limit, p_window: rule.window });
  if (error) throw new Error(`take_auth_attempt: ${error.message}`);
  return data === true;
}

async function nameKey(handle: string): Promise<string> {
  const { data, error } = await adminClient().rpc("name_key", { t: handle });
  if (error) throw new Error(`name_key: ${error.message}`);
  return String(data ?? "");
}

/** Cloudflare Turnstile, when TURNSTILE_SECRET_KEY is set; otherwise only the rate limits apply. */
async function humanCheck(token: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret, response: token }),
  });
  const body = (await res.json().catch(() => ({}))) as { success?: boolean };
  return body.success === true;
}

/** "ok" | "wrong" | "busy" (Supabase's own rate limit, which sees our server's IP). */
async function signInWithAddress(email: string, passphrase: string): Promise<"ok" | "wrong" | "busy"> {
  const { error } = await (await serverClient()).auth.signInWithPassword({ email, password: passphrase });
  if (!error) return "ok";
  return error.status === 429 ? "busy" : "wrong";
}

/** Creates the auth user, its login handle and (for invites) its role, then signs in. */
async function createAccount(key: string, displayName: string, passphrase: string, inviteToken?: string): Promise<AuthResult> {
  const admin = adminClient();
  const { data: taken } = await admin.from("account_logins").select("handle_key").eq("handle_key", key).maybeSingle();
  if (taken) return { ok: false, message: "Tên này đã có người dùng, chọn tên khác nhé." };

  const email = `u-${randomUUID()}@id.gocbotoc.invalid`;
  const { data, error } = await admin.auth.admin.createUser({ email, password: passphrase, email_confirm: true, user_metadata: { full_name: displayName } });
  if (error || !data.user) {
    console.error("createAccount", error);
    return { ok: false, message: "Có lỗi, thử lại sau." };
  }
  const userId = data.user.id;
  const undo = () => admin.auth.admin.deleteUser(userId);

  const { error: loginError } = await admin.from("account_logins").insert({ handle_key: key, user_id: userId, auth_email: email });
  if (loginError) {
    await undo();
    return loginError.code === "23505"
      ? { ok: false, message: "Tên này đã có người dùng, chọn tên khác nhé." }
      : { ok: false, message: "Có lỗi, thử lại sau." };
  }
  if (inviteToken) {
    const { error: inviteError } = await admin.rpc("consume_invite", { p_token: inviteToken, p_user: userId });
    if (inviteError) {
      await undo();
      return { ok: false, message: "Link mời đã dùng hoặc hết hạn. Nhờ admin tạo link mới." };
    }
  }
  if ((await signInWithAddress(email, passphrase)) !== "ok") return { ok: false, message: "Đã tạo tài khoản, nhưng đăng nhập lỗi. Thử đăng nhập lại nhé." };
  return { ok: true };
}

export async function registerFan(input: { handle: string; displayName: string; passphrase: string; turnstile: string | null }): Promise<AuthResult> {
  const problem = handleProblem(input.handle) ?? passphraseProblem(input.passphrase, { handle: input.handle });
  if (problem) return { ok: false, message: problem };
  if (!(await humanCheck(input.turnstile))) return { ok: false, message: "Xác minh chống bot chưa xong, thử lại nhé." };
  const ip = await clientKey();
  if (!(await take("signup_ip", ip, SIGNUP_PER_IP)) || !(await take("signup_all", "site", SIGNUP_SITE_WIDE))) {
    return { ok: false, message: "Đang có quá nhiều tài khoản mới, thử lại sau ít phút nhé." };
  }
  const key = await nameKey(input.handle);
  const { data: reserved } = await adminClient().rpc("is_reserved_name", { t: input.handle });
  if (reserved === true) return { ok: false, message: "Tên này dành cho tài khoản chính chủ, chọn tên khác nhé." };
  // A handle promised to an open invite cannot be taken first by someone who learned it.
  const { data: promised } = await adminClient()
    .from("invites")
    .select("id")
    .eq("handle_key", key)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .limit(1);
  if (promised?.length) return { ok: false, message: "Tên này đã có người dùng, chọn tên khác nhé." };
  const displayName = input.displayName.trim() || input.handle.trim();
  return createAccount(key, displayName.slice(0, 50), input.passphrase);
}

export async function signInFan(input: { handle: string; passphrase: string }): Promise<AuthResult> {
  if (!input.handle.trim() || !input.passphrase) return { ok: false, message: WRONG };
  const key = await nameKey(input.handle);
  const net = await clientKey();
  if (
    (await exceeded("login_ip", net, LOGIN_FAILS_IP)) ||
    (await exceeded("login_handle_ip", `${key}|${net}`, LOGIN_FAILS_HANDLE_IP)) ||
    (await exceeded("login_handle", key, LOGIN_FAILS_HANDLE))
  ) {
    return { ok: false, message: BUSY };
  }
  const { data } = await adminClient().from("account_logins").select("auth_email").eq("handle_key", key).maybeSingle();
  const result = data ? await signInWithAddress(data.auth_email as string, input.passphrase) : "wrong";
  if (result === "ok") return { ok: true };
  if (result === "busy") return { ok: false, message: BUSY };
  await Promise.all([noteFailure("login_ip", net), noteFailure("login_handle_ip", `${key}|${net}`), noteFailure("login_handle", key)]);
  // Same message whether the handle exists or not: no account enumeration.
  return { ok: false, message: WRONG };
}

export interface InvitePreview {
  role: "owner" | "admin" | "official";
  handleKey: string;
  displayName: string;
  expiresAt: string;
}

export async function previewInvite(token: string): Promise<InvitePreview | null> {
  if (!/^[0-9a-f]{64}$/.test(token)) return null;
  const { data } = await adminClient().rpc("peek_invite", { p_token: token });
  const row = (data as { role: InvitePreview["role"]; handle_key: string; display_name: string; expires_at: string }[] | null)?.[0];
  return row ? { role: row.role, handleKey: row.handle_key, displayName: row.display_name, expiresAt: row.expires_at } : null;
}

export async function redeemInvite(input: { token: string; passphrase: string }): Promise<AuthResult> {
  if (!(await take("invite_ip", await clientKey(), INVITE_PER_IP))) return { ok: false, message: BUSY };
  const invite = await previewInvite(input.token);
  if (!invite) return { ok: false, message: "Link mời đã dùng hoặc hết hạn. Nhờ admin tạo link mới." };
  // Admin / official accounts can moderate (or issue invites): stronger passphrases.
  const problem = passphraseProblem(input.passphrase, { handle: invite.handleKey, privileged: true });
  if (problem) return { ok: false, message: problem };
  return createAccount(invite.handleKey, invite.displayName, input.passphrase, input.token);
}

/** Changing a passphrase needs the current one: a stolen session alone must not lock the owner out. */
export async function changeOwnPassphrase(input: { current: string; next: string }): Promise<AuthResult> {
  const supabase = await serverClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, message: "Bạn chưa đăng nhập." };
  const { data: login } = await adminClient().from("account_logins").select("auth_email, handle_key").eq("user_id", auth.user.id).maybeSingle();
  if (!login) return { ok: false, message: "Có lỗi, thử lại sau." };
  const { data: admin } = await adminClient().from("admins").select("user_id").eq("user_id", auth.user.id).maybeSingle();
  const problem = passphraseProblem(input.next, { handle: login.handle_key as string, privileged: Boolean(admin) });
  if (problem) return { ok: false, message: problem };
  const net = await clientKey();
  if (await exceeded("login_handle_ip", `${login.handle_key}|${net}`, LOGIN_FAILS_HANDLE_IP)) return { ok: false, message: BUSY };
  const check = await signInWithAddress(login.auth_email as string, input.current);
  if (check !== "ok") {
    if (check === "wrong") await noteFailure("login_handle_ip", `${login.handle_key}|${net}`);
    return { ok: false, message: check === "busy" ? BUSY : "Mã khóa hiện tại chưa đúng." };
  }
  const { error } = await supabase.auth.updateUser({ password: input.next });
  return error ? { ok: false, message: "Chưa đổi được mã khóa, thử lại sau." } : { ok: true };
}
