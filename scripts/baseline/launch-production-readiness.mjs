// Read-only production configuration review. Never print credentials or response data.
const account = "73221f18acc676e4992c89fcbf2b2a8f",
  database = "b81b99d7-4b10-4f7e-a0c1-ada3adf596fc";
if (
  process.env.GITHUB_REPOSITORY !== "gvanesch/fractional-hr-site" ||
  process.env.GITHUB_REF !== "refs/heads/migration/d1" ||
  !process.env.CLOUDFLARE_API_TOKEN
)
  throw Error("Production readiness context unavailable");
async function cf(path, body) {
  const r = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/${path}`,
    {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: "Bearer " + process.env.CLOUDFLARE_API_TOKEN,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20000),
    },
  );
  if (!r.ok) throw Error("Readiness metadata unavailable: HTTP " + r.status);
  const b = await r.json();
  if (!b.success) throw Error("Readiness metadata rejected");
  return b.result;
}
const settings = await cf("workers/scripts/fractional-hr-site/settings"),
  bindings = new Map(settings.bindings.map((b) => [b.name, b]));
if (
  bindings.get("BASELINE_MAIL_MODE")?.text !== "send" ||
  !bindings.has("RESEND_API_KEY") ||
  !bindings.has("CONTACT_FROM_EMAIL") ||
  bindings.get("NEXT_PUBLIC_APP_ENV")?.text !== "production" ||
  (bindings.get("DB")?.id ?? bindings.get("DB")?.database_id) !== database
)
  throw Error("Full production email configuration is not ready");
const result = await cf(`d1/database/${database}/query`, {
  sql: "SELECT (SELECT count(*) FROM tb_baseline_campaigns) campaigns,(SELECT count(*) FROM tb_baseline_participants WHERE active=1) active_respondents,(SELECT count(*) FROM tb_baseline_dashboard_shares WHERE revoked_at IS NULL AND expires_at>?) active_dashboard_links",
  params: [new Date().toISOString()],
});
if (result.some((r) => !r.success))
  throw Error("Production workspace data check failed");
console.log(
  "Production email: unrestricted sending enabled; provider and sender configured. Invitations, verification codes and requested Word copies use the normal production mail gate.",
);
console.log(
  JSON.stringify({
    workspaceData: result[0].results[0],
    window: "21–30 October 2026; close at 18:00 UTC",
    retention: "No automatic deletion introduced",
    actions:
      "Read-only verification; no invitation, verification code or answer-copy email sent",
  }),
);
