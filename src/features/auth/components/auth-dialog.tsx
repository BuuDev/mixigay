"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/ui/cn";
import { finishSignup, register, signIn, type AuthFormState } from "../actions";
import { generatePassphrase, HANDLE_MAX, PASSPHRASE_MIN } from "../lib/handle";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const field = "w-full rounded-md border border-border bg-background px-3 py-2.5 text-base";

/**
 * "Vào Bộ Tộc": sign in or create an account with a tên Bộ Tộc + mã khóa — no email,
 * phone or Google (ADR-013). Native <dialog>: focus trap, Esc and backdrop for free.
 */
export function AuthDialog() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<"login" | "signup">("login");
  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => dialog.current?.showModal()}>
        Vào Bộ Tộc
      </Button>
      <dialog
        ref={dialog}
        aria-label="Vào Bộ Tộc"
        className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-xl border border-border bg-surface p-0 text-foreground shadow-card backdrop:bg-background/80 backdrop:backdrop-blur"
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      >
        <div className="p-5">
          <div className="flex items-center justify-between">
            <p className="font-script text-2xl font-semibold text-accent-glow">Vào Bộ Tộc</p>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="min-h-11 min-w-11 rounded-pill text-muted hover:text-foreground"
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>
          <div role="tablist" className="mt-2 grid grid-cols-2 gap-1 rounded-pill bg-background p-1 text-sm">
            {(["login", "signup"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={cn("min-h-10 rounded-pill font-semibold", tab === t ? "bg-accent text-background" : "text-muted hover:text-foreground")}
              >
                {t === "login" ? "Đăng nhập" : "Tạo tài khoản"}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">Không cần email, số điện thoại hay tài khoản Google. Chỉ cần tên Bộ Tộc và mã khóa.</p>
          {tab === "login" ? <LoginForm /> : <SignupForm />}
        </div>
      </dialog>
    </>
  );
}

function useDone(state: AuthFormState, onDone: () => void) {
  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);
}

function LoginForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(signIn, null);
  // React 19 resets uncontrolled form fields after every action: keep the name so a wrong
  // passphrase does not also wipe the login name.
  const [loginHandle, setLoginHandle] = useState("");
  useDone(state, () => router.refresh());
  return (
    <form action={action} className="mt-4 space-y-3">
      <label className="block text-sm">
        Tên Bộ Tộc
        <input
          name="handle"
          required
          autoComplete="username"
          className={cn(field, "mt-1")}
          value={loginHandle}
          onChange={(e) => setLoginHandle(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Mã khóa
        <input name="passphrase" type="password" required autoComplete="current-password" className={cn(field, "mt-1")} />
      </label>
      {state && !state.ok && (
        <p role="alert" className="text-sm text-live-text">
          {state.message}
        </p>
      )}
      <Button className="w-full" disabled={pending}>
        {pending ? "Đang vào…" : "Đăng nhập"}
      </Button>
    </form>
  );
}

function SignupForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(register, null);
  const [own, setOwn] = useState(false);
  const [passphrase, setPassphrase] = useState(() => generatePassphrase());
  const [saved, setSaved] = useState(false);
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [finishing, startFinishing] = useTransition();
  const [finishError, setFinishError] = useState<string>();

  if (state?.ok) {
    return (
      <div className="mt-4 space-y-3 text-sm">
        <p className="font-semibold">Chào mừng vào Bộ Tộc! Lưu mã khóa này lại:</p>
        <p className="rounded-md border border-accent/60 bg-background px-3 py-3 text-center font-mono text-lg font-bold break-all">{passphrase}</p>
        <p className="text-xs text-muted">
          Trang không có email của bạn nên <strong>không thể khôi phục</strong> mã khóa. Chụp màn hình hoặc lưu vào trình quản lý mật khẩu.
        </p>
        {finishError && (
          <p role="alert" className="text-sm text-live-text">
            {finishError}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="secondary" onClick={() => navigator.clipboard?.writeText(passphrase).then(() => setSaved(true))}>
            {saved ? "Đã chép ✓" : "Chép mã khóa"}
          </Button>
          <Button
            type="button"
            disabled={finishing}
            onClick={() =>
              startFinishing(async () => {
                const res = await finishSignup(handle, passphrase);
                if (res.ok) router.refresh();
                else setFinishError(res.message);
              })
            }
          >
            {finishing ? "Đang vào…" : "Tôi đã lưu"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="mt-4 space-y-3">
      {TURNSTILE_SITE_KEY && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />}
      <label className="block text-sm">
        Tên Bộ Tộc (dùng để đăng nhập)
        <input
          name="handle"
          required
          maxLength={HANDLE_MAX + 16}
          autoComplete="username"
          className={cn(field, "mt-1")}
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Tên hiển thị <span className="text-muted">(tùy chọn, có dấu thoải mái)</span>
        <input name="displayName" maxLength={50} className={cn(field, "mt-1")} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </label>
      <div className="text-sm">
        <div className="flex items-center justify-between">
          <span>Mã khóa</span>
          <button
            type="button"
            onClick={() => {
              setPassphrase(own ? generatePassphrase() : "");
              setOwn(!own);
            }}
            className="min-h-8 text-xs text-accent underline underline-offset-2"
          >
            {own ? "Dùng mã tự sinh" : "Tự đặt mã khóa"}
          </button>
        </div>
        {own ? (
          <input
            name="passphrase"
            type="password"
            required
            minLength={PASSPHRASE_MIN}
            autoComplete="new-password"
            className={cn(field, "mt-1")}
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
          />
        ) : (
          <div className="mt-1 flex gap-2">
            <input name="passphrase" readOnly value={passphrase} className={cn(field, "font-mono")} aria-label="Mã khóa tự sinh" />
            <button
              type="button"
              onClick={() => setPassphrase(generatePassphrase())}
              className="min-h-11 shrink-0 rounded-md border border-border px-3 text-xs hover:border-accent"
            >
              Đổi
            </button>
          </div>
        )}
      </div>
      {TURNSTILE_SITE_KEY && <div className="cf-turnstile" data-sitekey={TURNSTILE_SITE_KEY} data-theme="dark" />}
      {state && !state.ok && (
        <p role="alert" className="text-sm text-live-text">
          {state.message}
        </p>
      )}
      <Button className="w-full" disabled={pending}>
        {pending ? "Đang tạo…" : "Tạo tài khoản"}
      </Button>
    </form>
  );
}
