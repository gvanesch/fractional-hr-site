"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getValidatedSupabaseUrl } from "@/lib/supabase/environment";

function getRequiredPublicEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    getValidatedSupabaseUrl(),
    getRequiredPublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}
