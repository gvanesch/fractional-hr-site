import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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