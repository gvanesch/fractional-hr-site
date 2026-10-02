import { createSupabaseServerClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import {
  isCloudflareAdvisorAuthEnabled,
  verifyCloudflareAdvisorAccess,
  type AdvisorAccessUser,
} from "@/lib/cloudflare-access";
import { isAllowedAdvisorEmail } from "@/lib/advisor-access";

export async function authenticateAdvisorRequest(
  request?: Request,
): Promise<AdvisorAccessUser | Awaited<ReturnType<typeof getSupabaseAdvisorUser>>> {
  if (isCloudflareAdvisorAuthEnabled()) {
    try {
      const requestHeaders = request?.headers ?? (await headers());
      return await verifyCloudflareAdvisorAccess(requestHeaders);
    } catch (error) {
      console.error("[advisor-auth] Cloudflare Access validation failed", {
        message: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }

  return getSupabaseAdvisorUser();
}

async function getSupabaseAdvisorUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || !isAllowedAdvisorEmail(user.email)) {
    return null;
  }

  return user;
}

export async function requireAdvisorUser() {
  try {
    return await authenticateAdvisorRequest();
  } catch (error) {
    console.error("[advisor-auth] requireAdvisorUser failed", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return null;
  }
}
