const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  { DatabaseSync } = require("node:sqlite"),
  fs = require("node:fs"),
  path = require("node:path");
async function fixture() {
  const { resetStatements } =
    await import("../../scripts/baseline/reset-greg-response.mjs");
  const db = new DatabaseSync(":memory:");
  for (const name of [
    "0001_baseline.sql",
    "0002_campaign_entities.sql",
    "0003_administration.sql",
    "0004_reviewed_collection.sql",
  ])
    db.exec(
      fs.readFileSync(
        path.join(__dirname, "../../baseline-migrations", name),
        "utf8",
      ),
    );
  db.exec(
    "INSERT INTO tb_baseline_versions VALUES('v','{}','now'); INSERT INTO tb_baseline_campaigns VALUES('c','test','v','open','future','notice',730,'now','[]')",
  );
  for (const id of ["greg", "other"]) {
    db.prepare(
      "INSERT INTO tb_baseline_participants VALUES(?,'c',?,'{}',1,'now')",
    ).run(id, id + "@example.invalid");
    db.prepare(
      "INSERT INTO tb_baseline_responses VALUES(?,'v','completed',8,9,'old','{\"started\":true,\"answer\":\"old\"}','now','now')",
    ).run(id);
    db.prepare(
      "INSERT INTO tb_baseline_invites VALUES(?,?,?,'future',NULL,'now')",
    ).run(id, id, id);
    db.prepare(
      "INSERT INTO tb_baseline_sessions VALUES(?,?,?,'future','now')",
    ).run(id, id, id);
    db.prepare(
      "INSERT INTO tb_baseline_verifications VALUES(?,?,'hash','future',0,NULL,'now')",
    ).run(id, id);
    db.prepare(
      "INSERT INTO tb_baseline_broad_work VALUES(?,'area','Area',100,'{}')",
    ).run(id);
    db.prepare(
      "INSERT INTO tb_baseline_answer_copies VALUES(?,'v',?,'sent',1,'now')",
    ).run(id, id + "@example.invalid");
  }
  return { db, resetStatements };
}
test("Reset clears only the authorised respondent, archives answers, increases revision and retains invitation", async () => {
  const { db, resetStatements } = await fixture();
  const statements = resetStatements(
    { participant_id: "greg", campaign_id: "c", revision: 9 },
    { started: false },
    "later",
    "event",
    "reset",
  );
  db.exec("BEGIN");
  for (const { sql, params } of statements) db.prepare(sql).run(...params);
  db.exec("COMMIT");
  const g = db
    .prepare("SELECT * FROM tb_baseline_responses WHERE participant_id='greg'")
    .get();
  assert.equal(g.status, "not_started");
  assert.equal(g.revision, 10);
  assert.equal(g.progress, 0);
  assert.equal(g.submitted_at, null);
  assert.deepEqual(JSON.parse(g.draft_json), { started: false });
  for (const table of [
    "tb_baseline_sessions",
    "tb_baseline_broad_work",
    "tb_baseline_answer_copies",
  ]) {
    assert.equal(
      db
        .prepare(`SELECT count(*) n FROM ${table} WHERE participant_id='greg'`)
        .get().n,
      0,
    );
    assert.equal(
      db
        .prepare(`SELECT count(*) n FROM ${table} WHERE participant_id='other'`)
        .get().n,
      1,
    );
  }
  assert.equal(
    db
      .prepare(
        "SELECT status FROM tb_baseline_responses WHERE participant_id='other'",
      )
      .get().status,
    "completed",
  );
  assert.equal(
    db
      .prepare(
        "SELECT count(*) n FROM tb_baseline_invites WHERE revoked_at IS NULL",
      )
      .get().n,
    2,
  );
  assert.equal(
    db
      .prepare(
        "SELECT consumed_at FROM tb_baseline_verifications WHERE challenge_id='greg'",
      )
      .get().consumed_at,
    "later",
  );
  assert.equal(
    db
      .prepare(
        "SELECT consumed_at FROM tb_baseline_verifications WHERE challenge_id='other'",
      )
      .get().consumed_at,
    null,
  );
  const audit = JSON.parse(
    db
      .prepare(
        "SELECT metadata_json FROM tb_baseline_audit WHERE event_id='event'",
      )
      .get().metadata_json,
  );
  assert.equal(audit.previousDraft.answer, "old");
  assert.equal(audit.previousRevision, 9);
  db.close();
});
test("A stale reset revision cannot clear answers, sessions or delivery records", async () => {
  const { db, resetStatements } = await fixture();
  for (const { sql, params } of resetStatements(
    { participant_id: "greg", campaign_id: "c", revision: 8 },
    { started: false },
    "later",
    "event",
    "reset",
  ))
    db.prepare(sql).run(...params);
  assert.equal(
    db
      .prepare(
        "SELECT status FROM tb_baseline_responses WHERE participant_id='greg'",
      )
      .get().status,
    "completed",
  );
  assert.equal(
    db.prepare("SELECT count(*) n FROM tb_baseline_audit").get().n,
    0,
  );
  assert.equal(
    db.prepare("SELECT count(*) n FROM tb_baseline_answer_copies").get().n,
    2,
  );
  assert.equal(
    db.prepare("SELECT count(*) n FROM tb_baseline_sessions").get().n,
    2,
  );
  db.close();
});
