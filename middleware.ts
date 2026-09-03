import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAllowedAdvisorEmail } from "@/lib/advisor-access";
import { checkClientDiagnosticInviteRateLimit } from "@/lib/security/client-diagnostic-invite-rate-limit";
import { getValidatedSupabaseUrl } from "@/lib/supabase/environment";

function applyProtectedHeaders(response: NextResponse) {
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  response.headers.set(
    "Cache-Control",
    "private, no-store, no-cache, must-revalidate",
  );

  return response;
}

function getInviteTokenFromPath(pathname: string): string | null {
  const prefix = "/client-diagnostic/respond/";

  if (!pathname.startsWith(prefix)) {
    return null;
  }

  const encodedToken = pathname.slice(prefix.length).split("/")[0]?.trim();

  if (!encodedToken) {
    return null;
  }

  try {
    return decodeURIComponent(encodedToken);
  } catch {
    return encodedToken;
  }
}

async function protectClientDiagnosticInvite(
  request: NextRequest,
): Promise<NextResponse> {
  const inviteToken = getInviteTokenFromPath(request.nextUrl.pathname);

  if (!inviteToken) {
    return applyProtectedHeaders(NextResponse.next());
  }

  try {
    const rateLimit = await checkClientDiagnosticInviteRateLimit({
      requestHeaders: request.headers,
      inviteToken,
    });

    if (!rateLimit.blocked) {
      return applyProtectedHeaders(NextResponse.next());
    }

    console.warn(
      JSON.stringify({
        event: "client_diagnostic_invite_rate_limited",
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      }),
    );

    return applyProtectedHeaders(
      NextResponse.json(
        {
          success: false,
          error: "Too many access attempts. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        },
      ),
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "client_diagnostic_invite_rate_limit_failed",
        error:
          error instanceof Error
            ? error.message
            : "Unknown rate-limit error occurred.",
      }),
    );

    /*
     * Fail closed because allowing the request through would silently
     * remove the brute-force protection if the rate-limit service fails.
     */
    return applyProtectedHeaders(
      NextResponse.json(
        {
          success: false,
          error: "Unable to validate this invitation at present.",
        },
        { status: 503 },
      ),
    );
  }
}

async function protectAdvisorRoute(
  request: NextRequest,
): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;
  const response = NextResponse.next();

  const supabase = createServerClient(
    getValidatedSupabaseUrl(),
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/client-diagnostic/respond/")) {
    return protectClientDiagnosticInvite(request);
  }

  if (pathname === "/advisor/login") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/advisor")) {
    return protectAdvisorRoute(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/advisor/:path*",
    "/client-diagnostic/respond/:path*",
  ],
};
