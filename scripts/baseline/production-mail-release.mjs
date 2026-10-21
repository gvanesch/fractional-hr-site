// Controlled production launch test. Only Greg, one pinned campaign, no bulk mail or OTP logging.
import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { createRequire } from "node:module";
import {
  activationFlags,
  bindingFingerprint,
} from "../d1/prepare-approved-production-activation.mjs";
import { verifyProductionPublicKey } from "../d1/verify-production-public-key.mjs";
const require = createRequire(import.meta.url);
const account = "73221f18acc676e4992c89fcbf2b2a8f",
  database = "b81b99d7-4b10-4f7e-a0c1-ada3adf596fc",
  worker = "fractional-hr-site",
  site = "https://www.vanesch.uk";
const campaign = "55000001-2026-4017-8040-000000000001",
  person = "55000001-2026-4017-8040-000000000002";
const a = JSON.parse(
  await readFile(new URL("./production-mail-approval.json", import.meta.url)),
);
const age = Date.now() - Date.parse(a.confirmedAt);
if (
  process.env.GITHUB_REF !== "refs/heads/migration/d1" ||
  process.env.GITHUB_REPOSITORY !== "gvanesch/fractional-hr-site" ||
  process.env.CLOUDFLARE_ACCOUNT_ID !== account ||
  !process.env.CLOUDFLARE_API_TOKEN ||
  a.approvedBy !== "Greg van Esch" ||
  a.scope !== "production-greg-only-email-and-otp-test" ||
  a.recipient !== "greg@vanesch.uk" ||
  a.campaignId !== campaign ||
  a.sendBulkEmail !== false ||
  age < 0 ||
  age > 86400000 ||
  !Number.isFinite(age)
)
  throw Error("Exact current production mail-test approval is unavailable.");
const parent = execFileSync("git", ["rev-parse", "HEAD^"], {
  encoding: "utf8",
}).trim();
const changed = execFileSync("git", ["diff", "--name-only", "HEAD^", "HEAD"], {
  encoding: "utf8",
}).trim();
if (
  parent !== a.reviewedCommit ||
  changed !== "scripts/baseline/production-mail-approval.json"
)
  throw Error("Mail approval must be the only change above reviewed code.");
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
  if (!r.ok) throw Error("Production metadata/query HTTP " + r.status);
  const b = await r.json();
  if (!b.success) throw Error("Production metadata/query failed.");
  return b.result;
}
async function query(sql, params = []) {
  const b = await cf(`d1/database/${database}/query`, { sql, params });
  if (b.some((x) => !x.success)) throw Error("Production test query failed.");
  return b[0].results;
}
async function settings() {
  const b = await cf(`workers/scripts/${worker}/settings`);
  return new Map(b.bindings.map((x) => [x.name, x]));
}
function validate(map, mail) {
  if (
    (map.get("DB")?.id ?? map.get("DB")?.database_id) !== database ||
    activationFlags.some((n) => map.get(n)?.text !== "d1") ||
    map.get("BASELINE_ENABLED")?.text !== "true" ||
    map.get("BASELINE_MAIL_MODE")?.text !== mail ||
    (map.get("ADVISOR_AUTH_MODE")?.text ?? "supabase") !== "supabase" ||
    !map.has("RESEND_API_KEY") ||
    !map.has("INVITE_RATE_LIMIT_SALT") ||
    !map.has("CONTACT_FROM_EMAIL")
  )
    throw Error(
      "Production bindings or existing email credential inventory differ.",
    );
}
const unrelated = (map) =>
  new Map(
    [...map].filter(
      ([n]) => !["BASELINE_MAIL_MODE", "BASELINE_TEST_CAMPAIGN_ID"].includes(n),
    ),
  );
async function api(path, body, expected = 200) {
  const r = await fetch(site + "/api/baseline/" + path, {
    method: "POST",
    headers: { Origin: site, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    redirect: "manual",
    signal: AbortSignal.timeout(20000),
  });
  const status = r.status;
  await r.body?.cancel();
  if (
    !(Array.isArray(expected) ? expected.includes(status) : expected === status)
  )
    throw Error("Production " + path + " HTTP " + status + " differs.");
  return status;
}
const mode = process.argv[2],
  recovery = new URL("../../baseline-mail-recovery.json", import.meta.url);
if (mode === "prepare") {
  const map = await settings();
  validate(map, "preview");
  const live = (await cf(`workers/scripts/${worker}/deployments`))
    .deployments?.[0];
  if (
    live?.versions?.length !== 1 ||
    live.versions[0].version_id !== a.expectedVersionId ||
    live.versions[0].percentage !== 100
  )
    throw Error("Production version differs from the approved checkpoint.");
  const qr = await fetch(
    `https://api.github.com/repos/gvanesch/fractional-hr-site/actions/runs/${a.qaRunId}`,
    {
      headers: {
        Authorization: "Bearer " + process.env.GH_TOKEN,
        Accept: "application/vnd.github+json",
      },
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!qr.ok) throw Error("QA evidence unavailable.");
  const qa = await qr.json();
  if (
    qa.head_sha !== a.reviewedCommit ||
    qa.head_branch !== "feature/team-blue-baseline" ||
    qa.path !== ".github/workflows/baseline-qa.yml" ||
    qa.conclusion !== "success"
  )
    throw Error("Exact mail-test implementation has not passed QA.");
  await verifyProductionPublicKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const existing = await query(
    "SELECT kind,status FROM tb_baseline_qa_mail_tests",
  );
  if (existing.length)
    throw Error(
      "A production test email has already been attempted; preserve the ledger and review it.",
    );
  const collisions = await query(
    "SELECT campaign_id FROM tb_baseline_campaigns WHERE campaign_id=?",
    [campaign],
  );
  if (collisions.length)
    throw Error(
      "Reserved production email test already exists; inspect it before repeating.",
    );
  const configUrl = new URL("../../wrangler.jsonc", import.meta.url),
    config = JSON.parse(await readFile(configUrl));
  if (
    config.name !== worker ||
    config.route ||
    config.routes ||
    config.custom_domains ||
    config.triggers?.crons?.length ||
    activationFlags.some((n) => config.vars[n] !== "d1") ||
    config.d1_databases?.find((x) => x.binding === "DB")?.database_id !==
      database
  )
    throw Error("Production target configuration differs.");
  await writeFile(
    recovery,
    JSON.stringify(
      {
        deploymentId: live.id,
        versions: live.versions,
        bindingFingerprint: bindingFingerprint(unrelated(map)),
      },
      null,
      2,
    ) + "\n",
    { mode: 0o600 },
  );
  config.account_id = account;
  Object.assign(config.vars, {
    BASELINE_ENABLED: "true",
    BASELINE_MAIL_MODE: "greg-only",
    BASELINE_TEST_CAMPAIGN_ID: campaign,
    NEXT_PUBLIC_APP_ENV: "production",
    NEXT_PUBLIC_SITE_URL:
      map.get("NEXT_PUBLIC_SITE_URL")?.text ?? "https://vanesch.uk",
    NEXT_PUBLIC_SUPABASE_URL: "https://qxddddhhpfrrxbaunwfw.supabase.co",
  });
  await writeFile(configUrl, JSON.stringify(config, null, 2) + "\n");
  console.log(
    "Exact QA, production target, existing credential inventory and untouched mail ledger verified. Only the pinned Greg test campaign will permit email.",
  );
} else if (mode === "verify") {
  const map = await settings();
  validate(map, "greg-only");
  const saved = JSON.parse(await readFile(recovery));
  if (
    map.get("BASELINE_TEST_CAMPAIGN_ID")?.text !== campaign ||
    bindingFingerprint(unrelated(map)) !== saved.bindingFingerprint
  )
    throw Error("Test restriction or unrelated production settings differ.");
  const r = await fetch(site + "/api/baseline/response", {
    redirect: "manual",
    signal: AbortSignal.timeout(15000),
  });
  if (r.status !== 401) throw Error("Anonymous participant boundary differs.");
  await r.body?.cancel();
  console.log(
    "Production Greg-only mail restriction verified. D1, password login and unrelated bindings preserved.",
  );
} else if (mode === "send-invitation") {
  const map = await settings();
  validate(map, "greg-only");
  if (map.get("BASELINE_TEST_CAMPAIGN_ID")?.text !== campaign)
    throw Error("Production test campaign is not pinned.");
  if ((await query("SELECT kind,status FROM tb_baseline_qa_mail_tests")).length)
    throw Error("Mail has already been attempted. No automatic repeat.");
  if (
    (
      await query(
        "SELECT campaign_id FROM tb_baseline_campaigns WHERE campaign_id=?",
        [campaign],
      )
    ).length
  )
    throw Error(
      "Mail fixture exists already; no replacement invitation created.",
    );
  const build = await require("esbuild").build({
    entryPoints: [
      new URL("../../lib/baseline/collection.ts", import.meta.url).pathname,
    ],
    bundle: true,
    platform: "node",
    format: "cjs",
    write: false,
  });
  const module = { exports: {} };
  new Function("module", "exports", build.outputFiles[0].text)(
    module,
    module.exports,
  );
  const m = module.exports;
  const version = (
    await query(
      "SELECT definition_json FROM tb_baseline_versions WHERE version=?",
      [m.FROZEN_COLLECTION_VERSION],
    )
  )[0];
  if (
    version?.definition_json !== JSON.stringify(m.FROZEN_COLLECTION_DEFINITION)
  )
    throw Error("Frozen production definition differs.");
  const stamp = new Date().toISOString(),
    closes = new Date(Date.now() + 30 * 86400000).toISOString(),
    token = randomBytes(32).toString("hex"),
    invite = randomUUID();
  await query("INSERT INTO tb_baseline_campaigns VALUES(?,?,?,?,?,?,?,?,?)", [
    campaign,
    "[PRODUCTION EMAIL TEST] Greg only",
    m.FROZEN_COLLECTION_VERSION,
    "open",
    closes,
    "Launch test only. Use synthetic answers. Exclude this campaign from programme reporting.",
    30,
    stamp,
    "[]",
  ]);
  await query("INSERT INTO tb_baseline_participants VALUES(?,?,?,?,1,?)", [
    person,
    campaign,
    "greg@vanesch.uk",
    JSON.stringify({
      name: "Greg — production launch test",
      email: "greg@vanesch.uk",
      country: "GB",
      region: "Test only",
      work_type: "mixed",
      manages_people: "no",
      direct_reports: "0",
      entity: "Production test only",
      job_title: "Launch tester",
    }),
    stamp,
  ]);
  await query("INSERT INTO tb_baseline_roster_details VALUES(?,?,?)", [
    person,
    JSON.stringify({ working_fraction: 1, contracted_hours: 40 }),
    stamp,
  ]);
  await query(
    "INSERT INTO tb_baseline_responses VALUES(?,?,?,0,0,?,?,?,NULL)",
    [
      person,
      m.FROZEN_COLLECTION_VERSION,
      "not_started",
      randomUUID(),
      JSON.stringify(m.initialCollection(m.FROZEN_COLLECTION_VERSION)),
      stamp,
    ],
  );
  await query("INSERT INTO tb_baseline_invites VALUES(?,?,?,?,NULL,?)", [
    invite,
    person,
    createHash("sha256").update(token).digest("hex"),
    closes,
    stamp,
  ]);
  // Negative OTP checks use deliberately unmatchable hashes. They never create a session or send a code.
  const expired = randomUUID();
  await query(
    "INSERT INTO tb_baseline_verifications VALUES(?,?,?,?,0,NULL,?)",
    [expired, invite, "0".repeat(64), "2000-01-01T00:00:00Z", stamp],
  );
  await api("verify-code", { token, challenge: expired, code: "000000" }, 403);
  const guesses = randomUUID();
  await query(
    "INSERT INTO tb_baseline_verifications VALUES(?,?,?,?,0,NULL,?)",
    [
      guesses,
      invite,
      "0".repeat(64),
      new Date(Date.now() + 600000).toISOString(),
      stamp,
    ],
  );
  for (let i = 0; i < 6; i++)
    await api(
      "verify-code",
      { token, challenge: guesses, code: "000000" },
      403,
    );
  await api(
    "verify-code",
    { token, challenge: guesses, code: "000000" },
    [403, 429],
  );
  await query(
    "UPDATE tb_baseline_verifications SET consumed_at=? WHERE challenge_id=?",
    [new Date().toISOString(), guesses],
  );
  await api("qa-email-test", { token });
  const ledger = await query(
    "SELECT kind,status FROM tb_baseline_qa_mail_tests",
  );
  if (
    ledger.length !== 1 ||
    ledger[0].kind !== "invite" ||
    ledger[0].status !== "sent"
  )
    throw Error(
      "Invitation did not reach provider-accepted state. No automatic resend.",
    );
  await query("INSERT INTO tb_baseline_audit VALUES(?,?,?,?,?,?,?)", [
    randomUUID(),
    campaign,
    "github-actions-mail-test",
    "production_invite_test_prepared",
    person,
    JSON.stringify({
      recipientRestricted: true,
      otpSent: false,
      negativeOtpChecks: true,
    }),
    new Date().toISOString(),
  ]);
  await writeFile(
    new URL("../../baseline-mail-verification.json", import.meta.url),
    JSON.stringify(
      {
        campaignId: campaign,
        recipient: "greg@vanesch.uk",
        invitation: "provider-accepted",
        otp: "awaiting user request and inbox verification",
        bulkSending: false,
        negativeOtpChecks: [
          "expired challenge rejected",
          "six wrong guesses rejected",
          "locked challenge rejected",
        ],
        expiresAt: closes,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "One production test invitation accepted by provider for greg@vanesch.uk. No OTP sent: Greg requests it when ready. Live expired-code, wrong-code and guess-lock checks passed. No bulk sending or answer-copy activation.",
  );
} else throw Error("Choose prepare, verify or send-invitation.");
