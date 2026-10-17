import { NextResponse } from "next/server";
import {
  baselineEnv,
  BaselineError,
  sameOrigin,
  readBody,
  rateLimit,
  securityHeaders,
} from "@/lib/baseline/server";
import { designTester } from "@/lib/baseline/design-access";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    const env = baselineEnv();
    if (env.NEXT_PUBLIC_APP_ENV !== "qa")
      throw new BaselineError("Not found.", 404);
    sameOrigin(request);
    await rateLimit(
      request,
      "design-test-ip:" + (request.headers.get("cf-connecting-ip") ?? "local"),
      60,
    );
    const body = await readBody(request, 1024);
    const tester = designTester(body.token, env.NEXT_PUBLIC_APP_ENV);
    if (!tester)
      throw new BaselineError(
        "This test link is not available. Ask the organiser for a valid link.",
        403,
      );
    return NextResponse.json({ tester }, { headers: securityHeaders });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof BaselineError
            ? error.message
            : "Unable to check this link. Please try again.",
      },
      {
        status: error instanceof BaselineError ? error.status : 503,
        headers: securityHeaders,
      },
    );
  }
}
