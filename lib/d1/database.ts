import { getCloudflareContext } from "@opennextjs/cloudflare";

type D1MigrationEnv = CloudflareEnv & {
  D1_DIAGNOSTIC_SUBMISSIONS_MODE?: string;
};

export function getD1Database(): D1Database {
  return getCloudflareContext().env.DB;
}

export function isD1DiagnosticSubmissionsShadowWriteEnabled(): boolean {
  try {
    const env = getCloudflareContext().env as D1MigrationEnv;

    return env.D1_DIAGNOSTIC_SUBMISSIONS_MODE === "shadow";
  } catch {
    return false;
  }
}
