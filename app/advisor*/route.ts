import { NextResponse } from "next/server";

// Access can use the configured wildcard literally as its post-logout URL.
// Send that landing URL to the real advisor page for the next sign-in.
export function GET(request: Request) {
  const destination = new URL("/advisor", request.url);
  return NextResponse.redirect(destination, {
    status: 302,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
