// Read-only production checkpoint. Never print binding values, credentials or data rows.
const account = "73221f18acc676e4992c89fcbf2b2a8f",
  database = "b81b99d7-4b10-4f7e-a0c1-ada3adf596fc";
if (
  process.env.GITHUB_REF !== "refs/heads/feature/team-blue-baseline" ||
  process.env.CLOUDFLARE_ACCOUNT_ID !== account ||
  !process.env.CLOUDFLARE_API_TOKEN
)
  throw Error("Read-only audit target unavailable");
const headers = { Authorization: "Bearer " + process.env.CLOUDFLARE_API_TOKEN };
const r = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/fractional-hr-site/settings`,
  { headers },
);
if (!r.ok) throw Error("Production settings read failed: HTTP " + r.status);
const b = await r.json();
if (!b.success || !Array.isArray(b.result?.bindings))
  throw Error("Invalid settings");
const map = new Map(b.result.bindings.map((x) => [x.name, x]));
for (const n of [
  "D1_SYSTEM_EVENTS_MODE",
  "D1_DIAGNOSTIC_SUBMISSIONS_MODE",
  "D1_CRM_PROSPECTS_MODE",
  "D1_CLIENT_DIAGNOSTIC_MODE",
  "D1_CLIENT_DIAGNOSTIC_SECURITY_MODE",
]) {
  const value = map.get(n)?.text ?? "off";
  if (!["off", "d1"].includes(value)) throw Error("Unknown production mode");
  console.log(n + ": " + value);
}
console.log(
  "Production D1 binding matches expected database: " +
    ((map.get("DB")?.id ?? map.get("DB")?.database_id) === database),
);
console.log(
  "Production advisor authentication: " +
    (map.get("ADVISOR_AUTH_MODE")?.text === "cloudflare_access"
      ? "Cloudflare Access"
      : "Supabase / existing login"),
);
const sql = "SELECT name FROM d1_migrations ORDER BY id";
const q = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${database}/query`,
  {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ sql, params: [] }),
  },
);
if (!q.ok)
  throw Error("Production migration history read failed: HTTP " + q.status);
const history = await q.json();
if (!history.success || history.result?.some((x) => !x.success))
  throw Error("Migration history unavailable");
for (const row of history.result[0].results)
  if (/^\d{4}[_a-z0-9.-]+\.sql$/i.test(row.name))
    console.log("Applied production migration: " + row.name);
console.log(
  "Read-only checkpoint complete. No production writes or deployment performed.",
);

// Aggregate-only launch integrity check. Never select raw answers, identities, tokens or participant-level metadata.
const campaign = "9b873840-9a11-4a45-b0c6-87ada4162d40";
async function aggregate(sql) {
  if (!/^SELECT\b/i.test(sql) || /;/.test(sql)) throw Error("Only a single SELECT is permitted");
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${database}/query`,
    { method: "POST", headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ sql, params: [campaign] }), signal: AbortSignal.timeout(20000) },
  );
  if (!response.ok) throw Error("Aggregate integrity read unavailable");
  const result = await response.json();
  if (!result.success || result.result.some((x) => !x.success)) throw Error("Aggregate query failed");
  return result.result[0].results;
}
const results = {};
results.roster = await aggregate("SELECT count(*) AS active,count(r.participant_id) AS response_rows,sum(EXISTS(SELECT 1 FROM tb_baseline_invites i WHERE i.participant_id=p.participant_id)) AS invited,sum(EXISTS(SELECT 1 FROM tb_baseline_roster_details m WHERE m.participant_id=p.participant_id)) AS roster_details FROM tb_baseline_participants p LEFT JOIN tb_baseline_responses r USING(participant_id) WHERE p.campaign_id=? AND p.active=1");
results.statuses = await aggregate("SELECT r.status,count(*) AS n FROM tb_baseline_participants p JOIN tb_baseline_responses r USING(participant_id) WHERE p.campaign_id=? AND p.active=1 GROUP BY r.status");
results.completedIntegrity = await aggregate("SELECT count(*) AS completed,sum(r.version=c.version AND json_extract(r.draft_json,'$.version')=r.version) AS matching_versions,sum(r.progress=8 AND r.submitted_at IS NOT NULL AND r.updated_at=r.submitted_at) AS valid_submission_state,sum(json_extract(r.draft_json,'$.started')=1) AS privacy_acknowledged,sum(EXISTS(SELECT 1 FROM tb_baseline_collection_context x WHERE x.participant_id=p.participant_id)) AS saved_context,sum((SELECT count(*) FROM tb_baseline_audit a WHERE a.campaign_id=p.campaign_id AND a.subject_id=p.participant_id AND a.action='submitted')=1) AS single_submission_audit,sum(EXISTS(SELECT 1 FROM tb_baseline_verifications v JOIN tb_baseline_invites i USING(invite_id) WHERE i.participant_id=p.participant_id AND v.consumed_at IS NOT NULL)) AS verified_access FROM tb_baseline_participants p JOIN tb_baseline_responses r USING(participant_id) JOIN tb_baseline_campaigns c USING(campaign_id) WHERE p.campaign_id=? AND r.status='completed'");
results.workIntegrity = await aggregate("SELECT count(*) AS completed,sum(json_array_length(r.draft_json,'$.broad.selected')=(SELECT count(*) FROM tb_baseline_broad_work w WHERE w.participant_id=p.participant_id)) AS matching_work_row_counts,sum(NOT EXISTS(SELECT 1 FROM tb_baseline_broad_work w WHERE w.participant_id=p.participant_id AND (NOT EXISTS(SELECT 1 FROM json_each(r.draft_json,'$.broad.selected') s WHERE s.value=w.area_code) OR w.percentage IS NOT json_extract(r.draft_json,'$.broad.time.'||w.area_code) OR json_extract(w.detail_json,'$.note') IS NOT COALESCE(json_extract(r.draft_json,'$.broad.notes.'||w.area_code),'')))) AS matching_work_details,sum(ABS(COALESCE((SELECT sum(w.percentage) FROM tb_baseline_broad_work w WHERE w.participant_id=p.participant_id),0)-100)<0.01) AS work_time_totals_100 FROM tb_baseline_participants p JOIN tb_baseline_responses r USING(participant_id) WHERE p.campaign_id=? AND r.status='completed'");
results.copyRequests = await aggregate("SELECT count(*) AS completed,sum(json_extract(r.draft_json,'$.answerCopy')=1) AS requested,sum(EXISTS(SELECT 1 FROM tb_baseline_answer_copies a WHERE a.participant_id=p.participant_id AND lower(a.recipient_email)=lower(p.email))) AS correctly_addressed_copy_rows FROM tb_baseline_participants p JOIN tb_baseline_responses r USING(participant_id) WHERE p.campaign_id=? AND r.status='completed'");
results.copyDelivery = await aggregate("SELECT a.status,count(*) AS n,max(a.attempts) AS max_attempts FROM tb_baseline_answer_copies a JOIN tb_baseline_participants p USING(participant_id) WHERE p.campaign_id=? GROUP BY a.status");
results.invitationBatches = await aggregate("SELECT count(*) AS batches,sum(COALESCE(json_extract(metadata_json,'$.sent'),0)) AS provider_accepted,sum(COALESCE(json_extract(metadata_json,'$.failed'),0)) AS failed FROM tb_baseline_audit WHERE campaign_id=? AND action='invitation_batch_finished'");
console.log(JSON.stringify({checkedAt:new Date().toISOString(),...results,productionWrites:false,emailSentByCheck:false,individualDataSelected:false},null,2));
