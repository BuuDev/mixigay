import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/redirect";
import { serverClient } from "@/lib/supabase/server";

/** Google → Supabase → here with ?code=…; exchanges it for a session cookie. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"), origin);
  if (code) {
    const supabase = await serverClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }
  return NextResponse.redirect(new URL("/?loi=dang-nhap", origin));
}
