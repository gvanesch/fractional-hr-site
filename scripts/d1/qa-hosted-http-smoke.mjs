// Read-only hosted probe. Never print response bodies or credentials.
const origin = "https://fractional-hr-site-qa.greg-732.workers.dev";
const request = async (path, headers = {}) =>
  fetch(new URL(path, origin), {
    headers,
    redirect: "manual",
    signal: AbortSignal.timeout(15000),
  });

const health = await request("/api/health");
if (health.status !== 200) throw new Error(`QA health HTTP ${health.status}.`);
const healthBody = await health.json();
if (
  healthBody.status !== "ok" ||
  healthBody.d1 !== "connected" ||
  healthBody.supabase !== "not_required"
)
  throw new Error("QA health does not report D1-primary operation.");
console.log("QA D1-primary health: ready");

for (const [label, path, headers] of [
  ["advisor page without Access", "/advisor", {}],
  ["advisor API without Access", "/api/client-diagnostic-projects", {}],
  ["advisor API with invalid JWT", "/api/client-diagnostic-projects", { "Cf-Access-Jwt-Assertion": "invalid" }],
]) {
  const response = await request(path, headers);
  const location = response.headers.get("location");
  const redirect = location ? new URL(location, origin) : null;
  if (
    ![302, 303, 307].includes(response.status) ||
    !redirect?.pathname.startsWith("/cdn-cgi/access/") ||
    ![new URL(origin).hostname, "gregvanesch.cloudflareaccess.com"].includes(redirect.hostname)
  )
    throw new Error(`${label}: expected Access sign-in redirect, got HTTP ${response.status} at ${redirect?.hostname ?? "none"}${redirect?.pathname ?? ""}.`);
  console.log(`${label}: Access sign-in required`);
}

const invitation = await request("/client-diagnostic/respond/invalid-qa-smoke-token");
if (invitation.status < 400 || invitation.status >= 500 && invitation.status !== 503)
  throw new Error(`Invalid invitation did not fail closed: HTTP ${invitation.status}.`);
console.log("Invalid invitation: rejected");
