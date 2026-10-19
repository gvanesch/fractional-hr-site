// One explicitly authorised invitation. Never reads answers or prints tokens/OTP codes.
import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { createRequire } from "node:module";
import {
  activationFlags,
  bindingFingerprint,
} from "../d1/prepare-approved-production-activation.mjs";
const require = createRequire(import.meta.url);
const account = "73221f18acc676e4992c89fcbf2b2a8f",
  database = "b81b99d7-4b10-4f7e-a0c1-ada3adf596fc",
  worker = "fractional-hr-site",
  site = "https://www.vanesch.uk";
const enableEmail = process.env.BASELINE_RELEASE_KIND === "enable-email";
const approvalPath = enableEmail
  ? "scripts/baseline/production-email-enable-approval.json"
  : "scripts/baseline/production-it-test-approval.json";
const a = JSON.parse(await readFile(approvalPath, "utf8"));
const age = Date.now() - Date.parse(a.confirmedAt);
if (
  process.env.GITHUB_REPOSITORY !== "gvanesch/fractional-hr-site" ||
  process.env.GITHUB_REF !== "refs/heads/migration/d1" ||
  process.env.CLOUDFLARE_ACCOUNT_ID !== account ||
  !["it-test", "enable-email"].includes(process.env.BASELINE_RELEASE_KIND) ||
  !process.env.CLOUDFLARE_API_TOKEN ||
  a.approvedBy !== "Greg van Esch" ||
  a.scope !==
    (enableEmail
      ? "production-enable-email-and-greg-teamblue-invite"
      : "production-toni-email-and-otp-test") ||
  a.recipient !==
    (enableEmail ? "Greg.vanesch@team.blue" : "antoni.serra@team.blue") ||
  a.campaignId !==
    (enableEmail
      ? "55000003-2026-4019-8040-000000000001"
      : "55000002-2026-4019-8040-000000000001") ||
  a.sendEmail !== true ||
  a.sendBulkEmail !== false ||
  !Number.isFinite(age) ||
  age < 0 ||
  age > 86400000
)
  throw Error("Exact current IT invitation approval is required.");
if (
  execFileSync("git", ["rev-parse", "HEAD^"], { encoding: "utf8" }).trim() !==
    a.reviewedCommit ||
  execFileSync("git", ["diff", "--name-only", "HEAD^", "HEAD"], {
    encoding: "utf8",
  }).trim() !== approvalPath
)
  throw Error("IT invitation revision differs from the reviewed code.");
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
  if (!r.ok)
    throw Error(
      "Production IT test metadata/query unavailable: HTTP " + r.status,
    );
  const b = await r.json();
  if (!b.success) throw Error("Production IT test metadata/query failed.");
  return b.result;
}
async function query(sql, params = []) {
  const b = await cf(`d1/database/${database}/query`, { sql, params });
  if (b.some((x) => !x.success)) throw Error("IT fixture query failed.");
  return b[0].results;
}
const settings = await cf(`workers/scripts/${worker}/settings`),
  bindings = new Map(settings.bindings.map((b) => [b.name, b]));
const recovery = JSON.parse(
  await readFile("baseline-depth-recovery.json", "utf8"),
);
const fingerprint = (map) =>
  bindingFingerprint(
    enableEmail
      ? new Map([...map].filter(([name]) => name !== "BASELINE_MAIL_MODE"))
      : map,
  );
const live = (await cf(`workers/scripts/${worker}/deployments`))
  .deployments?.[0];
if (
  (bindings.get("DB")?.id ?? bindings.get("DB")?.database_id) !== database ||
  activationFlags.some((n) => bindings.get(n)?.text !== "d1") ||
  bindings.get("BASELINE_ENABLED")?.text !== "true" ||
  bindings.get("BASELINE_MAIL_MODE")?.text !==
    (enableEmail ? "send" : recovery.mailMode) ||
  bindings.get("BASELINE_TEST_CAMPAIGN_ID")?.text !==
    "55000001-2026-4017-8040-000000000001" ||
  bindings.get("NEXT_PUBLIC_APP_ENV")?.text !== "production" ||
  !bindings.has("RESEND_API_KEY") ||
  !bindings.has("CONTACT_FROM_EMAIL") ||
  fingerprint(bindings) !== recovery.bindingFingerprint ||
  live.id === recovery.deploymentId ||
  live.versions?.length !== 1 ||
  live.versions[0].percentage !== 100
)
  throw Error(
    "Deployed production settings or restricted recipient configuration differ.",
  );
const built = await require("esbuild").build({
  stdin: {
    contents:
      'export * from "./lib/baseline/collection";export * from "./lib/baseline/it-delivery-test";',
    resolveDir: process.cwd(),
  },
  bundle: true,
  platform: "node",
  format: "cjs",
  write: false,
});
const module = { exports: {} };
new Function("module", "exports", built.outputFiles[0].text)(
  module,
  module.exports,
);
const m = module.exports,
  t = enableEmail ? m.GREG_DELIVERY_TEST : m.IT_DELIVERY_TEST;
if (
  t.email !== a.recipient ||
  t.campaign !== a.campaignId ||
  Date.parse(t.closes) <= Date.now()
)
  throw Error("IT fixture identity or expiry differs.");
// Existing requested invitations, responses and mail-test ledgers are never replaced.
for (const [sql, params] of [
  [
    "SELECT campaign_id FROM tb_baseline_campaigns WHERE campaign_id=?",
    [t.campaign],
  ],
  [
    "SELECT participant_id FROM tb_baseline_participants WHERE participant_id=? OR lower(email)=lower(?)",
    [t.participant, t.email],
  ],
  [
    "SELECT event_id FROM tb_baseline_audit WHERE event_id=?",
    [t.invitationEvent],
  ],
])
  if ((await query(sql, params)).length)
    throw Error(
      "Toni's test exists already. Inspect it before any repeat invitation.",
    );
const version = (
  await query(
    "SELECT definition_json FROM tb_baseline_versions WHERE version=?",
    [m.DEPTH_COLLECTION_VERSION],
  )
)[0];
if (
  version &&
  version.definition_json !== JSON.stringify(m.DEPTH_COLLECTION_DEFINITION)
)
  throw Error("Production questionnaire definition differs.");
const stamp = new Date().toISOString(),
  token = randomBytes(32).toString("hex"),
  invite = randomUUID();
const statements = [
  {
    sql: "INSERT OR IGNORE INTO tb_baseline_versions VALUES(?,?,?)",
    params: [
      m.DEPTH_COLLECTION_VERSION,
      JSON.stringify(m.DEPTH_COLLECTION_DEFINITION),
      stamp,
    ],
  },
  {
    sql: "INSERT INTO tb_baseline_campaigns VALUES(?,?,?,?,?,?,?,?,?)",
    params: [
      t.campaign,
      enableEmail
        ? "[PRODUCTION EMAIL TEST] team.blue baseline"
        : "[IT DELIVERY TEST] team.blue baseline",
      m.DEPTH_COLLECTION_VERSION,
      "open",
      t.closes,
      "IT delivery and access test only. Use synthetic answers. Exclude this campaign from programme reporting. Responses are retained; no automated deletion applies.",
      730,
      stamp,
      "[]",
    ],
  },
  {
    sql: "INSERT INTO tb_baseline_participants VALUES(?,?,?,?,1,?)",
    params: [
      t.participant,
      t.campaign,
      t.email,
      JSON.stringify({
        name: enableEmail
          ? "Greg — production email test"
          : "Toni — IT delivery test",
        email: t.email,
        country: "",
        region: "IT test only",
        entity: "IT test only",
        job_title: "IT test participant",
        work_type: "mixed",
        manages_people: "no",
        direct_reports: "0",
      }),
      stamp,
    ],
  },
  {
    sql: "INSERT INTO tb_baseline_roster_details VALUES(?,?,?)",
    params: [
      t.participant,
      JSON.stringify({ working_fraction: 1, contracted_hours: 40 }),
      stamp,
    ],
  },
  {
    sql: "INSERT INTO tb_baseline_responses VALUES(?,?,?,0,0,?,?,?,NULL)",
    params: [
      t.participant,
      m.DEPTH_COLLECTION_VERSION,
      "not_started",
      randomUUID(),
      JSON.stringify(m.initialCollection(m.DEPTH_COLLECTION_VERSION)),
      stamp,
    ],
  },
  {
    sql: "INSERT INTO tb_baseline_invites VALUES(?,?,?,?,NULL,?)",
    params: [
      invite,
      t.participant,
      createHash("sha256").update(token).digest("hex"),
      t.closes,
      stamp,
    ],
  },
  {
    sql: "INSERT INTO tb_baseline_audit VALUES(?,?,?,?,?,?,?)",
    params: [
      randomUUID(),
      t.campaign,
      "greg-approved-it-test",
      "it_test_prepared",
      t.participant,
      JSON.stringify({
        version: m.DEPTH_COLLECTION_VERSION,
        sendOtpNow: false,
        sendBulkEmail: false,
      }),
      stamp,
    ],
  },
];
const seeded = await cf(`d1/database/${database}/query`, { batch: statements });
if (seeded.some((x) => !x.success))
  throw Error("IT fixture creation failed. Inspect before retrying.");
const r = await fetch(site + "/api/baseline/qa-email-test", {
  method: "POST",
  headers: { Origin: site, "Content-Type": "application/json" },
  body: JSON.stringify({ token }),
  redirect: "manual",
  signal: AbortSignal.timeout(30000),
});
const status = r.status;
await r.body?.cancel();
if (status !== 200)
  throw Error(
    "IT invitation did not confirm success: HTTP " +
      status +
      ". No automatic resend.",
  );
const record = (
  await query(
    "SELECT metadata_json FROM tb_baseline_audit WHERE event_id=? AND campaign_id=? AND subject_id=?",
    [t.invitationEvent, t.campaign, t.participant],
  )
)[0];
const delivery = record ? JSON.parse(record.metadata_json) : null;
if (delivery?.status !== "sent" || !delivery.providerId)
  throw Error(
    "IT invitation provider acceptance is unconfirmed. No automatic resend.",
  );
const verification = {
  recipient: t.email,
  campaignId: t.campaign,
  questionnaireVersion: m.DEPTH_COLLECTION_VERSION,
  invitation: "provider-accepted",
  providerId: delivery.providerId,
  otp: "not sent; awaiting recipient request",
  emailSending:
    bindings.get("BASELINE_MAIL_MODE")?.text === "send"
      ? "enabled"
      : "test-only",
  expiresAt: t.closes,
  bulkSending: false,
  verifiedAt: new Date().toISOString(),
};
await writeFile(
  "baseline-it-test-verification.json",
  JSON.stringify(verification, null, 2) + "\n",
);
console.log(JSON.stringify(verification, null, 2));
