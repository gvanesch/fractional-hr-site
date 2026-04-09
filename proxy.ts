import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAllowedAdvisorEmail } from "@/lib/advisor-access";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!pathname.startsWith("/advisor") || pathname === "/advisor/login") {
    return NextResponse.next();
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/advisor/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (!isAllowedAdvisorEmail(user.email)) {
    const forbiddenUrl = new URL("/advisor/login", request.url);
    forbiddenUrl.searchParams.set("error", "forbidden");
    return NextResponse.redirect(forbiddenUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/advisor/:path*"],
};