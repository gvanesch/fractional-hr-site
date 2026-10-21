// One reserved QA-only synthetic campaign. Add missing seed rows; never overwrite existing answers.
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url),
  esbuild = require("esbuild");
const account = process.env.CLOUDFLARE_ACCOUNT_ID,
  credential = process.env.CLOUDFLARE_API_TOKEN,
  site = process.env.NEXT_PUBLIC_SITE_URL;
const database = "b25d59da-5f93-4301-9996-7be0c9708789",
  campaign = "cb21a967-99a7-4aa9-b3ae-61c7dff289b1",
  name = "QA Admin Demo — 20 synthetic respondents";
if (
  account !== "73221f18acc676e4992c89fcbf2b2a8f" ||
  !credential ||
  process.env.GITHUB_REF !== "refs/heads/feature/team-blue-baseline" ||
  !/^https:\/\/fractional-hr-site-qa\.[a-z0-9-]+\.workers\.dev$/.test(
    site ?? "",
  )
)
  throw new Error("Reserved QA target and branch required.");
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
  if (!r.ok) throw new Error(`QA seed request failed: HTTP ${r.status}`);
  const body = await r.json();
  if (!body.success || body.result.some((x) => !x.success))
    throw new Error("QA seed database statement failed.");
  return body.result[0].results;
}
const stamp = new Date().toISOString(),
  closes = "2026-12-31T23:59:59.000Z";
const prior = await query(
  "SELECT name,version,status FROM tb_baseline_campaigns WHERE campaign_id=?",
  [campaign],
);
if (prior.length && (prior[0].name !== name || prior[0].version !== m.VERSION))
  throw new Error(
    "Reserved demo campaign differs. No existing work will be changed.",
  );
await query("INSERT OR IGNORE INTO tb_baseline_versions VALUES(?,?,?)", [
  m.VERSION,
  JSON.stringify(m.QUESTIONNAIRE),
  stamp,
]);
const version = await query(
  "SELECT definition_json FROM tb_baseline_versions WHERE version=?",
  [m.VERSION],
);
if (version[0].definition_json !== JSON.stringify(m.QUESTIONNAIRE))
  throw new Error("Frozen questionnaire mismatch.");
await query(
  "INSERT OR IGNORE INTO tb_baseline_campaigns(campaign_id,name,version,status,closes_at,privacy_notice,retention_days,created_at,entities_json) VALUES(?,?,?,?,?,?,?,?,?)",
  [campaign, name, m.VERSION, "open", closes, m.PRIVACY, 90, stamp, "[]"],
);
const regions = ["North", "Central", "South"],
  types = [
    "people_operations",
    "business_partnering",
    "people_technology",
    "reception",
    "facilities",
  ],
  categories = ["ops", "bp", "tech", "office", "office"];
for (let i = 0; i < 20; i++) {
  const index = String(i + 1).padStart(2, "0"),
    id = "d70e6511-f1ea-4fe4-a928-" + String(i + 1).padStart(12, "0"),
    region = regions[i % 3],
    type = types[i % types.length];
  const existing = await query(
    "SELECT campaign_id,email FROM tb_baseline_participants WHERE participant_id=?",
    [id],
  );
  if (
    existing.length &&
    (existing[0].campaign_id !== campaign ||
      existing[0].email !== `qa.person${index}@example.invalid`)
  )
    throw new Error("A reserved participant identifier is in use.");
  const profile = {
    name: `QA Respondent ${index}`,
    email: `qa.person${index}@example.invalid`,
    job_title: [
      "People Operations Specialist",
      "People Business Partner",
      "People Technology Specialist",
      "Reception Coordinator",
      "Office Coordinator",
    ][i % 5],
    country: "GB",
    region: `Demo ${region}`,
    entity: `Demo Entity ${(i % 3) + 1}`,
    work_type: type,
    manages_people: i % 5 === 0 ? "yes" : "no",
    direct_reports: i % 5 === 0 ? "3" : "0",
  };
  const roster = {
    participant_reference: `DEMO-${index}`,
    division: "Demo business",
    brand: `Demo Brand ${(i % 3) + 1}`,
    department: "Demo People",
    team: `Demo ${region} team`,
    location: `Demo office ${(i % 3) + 1}`,
    manager_name: `Demo Line Manager ${region}`,
    manager_email: `line.${region.toLowerCase()}@example.invalid`,
    regional_leader_name: `Demo Leader ${region}`,
    regional_leader_email: `leader.${region.toLowerCase()}@example.invalid`,
    contracted_hours: i % 4 === 0 ? "32" : "40",
    full_time_hours: "40",
    working_fraction: i % 4 === 0 ? "0.8" : "1",
  };
  let draft = m.initialDraft(profile);
  const status = i < 15 ? "completed" : i < 18 ? "in_progress" : "not_started",
    progress = status === "completed" ? 8 : status === "in_progress" ? 3 : 0;
  if (status !== "not_started") {
    const areas = m.AREAS.filter((a) => a.category === categories[i % 5]).slice(
      0,
      2,
    );
    draft.privacyAcknowledged = true;
    draft.scope = { reach: "all_group", entities: [] };
    draft.areas = areas.map((a) => a.code);
    draft.allocation = Object.fromEntries(
      areas.map((a, n) => [a.code, n === 0 ? 60 : 40]),
    );
    draft.details = Object.fromEntries(
      areas.map((a) => [
        a.code,
        {
          description: `Synthetic example: ${a.label}.`,
          frequency: "most_weeks",
          role: "administration_support",
          handoffs: ["people_operations"],
          other: "",
        },
      ]),
    );
    draft.cyclical.answer = "no";
    draft.systems = ["excel"];
    draft.knowledge = ["office_facilities"];
    draft.channels = ["email"];
    draft.channelAllocation = { email: 100 };
    draft.strengths = `Synthetic example of reliable ${region.toLowerCase()} team support.`;
    draft.extraEffort = "Synthetic example of repeated data entry.";
    if (status === "in_progress") {
      draft.details = {};
      draft.cyclical.answer = "";
      draft.systems = [];
      draft.knowledge = [];
      draft.channels = [];
      draft.channelAllocation = {};
      draft.strengths = "";
      draft.extraEffort = "";
    }
  }
  draft = m.parseDraft(draft);
  if (status === "completed" && m.completionError(draft))
    throw new Error(
      "Synthetic complete response did not validate: " +
        m.completionError(draft),
    );
  await query(
    "INSERT OR IGNORE INTO tb_baseline_participants VALUES(?,?,?,?,1,?)",
    [id, campaign, profile.email, JSON.stringify(draft.profile), stamp],
  );
  await query(
    "INSERT OR IGNORE INTO tb_baseline_roster_details VALUES(?,?,?)",
    [id, JSON.stringify(roster), stamp],
  );
  await query(
    "INSERT OR IGNORE INTO tb_baseline_responses VALUES(?,?,?,?,?,?,?,?,?)",
    [
      id,
      m.VERSION,
      status,
      progress,
      status === "not_started" ? 0 : 1,
      randomUUID(),
      JSON.stringify(draft),
      stamp,
      status === "completed" ? stamp : null,
    ],
  );
  for (const code of draft.areas) {
    const a = m.AREAS.find((a) => a.code === code);
    await query(
      "INSERT OR IGNORE INTO tb_baseline_work VALUES(?,?,?,?,?,?,?)",
      [
        id,
        code,
        a.label,
        a.category,
        m.areaPillar(a.category, code),
        draft.allocation[code],
        JSON.stringify(draft.details[code] ?? {}),
      ],
    );
  }
  const invite = await query(
    "SELECT invite_id FROM tb_baseline_invites WHERE participant_id=? LIMIT 1",
    [id],
  );
  if (!invite.length) {
    const hash = createHash("sha256").update(randomBytes(32)).digest("hex");
    await query("INSERT INTO tb_baseline_invites VALUES(?,?,?,?,NULL,?)", [
      randomUUID(),
      id,
      hash,
      closes,
      stamp,
    ]);
  }
}
const rows = await query(
  "SELECT r.status,COUNT(*) AS count FROM tb_baseline_responses r JOIN tb_baseline_participants p USING(participant_id) WHERE p.campaign_id=? GROUP BY r.status",
  [campaign],
);
const counts = Object.fromEntries(rows.map((r) => [r.status, r.count]));
if (
  counts.completed !== 15 ||
  counts.in_progress !== 3 ||
  counts.not_started !== 2
)
  throw new Error(
    "The demo has been changed. Existing answers were preserved; expected 15/3/2 counts were not found.",
  );
const missing = await query(
  "SELECT COUNT(*) AS n FROM tb_baseline_participants p LEFT JOIN tb_baseline_roster_details m USING(participant_id) WHERE p.campaign_id=? AND (m.participant_id IS NULL OR json_extract(m.metadata_json,'$.regional_leader_email') IS NULL)",
  [campaign],
);
if (missing[0].n) throw new Error("Demo leader assignments are incomplete.");
await query("INSERT INTO tb_baseline_audit VALUES(?,?,?,?,?,?,?)", [
  randomUUID(),
  campaign,
  "qa-demo-seed",
  "synthetic_demo_verified",
  campaign,
  JSON.stringify({
    completed: 15,
    inProgress: 3,
    notStarted: 2,
    emailSent: false,
  }),
  stamp,
]);
console.log(
  JSON.stringify({
    campaign,
    name,
    completed: 15,
    inProgress: 3,
    notStarted: 2,
    emailSent: false,
    productionChanged: false,
  }),
);
