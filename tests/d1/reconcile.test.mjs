import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import {
  canonicalRow,
  hashRows,
  reconcileRows,
  makeUpsert,
} from "../../scripts/d1/reconcile-production.mjs";

test("production delta comparison is deterministic and generated upserts are idempotent", () => {
  const db = new DatabaseSync(":memory:");
  try {
    db.exec(
      readFileSync(
        new URL(
          "../../migrations/0001_create_system_events.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    const columns = [
      "event_id",
      "event_type",
      "status",
      "submission_id",
      "public_token",
      "source",
      "metadata",
      "created_at",
    ];
    const source = [
      {
        event_id: "e1",
        event_type: "contact",
        status: "success",
        submission_id: null,
        public_token: null,
        source: null,
        metadata: { a: 1, b: 2 },
        created_at: "2026-09-28T08:00:00+00:00",
      },
      {
        event_id: "e2",
        event_type: "health",
        status: "success",
        submission_id: null,
        public_token: null,
        source: null,
        metadata: { ok: true },
        created_at: "2026-09-28T08:01:00Z",
      },
    ];
    const target = [
      {
        ...source[0],
        metadata: '{"b":2,"a":1}',
        created_at: "2026-09-28T08:00:00.000Z",
      },
      { ...source[1], event_type: "old" },
      { ...source[1], event_id: "e3" },
    ];
    assert.equal(
      hashRows([source[1], source[0]], columns, "event_id"),
      hashRows(source, columns, "event_id"),
    );
    assert.deepEqual(
      canonicalRow(source[0], columns),
      canonicalRow(target[0], columns),
    );
    const result = reconcileRows(source, target, columns, "event_id");
    assert.deepEqual(result.missing, []);
    assert.deepEqual(result.changed, ["e2"]);
    assert.deepEqual(result.unexpected, ["e3"]);
    const statement = makeUpsert(
      "system_events",
      "event_id",
      columns,
      source[1],
    );
    db.exec(statement);
    db.exec(statement);
    assert.equal(db.prepare("SELECT count(*) n FROM system_events").get().n, 1);
    assert.equal(
      db.prepare("SELECT event_type FROM system_events").get().event_type,
      "health",
    );
    assert.throws(() =>
      makeUpsert(
        "bad;DROP TABLE system_events",
        "event_id",
        columns,
        source[0],
      ),
    );
  } finally {
    db.close();
  }
});
