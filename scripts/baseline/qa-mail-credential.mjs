// Checks names only. The existing credential value stays inside the QA Worker.
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
if (
  account !== "73221f18acc676e4992c89fcbf2b2a8f" ||
  process.env.GITHUB_REF !== "refs/heads/feature/team-blue-baseline"
)
  throw Error("QA credential inventory target mismatch");
const r = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/fractional-hr-site-qa/secrets`,
  { headers: { Authorization: "Bearer " + process.env.CLOUDFLARE_API_TOKEN } },
);
if (!r.ok)
  throw Error("QA secret-name inventory unavailable: HTTP " + r.status);
const b = await r.json();
if (
  !b.success ||
  !Array.isArray(b.result) ||
  !b.result.some((s) =>
    ["BASELINE_QA_RESEND_API_KEY", "RESEND_API_KEY"].includes(s.name),
  )
)
  throw Error("No configured QA email credential is available.");
console.log(
  "Existing QA Worker email credential is available. Values were not read or copied; strict Greg-only sending remains enforced.",
);
