import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data: sessionData, error } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!error && sessionData?.session) {
      // If redirecting to portal, link auth user to customer
      if (next.includes("/portal")) {
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

          await fetch(`${supabaseUrl}/functions/v1/portal-link-customer`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${sessionData.session.access_token}`,
            },
            body: JSON.stringify({
              email: sessionData.session.user.email,
              auth_user_id: sessionData.session.user.id,
            }),
          });
        } catch {
          // Non-critical: linking failure should not block login
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
