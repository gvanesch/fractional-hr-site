import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAllowedAdvisorEmail } from "@/lib/advisor-access";

function applyProtectedHeaders(response: NextResponse) {
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  response.headers.set(
    "Cache-Control",
    "private, no-store, no-cache, must-revalidate",
  );
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!pathname.startsWith("/advisor") || pathname === "/advisor/login") {
    return NextResponse.next();
  }

  let response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: Record<string, unknown>) {
          response.cookies.set({
            name,
            value: "",
            ...options,
            maxAge: 0,
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/advisor/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return applyProtectedHeaders(NextResponse.redirect(loginUrl));
  }

  if (!isAllowedAdvisorEmail(user.email)) {
    const forbiddenUrl = new URL("/advisor/login", request.url);
    forbiddenUrl.searchParams.set("error", "forbidden");
    return applyProtectedHeaders(NextResponse.redirect(forbiddenUrl));
  }

  return applyProtectedHeaders(response);
}

export const config = {
  matcher: ["/advisor/:path*"],
};