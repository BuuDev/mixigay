"use server";

import { redirect } from "next/navigation";
import { serverClient } from "@/server/supabase/server";
import { changeOwnPassphrase, redeemInvite, registerFan, signInAfterSignup, signInFan, type AuthResult } from "./server/accounts";

export type AuthFormState = AuthResult | null;

const field = (fd: FormData, key: string) => String(fd.get(key) ?? "");

export async function signIn(_prev: AuthFormState, fd: FormData): Promise<AuthFormState> {
  return signInFan({ handle: field(fd, "handle"), passphrase: field(fd, "passphrase") });
}

/** Called by the dialog's "Tôi đã lưu" button once the fan has saved the passphrase. */
export async function finishSignup(handle: string, passphrase: string): Promise<AuthResult> {
  return signInAfterSignup({ handle, passphrase });
}

export async function register(_prev: AuthFormState, fd: FormData): Promise<AuthFormState> {
  return registerFan({
    handle: field(fd, "handle"),
    displayName: field(fd, "displayName"),
    passphrase: field(fd, "passphrase"),
    turnstile: fd.get("cf-turnstile-response") ? field(fd, "cf-turnstile-response") : null,
  });
}

export async function acceptInvite(token: string, _prev: AuthFormState, fd: FormData): Promise<AuthFormState> {
  if (field(fd, "passphrase") !== field(fd, "confirm")) return { ok: false, message: "Hai lần nhập mã khóa chưa khớp." };
  const res = await redeemInvite({ token, passphrase: field(fd, "passphrase") });
  if (res.ok) redirect("/admin");
  return res;
}

/** Needs the current passphrase (a stolen session alone cannot lock the owner out). */
export async function changePassphrase(_prev: AuthFormState, fd: FormData): Promise<AuthFormState> {
  if (field(fd, "passphrase") !== field(fd, "confirm")) return { ok: false, message: "Hai lần nhập mã khóa chưa khớp." };
  return changeOwnPassphrase({ current: field(fd, "current"), next: field(fd, "passphrase") });
}

export async function signOut() {
  const supabase = await serverClient();
  await supabase.auth.signOut();
  redirect("/");
}
