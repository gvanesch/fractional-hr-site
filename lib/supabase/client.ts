"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getValidatedSupabaseUrl } from "@/lib/supabase/environment";

function getRequiredAnonKey(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!value) {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  return value;
}

export function createSupabaseBrowserClient() {
  return createBrowserClient(getValidatedSupabaseUrl(), getRequiredAnonKey());
}
