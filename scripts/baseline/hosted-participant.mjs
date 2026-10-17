// Real hosted QA/D1 contract test. Retains a closed synthetic campaign as evidence.
// Never sends email, bypasses administrator authentication, or logs bearer values.
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url),
  esbuild = require("esbuild");
const account = process.env.CLOUDFLARE_ACCOUNT_ID,
  credential = process.env.CLOUDFLARE_API_TOKEN,
  site = process.env.NEXT_PUBLIC_SITE_URL;
const database = "b25d59da-5f93-4301-9996-7be0c9708789";
if (
  account !== "73221f18acc676e4992c89fcbf2b2a8f" ||
  !credential ||
  !/^https:\/\/fractional-hr-site-qa\.[a-z0-9-]+\.workers\.dev$/.test(
    site ?? "",
  )
)
  throw new Error("Hosted test requires isolated QA credentials and URL.");
const built = await esbuild.build({
  entryPoints: [
    new URL("../../lib/baseline/model.ts", import.meta.url).pathname,
  ],
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
const m = module.exports;
const campaign = randomUUID(),
  participant = randomUUID(),
  invite = randomUUID(),
  token = randomBytes(32).toString("hex"),
  hash = createHash("sha256").update(token).digest("hex"),
  stamp = new Date().toISOString(),
  expires = new Date(Date.now() + 3600000).toISOString();
const draft = m.initialDraft({
  name: "Synthetic hosted QA",
  email: "hosted@example.invalid",
  job_title: "Reception coordinator",
  country: "GB",
  work_type: "reception",
});
async function query(sql, params = []) {
  const r = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${database}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credential}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    },
  );
  if (!r.ok) throw new Error(`QA database request failed: HTTP ${r.status}`);
  const body = await r.json();
  if (!body.success || body.result.some((x) => !x.success))
    throw new Error("QA database statement failed.");
  return body.result[0].results;
}
let cookie = "",
  created = false;
async function api(path, body, expected = 200) {
  const response = await fetch(site + "/api/baseline/" + path, {
    method: body ? "POST" : "GET",
    headers: {
      Origin: site,
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  if (response.status !== expected)
    throw new Error(
      `Hosted ${path} failed: expected ${expected}, received ${response.status}`,
    );
  if (path === "access") {
    const value = response.headers.get("set-cookie") ?? "";
    if (
      !/HttpOnly/i.test(value) ||
      !/Secure/i.test(value) ||
      !/SameSite=Strict/i.test(value)
    )
      throw new Error("Hosted session cookie is not secure.");
    cookie = value.split(";")[0];
  }
  return response.json();
}
try {
  await query("INSERT OR IGNORE INTO tb_baseline_versions VALUES(?,?,?)", [
    m.VERSION,
    JSON.stringify(m.QUESTIONNAIRE),
    stamp,
  ]);
  await query(
    "INSERT INTO tb_baseline_campaigns(campaign_id,name,version,status,closes_at,privacy_notice,retention_days,created_at) VALUES(?,?,?,?,?,?,?,?)",
    [
      campaign,
      "Synthetic hosted smoke — " + process.env.GITHUB_RUN_ID,
      m.VERSION,
      "open",
      expires,
      m.PRIVACY,
      30,
      stamp,
    ],
  );
  created = true;
  await query("INSERT INTO tb_baseline_participants VALUES(?,?,?,?,1,?)", [
    participant,
    campaign,
    draft.profile.email,
    JSON.stringify(draft.profile),
    stamp,
  ]);
  await query(
    "INSERT INTO tb_baseline_responses VALUES(?,?,?,0,0,?,?,?,NULL)",
    [
      participant,
      m.VERSION,
      "not_started",
      randomUUID(),
      JSON.stringify(draft),
      stamp,
    ],
  );
  await query("INSERT INTO tb_baseline_invites VALUES(?,?,?,?,NULL,?)", [
    invite,
    participant,
    hash,
    expires,
    stamp,
  ]);
  await query("INSERT INTO tb_baseline_audit VALUES(?,?,?,?,?,?,?)", [
    randomUUID(),
    campaign,
    "qa-workflow",
    "synthetic_test_created",
    participant,
    "{}",
    stamp,
  ]);
  await api("access", { token });
  const initial = await api("response");
  if (initial.draft.profile.email !== "" || initial.revision !== 0)
    throw new Error("Hosted participant metadata privacy failed.");
  draft.privacyAcknowledged = true;
  draft.profile.manages_people = "no";
  draft.scope = { reach: "all_group", entities: [] };
  draft.areas = ["office_01"];
  draft.allocation = { office_01: 100 };
  draft.details = {
    office_01: {
      description: "Synthetic reception work.",
      frequency: "most_days",
      role: "administration_support",
      handoffs: ["local_office"],
      other: "",
    },
  };
  draft.cyclical.answer = "no";
  draft.systems = ["excel"];
  draft.knowledge = ["office_facilities"];
  draft.channels = ["email"];
  draft.channelAllocation = { email: 100 };
  draft.strengths = "Synthetic local knowledge.";
  await api("save", { draft, revision: 0, progress: 7 });
  await api("save", { draft, revision: 0, progress: 7 }, 409);
  const resumed = await api("response");
  if (resumed.revision !== 1 || resumed.draft.strengths !== draft.strengths)
    throw new Error("Hosted autosave/resume failed.");
  await api("submit", { draft, revision: 1, progress: 8 });
  await api("save", { draft, revision: 2, progress: 8 }, 409);
  const rows = await query(
    "SELECT w.pillar,w.percentage,r.status FROM tb_baseline_work w JOIN tb_baseline_responses r USING(participant_id) WHERE w.participant_id=?",
    [participant],
  );
  if (
    rows[0]?.pillar !== "people_operations" ||
    rows[0]?.percentage !== 100 ||
    rows[0]?.status !== "completed"
  )
    throw new Error("Hosted normalized submission failed.");
  await api("logout", {});
  await api("response", undefined, 401);
  console.log(
    "Hosted QA/D1 invitation, secure session, autosave, resume, stale-save protection, submission and logout passed. Synthetic data only; no email.",
  );
} finally {
  if (created)
    await query(
      "UPDATE tb_baseline_campaigns SET status='closed' WHERE campaign_id=?",
      [campaign],
    );
}
