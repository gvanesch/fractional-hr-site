// Authenticated HTTP/D1 contract fixture for the reviewed collection. Synthetic QA only; no email.
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url),
  esbuild = require("esbuild"),
  account = "73221f18acc676e4992c89fcbf2b2a8f",
  database = "b25d59da-5f93-4301-9996-7be0c9708789",
  credential = process.env.CLOUDFLARE_API_TOKEN,
  site = process.env.NEXT_PUBLIC_SITE_URL;
if (
  process.env.GITHUB_REF !== "refs/heads/feature/team-blue-baseline" ||
  process.env.CLOUDFLARE_ACCOUNT_ID !== account ||
  !credential ||
  !/^https:\/\/fractional-hr-site-qa\.[a-z0-9-]+\.workers\.dev$/.test(
    site ?? "",
  )
)
  throw Error("Reviewed contract fixture requires the isolated QA target");
const built = await esbuild.build({
    entryPoints: [
      new URL("../../lib/baseline/collection.ts", import.meta.url).pathname,
    ],
    bundle: true,
    platform: "node",
    format: "cjs",
    write: false,
  }),
  module = { exports: {} };
new Function("module", "exports", built.outputFiles[0].text)(
  module,
  module.exports,
);
const m = module.exports;
const version = process.env.BASELINE_COLLECTION_VERSION || m.COLLECTION_VERSION;
const frozen = m.isRevisedCollection(version);
const expanded = version === m.DEPTH_COLLECTION_VERSION;
if (!m.isCollectionVersion(version)) throw Error("Unsupported QA collection version");
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
  if (!r.ok)
    throw Error("Reviewed QA database request failed: HTTP " + r.status);
  const b = await r.json();
  if (!b.success || b.result.some((x) => !x.success))
    throw Error("Reviewed QA fixture statement failed");
  return b.result[0].results;
}
const campaign = randomUUID(),
  participant = randomUUID(),
  invite = randomUUID(),
  token = randomBytes(32).toString("hex"),
  session = randomBytes(32).toString("hex"),
  hash = (v) => createHash("sha256").update(v).digest("hex"),
  stamp = new Date().toISOString(),
  expires = new Date(Date.now() + 3600000).toISOString();
let cookie = "";
async function api(path, body, expected = 200) {
  const r = await fetch(site + "/api/baseline/" + path, {
    method: body ? "POST" : "GET",
    headers: {
      Origin: site,
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  if (r.status !== expected)
    throw Error(
      "Reviewed hosted " +
        path +
        " expected " +
        expected +
        ", received " +
        r.status,
    );
  if (expected !== 200) {
    await r.body?.cancel();
    return null;
  }
  return r.json();
}
try {
  await query("INSERT OR IGNORE INTO tb_baseline_versions VALUES(?,?,?)", [
    version,
    JSON.stringify(m.collectionDefinitionFor(version)),
    stamp,
  ]);
  await query("INSERT INTO tb_baseline_campaigns VALUES(?,?,?,?,?,?,?,?,?)", [
    campaign,
    "Reviewed hosted QA — synthetic contract",
    version,
    "open",
    expires,
    "Synthetic QA data only. These answers test versioned saving and access boundaries. Production remains awaiting approval.",
    90,
    stamp,
    "[]",
  ]);
  await query("INSERT INTO tb_baseline_participants VALUES(?,?,?,?,1,?)", [
    participant,
    campaign,
    "reviewed-hosted@example.invalid",
    JSON.stringify({
      name: "Synthetic reviewed QA",
      email: "reviewed-hosted@example.invalid",
      country: "GB",
      region: "QA",
      work_type: "reception",
      manages_people: frozen ? "yes" : "no",
      direct_reports: frozen ? "3" : "0",
    }),
    stamp,
  ]);
  await query("INSERT INTO tb_baseline_roster_details VALUES(?,?,?)", [
    participant,
    "{}",
    stamp,
  ]);
  const draft = m.initialCollection(version);
  await query(
    "INSERT INTO tb_baseline_responses VALUES(?,?,?,0,0,?,?,?,NULL)",
    [
      participant,
      version,
      "not_started",
      randomUUID(),
      JSON.stringify(draft),
      stamp,
    ],
  );
  await query("INSERT INTO tb_baseline_invites VALUES(?,?,?,?,NULL,?)", [
    invite,
    participant,
    hash(token),
    expires,
    stamp,
  ]);
  await api("access", { token }, 403);
  await api("response", undefined, 401);
  await api("request-code", { token }, 403);
  // The fixture creates only its own QA session through the privileged QA database connection.
  await query("INSERT INTO tb_baseline_sessions VALUES(?,?,?,?,?)", [
    hash(session),
    participant,
    invite,
    expires,
    stamp,
  ]);
  cookie = "__Host-tb_baseline=" + session;
  const initial = await api("response");
  if (
    initial.draft.version !== version ||
    "profile" in initial.draft ||
    "email" in initial.campaign
  )
    throw Error("Reviewed response metadata privacy failed");
  draft.started = true;
  draft.broad.selected = frozen ? ["office", "people_management"] : ["office"];
  draft.broad.time = frozen ? { office: 80, people_management: 20 } : { office: 100 };
  if (frozen) draft.managementTime = { time: { coordination: 25, individual: 50, hiring: 15, administration: 10, other: 0 }, uncertain: false, other: "" };
  if (expanded) require("./depth-fixture.cjs").fillDepth(draft);
  await api("save", { draft, revision: 0, progress: 1 });
  await api("save", { draft, revision: 0, progress: 1 }, 409);
  const resumed = await api("response");
  if (resumed.revision !== 1 || resumed.draft.broad.time.office !== (frozen ? 80 : 100))
    throw Error("Reviewed hosted autosave/resume failed");
  if (expanded && !require("node:util").isDeepStrictEqual(resumed.draft.depth, draft.depth)) throw Error("Detailed evidence did not survive hosted save/resume");
  if (frozen && JSON.stringify(resumed.draft.managementTime) !== JSON.stringify(draft.managementTime))
    throw Error("Frozen management time did not survive hosted save/resume");
  Object.assign(draft.rich, {
    routes: ["work_email"],
    routeTime: { work_email: 100 },
    recording: "none",
    duplicates: "rarely",
    sameRoutes: "same",
    scope: "one",
    localNeeds: frozen ? [] : ["none"],
    systems: ["excel"],
  });
  draft.answerCopy = true;
  await api(
    "save",
    {
      draft: { ...draft, profile: { email: "outside@example.invalid" } },
      revision: 1,
      progress: 7,
    },
    400,
  );
  await api("submit", { draft, revision: 1, progress: 8 });
  await api("save", { draft, revision: 2, progress: 7 }, 409);
  const rows = await query(
    "SELECT w.area_code,w.percentage,r.status,a.status AS copy_status FROM tb_baseline_broad_work w JOIN tb_baseline_responses r USING(participant_id) JOIN tb_baseline_answer_copies a USING(participant_id) WHERE w.participant_id=?",
    [participant],
  );
  if (
    !rows.some(row => row.area_code === "office" && row.percentage === (frozen ? 80 : 100)) ||
    rows[0]?.status !== "completed" ||
    rows[0]?.copy_status !== "preview"
  )
    throw Error("Reviewed normalized submission/copy preview failed");
  await api("logout", {});
  cookie = "";
  await api("response", undefined, 401);
  await query("INSERT INTO tb_baseline_audit VALUES(?,?,?,?,?,?,?)", [
    randomUUID(),
    campaign,
    "qa-workflow",
    "reviewed_contract_verified",
    participant,
    JSON.stringify({
      version: version,
      commit: process.env.GITHUB_SHA,
      saveResume: true,
      submission: true,
      emailSent: false,
    }),
    stamp,
  ]);
  console.log(
    `Real reviewed ${version} QA HTTP/D1 contract passed: verification required, synthetic recipients blocked from mail, private metadata, CAS save/resume, immutable submission, normalized work and preview-only answer copies. No emails sent.`,
  );
} finally {
  await query(
    "UPDATE tb_baseline_campaigns SET status='closed' WHERE campaign_id=?",
    [campaign],
  );
  await query("DELETE FROM tb_baseline_sessions WHERE participant_id=?", [
    participant,
  ]);
}
