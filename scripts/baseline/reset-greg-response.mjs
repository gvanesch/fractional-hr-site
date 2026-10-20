// One-off, explicitly authorised reset of Greg's two test responses. No mail or invite changes.
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
export const targets = [
  [
    "55000001-2026-4017-8040-000000000002",
    "55000001-2026-4017-8040-000000000001",
    "greg@vanesch.uk",
  ],
  [
    "55000003-2026-4019-8040-000000000002",
    "55000003-2026-4019-8040-000000000001",
    "greg.vanesch@team.blue",
  ],
];
export function resetStatements(row, draft, stamp, event, mutation) {
  const id = row.participant_id;
  const gate =
    "EXISTS(SELECT 1 FROM tb_baseline_responses WHERE participant_id=? AND mutation_id=?)";
  return [
    {
      sql: "INSERT INTO tb_baseline_audit SELECT ?,?,'Greg van Esch','test_answers_reset',?,json_object('previousDraft',json(draft_json),'previousStatus',status,'previousRevision',revision,'previousSubmittedAt',submitted_at),? FROM tb_baseline_responses WHERE participant_id=? AND revision=?",
      params: [event, row.campaign_id, id, stamp, id, row.revision],
    },
    {
      sql: "UPDATE tb_baseline_responses SET status='not_started',progress=0,revision=revision+1,mutation_id=?,draft_json=?,updated_at=?,submitted_at=NULL WHERE participant_id=? AND revision=?",
      params: [mutation, JSON.stringify(draft), stamp, id, row.revision],
    },
    ...[
      "tb_baseline_work",
      "tb_baseline_broad_work",
      "tb_baseline_collection_context",
      "tb_baseline_answer_copies",
      "tb_baseline_sessions",
    ].map((table) => ({
      sql: `DELETE FROM ${table} WHERE participant_id=? AND ${gate}`,
      params: [id, id, mutation],
    })),
    {
      sql: `UPDATE tb_baseline_verifications SET consumed_at=? WHERE invite_id IN (SELECT invite_id FROM tb_baseline_invites WHERE participant_id=?) AND consumed_at IS NULL AND ${gate}`,
      params: [stamp, id, id, mutation],
    },
  ];
}
async function main() {
  const a = JSON.parse(
    await readFile("scripts/baseline/reset-greg-approval.json", "utf8"),
  );
  const account = "73221f18acc676e4992c89fcbf2b2a8f",
    database = "b81b99d7-4b10-4f7e-a0c1-ada3adf596fc";
  const age = Date.now() - Date.parse(a.confirmedAt);
  if (
    process.env.GITHUB_REPOSITORY !== "gvanesch/fractional-hr-site" ||
    process.env.GITHUB_REF !== "refs/heads/migration/d1" ||
    !process.env.CLOUDFLARE_API_TOKEN ||
    a.approvedBy !== "Greg van Esch" ||
    a.scope !== "reset-only-greg-test-answers" ||
    a.databaseId !== database ||
    a.sendEmail !== false ||
    !Number.isFinite(age) ||
    age < 0 ||
    age > 86400000 ||
    JSON.stringify(a.targets) !== JSON.stringify(targets)
  )
    throw Error("Exact current Greg reset approval required");
  if (
    execFileSync("git", ["rev-parse", "HEAD^"], { encoding: "utf8" }).trim() !==
      a.reviewedCommit ||
    execFileSync("git", ["diff", "--name-only", "HEAD^", "HEAD"], {
      encoding: "utf8",
    }).trim() !== "scripts/baseline/reset-greg-approval.json"
  )
    throw Error(
      "Reset approval must be the only change above reviewed production code",
    );
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
    if (!r.ok) throw Error("Production reset request failed: HTTP " + r.status);
    const b = await r.json();
    if (!b.success) throw Error("Production reset request rejected");
    return b.result;
  }
  async function query(sql, params = []) {
    const result = await cf(`d1/database/${database}/query`, { sql, params });
    if (result.some((r) => !r.success))
      throw Error("Production reset query failed");
    return result[0].results;
  }
  const settings = await cf("workers/scripts/fractional-hr-site/settings");
  const bindings = new Map(settings.bindings.map((b) => [b.name, b]));
  const live = await cf("workers/scripts/fractional-hr-site/deployments");
  if (
    (bindings.get("DB")?.id ?? bindings.get("DB")?.database_id) !== database ||
    bindings.get("BASELINE_MAIL_MODE")?.text !== "send" ||
    live.deployments?.[0]?.versions?.[0]?.version_id !== a.expectedVersionId
  )
    throw Error("Production database/version/settings differ");
  const require = createRequire(import.meta.url),
    built = await require("esbuild").build({
      stdin: {
        contents:
          'export {initialCollection} from "./lib/baseline/collection";',
        resolveDir: process.cwd(),
      },
      bundle: true,
      platform: "node",
      format: "cjs",
      write: false,
    });
  const m = { exports: {} };
  new Function("module", "exports", built.outputFiles[0].text)(m, m.exports);
  const countsBefore = await query(
    "SELECT (SELECT count(*) FROM tb_baseline_participants) participants,(SELECT count(*) FROM tb_baseline_responses) responses,(SELECT count(*) FROM tb_baseline_invites) invites",
  );
  for (const [id, campaign, email] of targets) {
    const event = "greg-reset-2026-10-20-" + id;
    if (
      (
        await query("SELECT event_id FROM tb_baseline_audit WHERE event_id=?", [
          event,
        ])
      ).length
    ) {
      console.log(
        JSON.stringify({ email, result: "already reset; no repeat mutation" }),
      );
      continue;
    }
    const rows = await query(
      "SELECT r.*,p.campaign_id,p.email,p.active FROM tb_baseline_responses r JOIN tb_baseline_participants p USING(participant_id) WHERE r.participant_id=?",
      [id],
    );
    const row = rows[0];
    if (
      rows.length !== 1 ||
      row.campaign_id !== campaign ||
      row.email.toLowerCase() !== email ||
      row.active !== 1 ||
      !["team-blue-baseline-v4", "team-blue-baseline-v5"].includes(row.version)
    )
      throw Error("Greg test identity/version differs");
    const draft = m.exports.initialCollection(row.version),
      stamp = new Date().toISOString(),
      mutation = randomUUID();
    console.log(
      JSON.stringify({
        email,
        campaign,
        previousStatus: row.status,
        previousRevision: row.revision,
        action: "reset own test answers; retain invitation and audit snapshot",
      }),
    );
    const result = await cf(`d1/database/${database}/query`, {
      batch: resetStatements(row, draft, stamp, event, mutation),
    });
    if (
      result.some((r) => !r.success) ||
      result[0].meta.changes !== 1 ||
      result[1].meta.changes !== 1
    )
      throw Error("Reset was not confirmed; inspect before retry");
    const check = (
      await query(
        "SELECT status,progress,revision,draft_json,submitted_at FROM tb_baseline_responses WHERE participant_id=?",
        [id],
      )
    )[0];
    const children = (
      await query(
        "SELECT (SELECT count(*) FROM tb_baseline_broad_work WHERE participant_id=?) work,(SELECT count(*) FROM tb_baseline_sessions WHERE participant_id=?) sessions,(SELECT count(*) FROM tb_baseline_answer_copies WHERE participant_id=?) copies",
        [id, id, id],
      )
    )[0];
    if (
      check.status !== "not_started" ||
      check.progress !== 0 ||
      check.revision !== row.revision + 1 ||
      check.draft_json !== JSON.stringify(draft) ||
      check.submitted_at !== null ||
      Object.values(children).some((n) => n !== 0)
    )
      throw Error("Reset verification failed");
    console.log(
      JSON.stringify({
        email,
        result: "verified empty; existing invitation retained; no email sent",
        revision: check.revision,
      }),
    );
  }
  const countsAfter = await query(
    "SELECT (SELECT count(*) FROM tb_baseline_participants) participants,(SELECT count(*) FROM tb_baseline_responses) responses,(SELECT count(*) FROM tb_baseline_invites) invites",
  );
  if (JSON.stringify(countsBefore) !== JSON.stringify(countsAfter))
    throw Error("Population or invitation counts changed unexpectedly");
  console.log(
    "Greg reset verified. Population and invitations preserved. No email sent.",
  );
}
if (
  process.argv[1] &&
  import.meta.url === new URL(process.argv[1], "file:").href
)
  await main();
