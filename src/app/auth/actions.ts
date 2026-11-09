"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { serverClient } from "@/lib/supabase/server";

export async function signInWithGoogle(formData: FormData) {
  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;
  const next = String(formData.get("next") ?? "/");
  const supabase = await serverClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect("/?loi=dang-nhap");
  redirect(data.url);
}

export async function signOut() {
  const supabase = await serverClient();
  await supabase.auth.signOut();
  redirect("/");
}
