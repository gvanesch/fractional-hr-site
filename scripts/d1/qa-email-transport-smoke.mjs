// One QA-only contact submission. Do not log the response body or email identifiers.
if (process.env.GITHUB_REF !== "refs/heads/migration/d1" || !process.env.GITHUB_RUN_ID)
  throw new Error("This email smoke requires the migration branch in GitHub Actions.");

const response = await fetch("https://fractional-hr-site-qa.greg-732.workers.dev/api/contact", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Greg QA Test",
    email: "greg@vanesch.uk",
    company: "Van Esch Advisory QA",
    topic: "QA email transport test",
    source: "qa-email-transport-smoke",
    message: `Automated QA email check from run ${process.env.GITHUB_RUN_ID}. No action required.`,
  }),
  redirect: "manual",
  signal: AbortSignal.timeout(20000),
});
if (response.status !== 200) throw new Error(`QA contact email HTTP ${response.status}.`);
const result = await response.json();
if (result.ok !== true || typeof result.resendId !== "string" || !result.resendId)
  throw new Error("QA contact email did not return a Resend acknowledgement.");
console.log("QA contact and Resend handoff: accepted");
