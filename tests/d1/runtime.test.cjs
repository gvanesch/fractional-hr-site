// Synthetic integration tests: real SQLite schema/SQL, application route handlers,
// mocked Cloudflare binding/auth context and email transport. No external calls.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const { randomUUID } = require("node:crypto");
const root = path.resolve(__dirname, "../..");

function harness() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  for (const name of fs
    .readdirSync(path.join(root, "migrations"))
    .filter((n) => n.endsWith(".sql"))
    .sort()) {
    sqlite.exec(fs.readFileSync(path.join(root, "migrations", name), "utf8"));
  }
  const db = {
    prepare(sql) {
      const statement = sqlite.prepare(sql);
      let values = [];
      return {
        bind(...args) {
          assert.ok(args.length <= 100, "D1 parameter limit");
          values = args;
          return this;
        },
        async first(column) {
          const row = statement.get(...values) ?? null;
          return column ? row?.[column] : row;
        },
        async all() {
          return { results: statement.all(...values), success: true };
        },
        async run() {
          const result = statement.run(...values);
          return { success: true, meta: { changes: Number(result.changes) } };
        },
      };
    },
    async batch(statements) {
      sqlite.exec("BEGIN");
      try {
        const result = [];
        for (const s of statements) result.push(await s.run());
        sqlite.exec("COMMIT");
        return result;
      } catch (e) {
        sqlite.exec("ROLLBACK");
        throw e;
      }
    },
  };
  const state = { authorized: true, messages: [], supabaseCalls: 0 };
  const env = { DB: db };
  for (const key of [
    "SYSTEM_EVENTS",
    "DIAGNOSTIC_SUBMISSIONS",
    "CRM_PROSPECTS",
    "CLIENT_DIAGNOSTIC",
    "CLIENT_DIAGNOSTIC_SECURITY",
  ])
    env[`D1_${key}_MODE`] = "d1";
  const processEnv = {
    ADVISOR_AUTH_MODE: "cloudflare_access",
    ADVISOR_ALLOWED_EMAILS: "advisor@example.invalid",
    CRON_SECRET: "synthetic-secret",
    DAILY_SUMMARY_RECIPIENT: "advisor@example.invalid",
    RESEND_API_KEY: "re_test",
    CONTACT_FROM_EMAIL: "test@example.invalid",
    CONTACT_TO_EMAIL: "advisor@example.invalid",
    NEXT_PUBLIC_SITE_URL: "https://qa.example.invalid",
    CLIENT_DIAGNOSTIC_OTP_SECRET: "synthetic-otp-secret",
  };
  const denied = () => {
    state.supabaseCalls++;
    throw new Error("Unexpected Supabase access in D1 mode");
  };
  const overrides = {
    "@opennextjs/cloudflare": { getCloudflareContext: () => ({ env }) },
    "@/lib/supabase/admin": { createSupabaseAdminClient: () => state.supabaseClient ?? denied() },
    "@/lib/supabase/server": { createSupabaseServerClient: denied },
    "@/lib/advisor-auth": {
      requireAdvisorUser: async () =>
        state.authorized ? { email: "advisor@example.invalid" } : null,
      authenticateAdvisorRequest: async () =>
        state.authorized ? { email: "advisor@example.invalid" } : null,
    },
    resend: {
      Resend: class {
        emails = {
          send: async (message) => {
            state.messages.push(message);
            return { data: { id: "synthetic" }, error: null };
          },
        };
      },
    },
    "next/server": {
      NextResponse: {
        json: Response.json,
        next: () => new Response(null),
        redirect: (url) => Response.redirect(url),
      },
    },
  };
  const cache = new Map();
  function load(file) {
    file = path.resolve(root, file);
    if (!path.extname(file)) file += ".ts";
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText;
    const localRequire = (name) => {
      if (overrides[name]) return overrides[name];
      if (name.startsWith("@/")) return load(name.slice(2));
      if (name.startsWith("."))
        return load(path.resolve(path.dirname(file), name));
      return require(name);
    };
    vm.runInNewContext(
      `(function(require,module,exports){${code}\n})`,
      {
        console: { info() {}, log() {}, warn() {}, error() {} },
        process: { env: processEnv },
        crypto: globalThis.crypto,
        Request,
        Response,
        Headers,
        URL,
        TextEncoder,
        TextDecoder,
        Buffer,
        atob,
        btoa,
        setTimeout,
        clearTimeout,
        fetch: async (url, options) => {
          if (url === "https://api.resend.com/emails") {
            state.messages.push(JSON.parse(options.body));
            return Response.json({ id: "synthetic" });
          }
          throw new Error("External network prohibited");
        },
      },
      { filename: file },
    )(localRequire, module, module.exports);
    return module.exports;
  }
  async function route(name, body, method = "POST", query = "") {
    if (
      method === "POST" &&
      [
        "advisor-withdraw-participant",
        "advisor-archive-participant",
        "advisor-reinstate-participant",
      ].includes(name)
    )
      method = "PATCH";
    const request = new Request(
      `https://qa.example.invalid/api/${name}${query}`,
      {
        method,
        headers: {
          "content-type": "application/json",
          authorization: "Bearer synthetic-secret",
        },
        ...(method === "GET" ? {} : { body: JSON.stringify(body ?? {}) }),
      },
    );
    const response = await load(`app/api/${name}/route.ts`)[method](request);
    return { status: response.status, body: await response.json() };
  }
  function project(status = "active") {
    const id = randomUUID();
    sqlite
      .prepare(
        "INSERT INTO client_projects (project_id, company_name, primary_contact_name, primary_contact_email, project_status, segmentation_schema) VALUES (?, 'Synthetic Ltd', 'Test', 'test@example.invalid', ?, ?)",
      )
      .run(id, status, JSON.stringify({ fields: [] }));
    return id;
  }
  return { sqlite, db, env, processEnv, state, load, route, project };
}

test("D1 participant administration enforces lifecycle and preserves completed records", async () => {
  const h = harness();
  try {
    const projectId = h.project();
    const input = {
      projectId,
      questionnaireType: "client_fact_pack",
      roleLabel: "Contact",
      name: "Synthetic",
      email: "participant@example.invalid",
    };
    h.state.authorized = false;
    assert.equal(
      (await h.route("advisor-project-participants", input)).status,
      403,
    );
    h.state.authorized = true;
    const added = await h.route("advisor-project-participants", input);
    assert.equal(added.status, 201, JSON.stringify(added.body));
    const participant = h.sqlite
      .prepare("SELECT * FROM client_participants WHERE project_id = ?")
      .get(projectId);
    const participantId = participant.participant_id;
    assert.equal(
      (
        await h.route("advisor-project-participants", {
          ...input,
          email: "PARTICIPANT@example.invalid",
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await h.route(
          "advisor-update-participant",
          { ...input, participantId, name: "Updated" },
          "PATCH",
        )
      ).status,
      200,
    );
    assert.equal(
      h.sqlite
        .prepare(
          "SELECT name FROM client_participants WHERE participant_id = ?",
        )
        .get(participantId).name,
      "Updated",
    );
    assert.equal(
      (await h.route("advisor-extend-invite", { participantId, days: 21 }))
        .status,
      200,
    );
    assert.ok(
      h.sqlite
        .prepare(
          "SELECT invite_expires_at FROM client_participants WHERE participant_id = ?",
        )
        .get(participantId).invite_expires_at > participant.invite_expires_at,
    );
    assert.equal(
      (
        await h.route("advisor-withdraw-participant", {
          participantId,
          withdrawReason: "added_in_error",
        })
      ).status,
      200,
    );
    let row = h.sqlite
      .prepare("SELECT * FROM client_participants WHERE participant_id = ?")
      .get(participantId);
    assert.equal(row.participant_status, "archived");
    assert.ok(row.invite_revoked_at);
    assert.equal(
      (await h.route("advisor-extend-invite", { participantId, days: 21 }))
        .status,
      409,
    );
    assert.equal(
      (
        await h.route("advisor-reinstate-participant", {
          participantId,
          reinstateReason: "withdrawn_in_error",
        })
      ).status,
      200,
    );
    row = h.sqlite
      .prepare("SELECT * FROM client_participants WHERE participant_id = ?")
      .get(participantId);
    assert.equal(row.participant_status, "invited");
    assert.equal(row.invite_revoked_at, null);
    assert.equal(
      (
        await h.route("advisor-archive-participant", {
          participantId,
          withdrawReason: "added_in_error",
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await h.route("advisor-reinstate-participant", {
          participantId,
          reinstateReason: "withdrawn_in_error",
        })
      ).status,
      200,
    );
    h.sqlite
      .prepare(
        "UPDATE client_participants SET participant_status='completed', completed_at=? WHERE participant_id=?",
      )
      .run(new Date().toISOString(), participantId);
    for (const [name, body] of [
      [
        "advisor-archive-participant",
        { participantId, withdrawReason: "added_in_error" },
      ],
      [
        "advisor-withdraw-participant",
        { participantId, withdrawReason: "added_in_error" },
      ],
      ["advisor-extend-invite", { participantId, days: 21 }],
      [
        "advisor-reinstate-participant",
        { participantId, reinstateReason: "withdrawn_in_error" },
      ],
    ])
      assert.equal((await h.route(name, body)).status, 409, name);
    const closed = h.project("closed");
    assert.equal(
      (
        await h.route("advisor-project-participants", {
          ...input,
          projectId: closed,
        })
      ).status,
      409,
    );
    assert.equal(h.state.supabaseCalls, 0);
  } finally {
    h.sqlite.close();
  }
});

test("daily summaries, reporting and explorer read D1 without Supabase credentials", async () => {
  const h = harness();
  try {
    const projectId = h.project();
    const completedProject = h.project("closed");
    const now = new Date().toISOString();
    h.sqlite
      .prepare(
        "INSERT INTO client_participants (participant_id, project_id, questionnaire_type, role_label, invite_token, participant_status, invite_expires_at) VALUES (?, ?, 'hr', 'HR', ?, 'invited', ?)",
      )
      .run(randomUUID(), projectId, randomUUID(), now);
    h.sqlite
      .prepare(
        "INSERT INTO advisor_prospects (prospect_id, name, deal_stage, lead_temperature, next_action_date) VALUES (?, 'Overdue test', 'new', 'hot', '2000-01-01')",
      )
      .run(randomUUID());
    h.sqlite
      .prepare(
        "INSERT INTO advisor_prospects (prospect_id, name, deal_stage, lead_temperature) VALUES (?, 'Closed test', 'converted', 'hot')",
      )
      .run(randomUUID());
    // Exercise >100 contact rows to catch the D1 bound-parameter limit.
    for (let i = 0; i < 120; i++)
      h.sqlite
        .prepare(
          "INSERT INTO diagnostic_submissions (id, submission_id, public_token, contact_name, contact_email, contact_submitted_at) VALUES (?, ?, ?, 'Contact', 'contact@example.invalid', ?)",
        )
        .run(randomUUID(), randomUUID(), randomUUID(), now);
    const digest = await h.route(
      "advisor-daily-action-digest",
      {},
      "POST",
      "?force=true",
    );
    assert.equal(digest.status, 200, JSON.stringify(digest.body));
    assert.equal(digest.body.overdueProspects, 1);
    assert.equal(digest.body.noNextActionProspects, 0);
    assert.equal(digest.body.contactFormDiagnostics, 120);
    assert.equal(digest.body.activeProjects, 1);
    const summary = await h.route("client-diagnostic-daily-summary");
    assert.equal(summary.status, 200, JSON.stringify(summary.body));
    assert.equal(summary.body.projectCount, 1);
    for (const [file, name] of [
      ["build-project-summary", "buildProjectSummary"],
      ["get-project-summary", "getProjectSummaryData"],
    ]) {
      const result = await h
        .load(`lib/client-diagnostic/${file}.ts`)
        [name](projectId);
      assert.equal(result.success, true, name);
      assert.equal(result.project.projectId, projectId);
      assert.equal(result.completion.totalInvited, 1);
      assert.equal(result.completion.completed, 0);
      assert.ok(!JSON.stringify(result).includes(completedProject));
    }
    const cohort = await h
      .load("lib/client-diagnostic/build-explorer-cohort.ts")
      .buildExplorerCohort({
        projectId,
        requestedFilters: {},
        availableKeys: [],
        reportingMinN: 3,
      });
    assert.equal(cohort.respondentCount, 0);
    assert.equal(cohort.qualitative.totalCommentCount, 0);
    assert.equal(h.state.messages.length, 2);
    assert.equal(h.state.supabaseCalls, 0);
  } finally {
    h.sqlite.close();
  }
});

test("D1 health fails on D1 outage; legacy advisor reads require authorization", async () => {
  const h = harness();
  try {
    assert.equal(
      (await h.route("health", null, "GET")).body.supabase,
      "not_required",
    );
    const id = randomUUID();
    h.sqlite
      .prepare(
        "INSERT INTO diagnostic_submissions (id, submission_id, public_token, answers) VALUES (?, ?, ?, '{}')",
      )
      .run(randomUUID(), id, randomUUID());
    h.state.authorized = false;
    assert.equal(
      (await h.route("advisor-submission", null, "GET", `?submissionId=${id}`))
        .status,
      403,
    );
    h.state.authorized = true;
    assert.equal(
      (await h.route("advisor-submission", null, "GET", `?submissionId=${id}`))
        .status,
      200,
    );
    assert.equal(
      (
        await h.route(
          "advisor-submission",
          null,
          "GET",
          "?submissionId=missing",
        )
      ).status,
      404,
    );
    h.sqlite.exec("DROP TABLE system_events");
    assert.equal((await h.route("health", null, "GET")).status, 503);
    assert.equal(h.state.supabaseCalls, 0);
  } finally {
    h.sqlite.close();
  }
});

test("OTP helper uses D1 without constructing a Supabase client", async () => {
  const h = harness();
  try {
    const projectId = h.project();
    const participantId = randomUUID();
    const inviteToken = randomUUID();
    h.sqlite
      .prepare(
        "INSERT INTO client_participants (participant_id, project_id, questionnaire_type, role_label, invite_token, invite_expires_at, email) VALUES (?, ?, 'hr', 'HR', ?, ?, 'otp@example.invalid')",
      )
      .run(
        participantId,
        projectId,
        inviteToken,
        new Date(Date.now() + 86400000).toISOString(),
      );
    const otp = h.load("lib/security/client-participant-otp.ts");
    const issued = await otp.issueParticipantOtp({
      participantId,
      projectId,
      inviteToken,
    });
    assert.equal(issued.success, true, JSON.stringify(issued));
    const verified = await otp.verifyParticipantOtp({
      participantId,
      projectId,
      inviteToken,
      challengeId: issued.challengeId,
      otpCode: issued.otpCode,
    });
    assert.equal(verified.success, true, JSON.stringify(verified));
    const session = await otp.validateParticipantVerifiedSession({
      participantId,
      projectId,
      inviteToken,
      sessionToken: verified.sessionToken,
    });
    assert.equal(session.valid, true, JSON.stringify(session));
    assert.equal(h.state.supabaseCalls, 0);
  } finally {
    h.sqlite.close();
  }
});

test("contact submission persists its linked CRM row entirely in D1", async () => {
  const h = harness();
  try {
    const result = await h.route("contact", {
      name: "Synthetic Contact",
      email: "contact@example.invalid",
      company: "Synthetic Ltd",
      message: "Synthetic enquiry for migration testing.",
    });
    assert.equal(result.status, 200, JSON.stringify(result.body));
    assert.equal(
      h.sqlite.prepare("SELECT count(*) n FROM diagnostic_submissions").get().n,
      1,
    );
    const linked = h.sqlite
      .prepare(
        "SELECT p.name, p.submission_id FROM health_check_prospects p JOIN diagnostic_submissions d ON d.submission_id=p.submission_id",
      )
      .get();
    assert.equal(linked.name, "Synthetic Contact");
    assert.equal(h.state.messages.length, 1);
    assert.equal(h.state.supabaseCalls, 0);
  } finally {
    h.sqlite.close();
  }
});

test("D1 project creation works without Supabase and records invite delivery", async () => {
  const h = harness();
  try {
    const schema = h
      .load("lib/client-diagnostic/segmentation.ts")
      .buildDefaultSegmentationSchema();
    const values = Object.fromEntries(
      schema.fields.map((field) => [
        field.fieldKey,
        field.options[0].optionKey,
      ]),
    );
    const result = await h.route("client-diagnostic-create-project", {
      projectName: "Synthetic project",
      companyName: "Synthetic Ltd",
      segmentationSchema: schema,
      factPackRecipient: { name: "Test", email: "test@example.invalid" },
      participants: [
        {
          name: "Test",
          email: "test@example.invalid",
          questionnaireType: "HR",
          segmentationValues: values,
        },
      ],
    });
    assert.equal(result.status, 200, JSON.stringify(result.body));
    assert.equal(
      h.sqlite.prepare("SELECT count(*) n FROM client_projects").get().n,
      1,
    );
    assert.equal(
      h.sqlite.prepare("SELECT count(*) n FROM client_participants").get().n,
      2,
    );
    assert.equal(h.state.messages.length, 2);
    assert.equal(h.state.supabaseCalls, 0);
  } finally {
    h.sqlite.close();
  }
});

test("Access middleware fails closed while cron retains its own authorization", async () => {
  const h = harness();
  try {
    const middleware = h.load("middleware.ts").middleware;
    const request = (pathname) => ({
      nextUrl: { pathname, search: "" },
      url: `https://qa.example.invalid${pathname}`,
      headers: new Headers(),
    });
    for (const path of [
      "/advisor",
      "/api/advisor-project-participants",
      "/api/client-diagnostic-create-project",
    ]) {
      assert.equal((await middleware(request(path))).status, 403, path);
    }
    assert.equal(
      (await middleware(request("/api/advisor-daily-action-digest"))).status,
      200,
    );
    assert.equal((await middleware(request("/api/contact"))).status, 200);
    const response = await h
      .load("app/api/advisor-daily-action-digest/route.ts")
      .POST(
        new Request(
          "https://qa.example.invalid/api/advisor-daily-action-digest?force=true",
          { method: "POST" },
        ),
      );
    assert.equal(response.status, 403);
    assert.equal(h.state.messages.length, 0);
    const probe = await h
      .load("app/api/cloudflare-access-probe/route.ts")
      .POST(
        new Request("http://localhost/api/cloudflare-access-probe", {
          method: "POST",
        }),
      );
    assert.equal(probe.status, 200, JSON.stringify(await probe.json()));
  } finally {
    h.sqlite.close();
  }
});

test("Fact Pack email sharing works in either order without allowing duplicate respondents", async () => {
  const h = harness();
  try {
    const schema = h.load("lib/client-diagnostic/segmentation.ts").buildDefaultSegmentationSchema();
    const segmentationValues = Object.fromEntries(schema.fields.map(field => [field.fieldKey, field.options[0].optionKey]));
    for (const scoredType of ["hr", "manager", "leadership"]) {
      for (const factPackFirst of [false, true]) {
        const projectId = h.project();
        h.sqlite.prepare("UPDATE client_projects SET segmentation_schema = ? WHERE project_id = ?").run(JSON.stringify(schema), projectId);
        const input = { projectId, name: "Synthetic", roleLabel: "Test", email: "shared@example.invalid", segmentationValues };
        const firstType = factPackFirst ? "client_fact_pack" : scoredType;
        const secondType = factPackFirst ? scoredType : "client_fact_pack";
        const first = await h.route("advisor-project-participants", { ...input, questionnaireType: firstType });
        assert.equal(first.status, 201, JSON.stringify(first.body));
        const second = await h.route("advisor-project-participants", { ...input, email: " SHARED@example.invalid ", questionnaireType: secondType });
        assert.equal(second.status, 201, JSON.stringify(second.body));
        const rows = h.sqlite.prepare("SELECT * FROM client_participants WHERE project_id = ?").all(projectId);
        assert.equal(rows.length, 2);
        assert.notEqual(rows[0].participant_id, rows[1].participant_id);
        assert.notEqual(rows[0].invite_token, rows[1].invite_token);
        assert.equal(rows.find(row => row.questionnaire_type === "client_fact_pack").segmentation_values, null);
        for (const questionnaireType of ["hr", "manager", "leadership", "client_fact_pack"]) {
          assert.equal((await h.route("advisor-project-participants", { ...input, questionnaireType })).status, 409);
        }
        // Edits must preserve an existing legal shared pair and reject type changes
        // that would create a duplicate in either assignment category.
        for (const row of rows) {
          assert.equal((await h.route("advisor-update-participant", { ...input, participantId: row.participant_id, questionnaireType: row.questionnaire_type }, "PATCH")).status, 200);
          const conflictingType = row.questionnaire_type === "client_fact_pack" ? scoredType : "client_fact_pack";
          assert.equal((await h.route("advisor-update-participant", { ...input, participantId: row.participant_id, questionnaireType: conflictingType }, "PATCH")).status, 409);
        }
        const independent = await h.route("advisor-project-participants", { ...input, email: "other@example.invalid", questionnaireType: scoredType });
        assert.equal(independent.status, 201);
        assert.equal((await h.route("advisor-update-participant", { ...input, participantId: independent.body.participant.participant_id, questionnaireType: scoredType }, "PATCH")).status, 409);
      }
    }
    assert.equal(h.state.supabaseCalls, 0);
  } finally {
    h.sqlite.close();
  }
});

test("Supabase fallback adds a shared Fact Pack but rejects duplicate assignments", async () => {
  const h = harness();
  try {
    h.env.D1_CLIENT_DIAGNOSTIC_MODE = "off";
    const projectId = h.project();
    const schema = h.load("lib/client-diagnostic/segmentation.ts").buildDefaultSegmentationSchema();
    const segmentationValues = Object.fromEntries(schema.fields.map(field => [field.fieldKey, field.options[0].optionKey]));
    const rows = [];
    h.state.supabaseClient = {
      from(table) {
        const filters = [];
        let inserted;
        const query = {
          select() { return this; },
          eq(key, value) { filters.push([key, value]); return this; },
          insert(values) { inserted = values; return this; },
          async single() {
            if (table === "client_projects") return { data: { project_id: projectId, company_name: "Synthetic", project_status: "active", segmentation_schema: schema }, error: null };
            assert.ok(inserted, "participant insert expected");
            const row = { ...inserted, participant_id: randomUUID(), invite_token: randomUUID() };
            rows.push(row);
            return { data: row, error: null };
          },
          then(resolve) {
            assert.equal(table, "client_participants");
            resolve({ data: rows.filter(row => filters.every(([key, value]) => row[key] === value)), error: null });
          },
        };
        return query;
      },
    };
    for (const factPackFirst of [false, true]) {
      rows.length = 0;
      const input = { projectId, name: "Synthetic", roleLabel: "Test", email: "same@example.invalid", segmentationValues };
      for (const questionnaireType of factPackFirst ? ["client_fact_pack", "hr"] : ["hr", "client_fact_pack"]) {
        const response = await h.route("advisor-project-participants", { ...input, questionnaireType });
        assert.equal(response.status, 201, JSON.stringify(response.body));
      }
      for (const questionnaireType of ["hr", "manager", "leadership", "client_fact_pack"]) {
        assert.equal((await h.route("advisor-project-participants", { ...input, email: " SAME@example.invalid ", questionnaireType })).status, 409);
      }
      assert.equal(rows.length, 2);
    }
  } finally {
    h.sqlite.close();
  }
});
