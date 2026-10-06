import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getValidatedSupabaseUrl } from "@/lib/supabase/environment";

function getRequiredAnonKey(): string {
  // A literal reference lets Next.js include the public build credential.
  // A dynamic lookup requires a separate runtime binding and can lose login.
  const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!value) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return value;
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    getValidatedSupabaseUrl(),
    getRequiredAnonKey(),
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
