import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getValidatedSupabaseUrl } from "@/lib/supabase/environment";

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    getValidatedSupabaseUrl(),
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {
          // No-op in server component context.
          // Cookie writes must happen in Route Handlers or Server Actions.
        },
        remove() {
          // No-op in server component context.
          // Cookie writes must happen in Route Handlers or Server Actions.
        },
      },
    },
  );
}
