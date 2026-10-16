// Explicitly authorised Greg-only QA mail test. Never log bearer values, codes or message contents.
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url),
  esbuild = require("esbuild");
const account = "73221f18acc676e4992c89fcbf2b2a8f",
  database = "b25d59da-5f93-4301-9996-7be0c9708789",
  site = process.env.NEXT_PUBLIC_SITE_URL,
  credential = process.env.CLOUDFLARE_API_TOKEN;
if (
  process.env.GITHUB_REF !== "refs/heads/feature/team-blue-baseline" ||
  process.env.CLOUDFLARE_ACCOUNT_ID !== account ||
  !credential ||
  !/^https:\/\/fractional-hr-site-qa\.[a-z0-9-]+\.workers\.dev$/.test(
    site ?? "",
  )
)
  throw Error("Greg mail test requires the isolated QA target");
async function query(sql, params = []) {
  const r = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${database}/query`,
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + credential,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    },
  );
  if (!r.ok) throw Error("QA mail ledger unavailable: HTTP " + r.status);
  const b = await r.json();
  if (!b.success || b.result.some((x) => !x.success))
    throw Error("QA mail ledger query failed");
  return b.result[0].results;
}
const ledger = await query(
  "SELECT kind,status,provider_id FROM tb_baseline_qa_mail_tests",
);
if (ledger.length === 2 && ledger.every((r) => r.status === "sent")) {
  console.log(
    "Greg-only invitation and code test already sent. No repeat emails.",
  );
  process.exit(0);
}
if (ledger.some((r) => r.status !== "sent"))
  throw Error(
    "A mail test has already been attempted. No automatic duplicate sends. Inspect reserved/failed ledger status.",
  );
let token;
const prior = ledger.find((r) => r.kind === "invite");
if (prior) {
  if (!process.env.BASELINE_QA_RESEND_TOKEN || !prior.provider_id)
    throw Error(
      "Existing invite retrieval unavailable; preserve its private link.",
    );
  const r = await fetch(
    "https://api.resend.com/emails/" + encodeURIComponent(prior.provider_id),
    {
      headers: {
        Authorization: "Bearer " + process.env.BASELINE_QA_RESEND_TOKEN,
      },
    },
  );
  if (!r.ok)
    throw Error(
      "Unable to retrieve the existing test invitation; no replacement email sent.",
    );
  const b = await r.json();
  const match = String(b.text ?? "").match(
    /https:\/\/fractional-hr-site-qa\.[a-z0-9-]+\.workers\.dev\/baseline\/start#([a-f0-9]{64})/,
  );
  if (!match) throw Error("Existing invite has no valid QA link");
  token = match[1];
} else {
  const built = await esbuild.build({
    entryPoints: [
      new URL("../../lib/baseline/collection.ts", import.meta.url).pathname,
    ],
    bundle: true,
    platform: "node",
    format: "cjs",
    write: false,
  });
  const m = { exports: {} };
  new Function("module", "exports", built.outputFiles[0].text)(m, m.exports);
  const model = m.exports;
  const campaign = randomUUID(),
    participant = randomUUID(),
    invite = randomUUID(),
    stamp = new Date().toISOString(),
    expires = new Date(Date.now() + 14 * 86400000).toISOString();
  token = randomBytes(32).toString("hex");
  await query("INSERT OR IGNORE INTO tb_baseline_versions VALUES(?,?,?)", [
    model.COLLECTION_VERSION,
    JSON.stringify(model.COLLECTION_DEFINITION),
    stamp,
  ]);
  const version = await query(
    "SELECT definition_json FROM tb_baseline_versions WHERE version=?",
    [model.COLLECTION_VERSION],
  );
  if (
    version[0]?.definition_json !== JSON.stringify(model.COLLECTION_DEFINITION)
  )
    throw Error("Reviewed version snapshot differs; no email sent");
  await query("INSERT INTO tb_baseline_campaigns VALUES(?,?,?,?,?,?,?,?,?)", [
    campaign,
    "team.blue Baseline — QA email preview for Greg",
    model.COLLECTION_VERSION,
    "open",
    expires,
    "This QA exercise tests secure access and email content. Use example answers. Production collection remains awaiting approval.",
    90,
    stamp,
    "[]",
  ]);
  await query("INSERT INTO tb_baseline_participants VALUES(?,?,?,?,1,?)", [
    participant,
    campaign,
    "greg@vanesch.uk",
    JSON.stringify({
      name: "Greg — QA email preview",
      email: "greg@vanesch.uk",
      country: "GB",
      region: "QA",
      work_type: "mixed",
      manages_people: "no",
      direct_reports: "0",
      entity: "Synthetic QA",
      job_title: "QA reviewer",
    }),
    stamp,
  ]);
  await query("INSERT INTO tb_baseline_roster_details VALUES(?,?,?)", [
    participant,
    "{}",
    stamp,
  ]);
  await query(
    "INSERT INTO tb_baseline_responses VALUES(?,?,?,0,0,?,?,?,NULL)",
    [
      participant,
      model.COLLECTION_VERSION,
      "not_started",
      randomUUID(),
      JSON.stringify(model.initialCollection()),
      stamp,
    ],
  );
  await query("INSERT INTO tb_baseline_invites VALUES(?,?,?,?,NULL,?)", [
    invite,
    participant,
    createHash("sha256").update(token).digest("hex"),
    expires,
    stamp,
  ]);
  await query("INSERT INTO tb_baseline_audit VALUES(?,?,?,?,?,?,?)", [
    randomUUID(),
    campaign,
    "github-actions-qa",
    "greg_mail_test_prepared",
    participant,
    JSON.stringify({ authorisedRecipient: true }),
    stamp,
  ]);
}
async function api(path) {
  const r = await fetch(site + "/api/baseline/" + path, {
    method: "POST",
    headers: { Origin: site, "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!r.ok)
    throw Error("Greg-only " + path + " test failed: HTTP " + r.status);
  await r.body?.cancel();
}
if (!prior) await api("qa-email-test");
if (!ledger.some((r) => r.kind === "code")) await api("request-code");
const final = await query("SELECT kind,status FROM tb_baseline_qa_mail_tests");
if (final.length !== 2 || final.some((r) => r.status !== "sent"))
  throw Error("Greg mail test did not reach both sent states");
console.log(
  "One invitation and one verification-code email sent to the authorised Greg address. Other recipients and general sending remain blocked.",
);
