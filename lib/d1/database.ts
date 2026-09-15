import { getCloudflareContext } from "@opennextjs/cloudflare";

export function getD1Database(): D1Database {
  return getCloudflareContext().env.DB;
}
