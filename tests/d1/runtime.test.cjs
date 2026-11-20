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
  const state = {
    authorized: true,
    messages: [],
    supabaseCalls: 0,
    cookies: new Map(),
    failAdvisorEmail: false,
  };
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
    "next/headers": {
      cookies: async () => ({ get: (name) => state.cookies.get(name) }),
    },
    "next/navigation": {
      redirect: (url) => { throw new Error(`redirect:${url}`); },
      notFound: () => { throw new Error("notFound"); },
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
        json: (...args) => {
          const response = Response.json(...args);
          response.cookies = {
            set: (cookie) => state.cookies.set(cookie.name, cookie),
          };
          return response;
        },
        next: () => new Response(null),
        redirect: (url) => Response.redirect(url),
      },
    },
  };
  const cache = new Map();
  function load(file) {
    file = path.resolve(root, file);
    if (!path.extname(file)) file += fs.existsSync(`${file}.ts`) ? ".ts" : ".tsx";
    for (const name of ["admin", "server"]) {
      if (file === path.join(root, `lib/supabase/${name}.ts`)) {
        return overrides[`@/lib/supabase/${name}`];
      }
    }
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      fileName: file,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
        jsx: ts.JsxEmit.ReactJSX,
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
        URLSearchParams,
        TextEncoder,
        TextDecoder,
        Buffer,
        atob,
        btoa,
        setTimeout,
        clearTimeout,
        fetch: async (url, options) => {
          if (url === "https://api.resend.com/emails") {
            const message = JSON.parse(options.body);
            state.messages.push(message);
            if (state.failAdvisorEmail && message.to.includes(processEnv.CONTACT_TO_EMAIL)) {
              return Response.json({ message: "Synthetic mail provider outage" }, { status: 503 });
            }
            return Response.json({ id: "synthetic" });
          }
          if (url === "https://qa.example.invalid/api/public-diagnostic-email") {
            return load("app/api/public-diagnostic-email/route.ts").POST(new Request(url, options));
          }
          if (new URL(url).hostname.endsWith(".supabase.co")) state.supabaseCalls++;
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
      "/advisor/baseline/api/campaigns",
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

test("Scheduler alias keeps cron authorization and dry runs never send email", async () => {
  const h = harness();
  try {
    h.project();
    for (const name of ["cron/advisor-daily-action-digest", "client-diagnostic-daily-summary"]) {
      const handler = h.load(`app/api/${name}/route.ts`);
      for (const authorization of [null, "Bearer incorrect"]) {
        const denied = await handler.POST(new Request(`https://qa.example.invalid/api/${name}?dryRun=true`, {
          method: "POST", headers: authorization ? { authorization } : {},
        }));
        assert.equal(denied.status, 403);
      }
      assert.equal((await handler.GET()).status, 405);
      const result = await h.route(name, {}, "POST", "?dryRun=true");
      assert.equal(result.status, 200, JSON.stringify(result.body));
      assert.equal(result.body.dryRun, true);
      assert.equal(result.body.emailGenerated, true);
      assert.equal(h.state.messages.length, 0);
    }
    const empty = harness();
    try {
      const result = await empty.route("client-diagnostic-daily-summary", {}, "POST", "?dryRun=true");
      assert.equal(result.body.dryRun, true);
      assert.equal(result.body.projectCount, 0);
      assert.equal(empty.state.messages.length, 0);
    } finally { empty.sqlite.close(); }
    assert.equal(h.state.supabaseCalls, 0);
  } finally { h.sqlite.close(); }
});

function healthCheckInput(h) {
  return {
    answers: Object.fromEntries(h.load("lib/diagnostic.ts").questions.map(q => [q.id, 4])),
    companySize: "51-200",
    industry: "Synthetic services",
    role: "HR leader",
    countryRegion: "United Kingdom",
  };
}

test("HR Health Check persists answers, returns its result and sends both emails without Supabase", async () => {
  const h = harness();
  try {
    const input = { ...healthCheckInput(h), email: "participant@example.invalid" };
    const completed = await h.route("diagnostic-complete", input);
    assert.equal(completed.status, 200, JSON.stringify(completed.body));
    assert.equal(completed.body.internalEmailStatus, "sent");
    const row = h.sqlite.prepare("SELECT * FROM diagnostic_submissions").get();
    assert.equal(row.submission_id, completed.body.submissionId);
    assert.equal(row.public_token, completed.body.publicToken);
    assert.equal(row.submission_source, "health-check");
    assert.deepEqual(JSON.parse(row.answers), input.answers);
    assert.equal(row.email, input.email);
    assert.equal(row.score, completed.body.score);
    assert.ok(JSON.parse(row.advisor_brief).headline);
    assert.equal(h.state.messages.length, 2);
    assert.deepEqual(h.state.messages.map(m => m.to[0]), ["advisor@example.invalid", input.email]);
    const result = await h.route("public-diagnostic-result", null, "GET", `?token=${row.public_token}`);
    assert.equal(result.status, 200, JSON.stringify(result.body));
    assert.equal(result.body.result.score, row.score);
    assert.equal(result.body.context.companySize, input.companySize);
    assert.equal(result.body.context.emailPresent, true);
    assert.equal((await h.route("public-diagnostic-result", null, "GET", "?token=unknown")).status, 404);
    const advisor = await h.route("advisor-submission", null, "GET", `?submissionId=${row.submission_id}`);
    assert.equal(advisor.status, 200, JSON.stringify(advisor.body));
    assert.equal(advisor.body.diagnostic.score, row.score);
    const dashboard = await h.load("lib/advisor-dashboard.ts").getAdvisorDashboardData();
    assert.equal(dashboard.healthChecks.error, null);
    assert.equal(dashboard.healthChecks.data[0].submission_id, row.submission_id);
    assert.equal(h.state.supabaseCalls, 0);
  } finally { h.sqlite.close(); }
});

test("Health Check validation and honeypot do not write records or send email", async () => {
  const h = harness();
  try {
    const input = healthCheckInput(h);
    assert.equal((await h.route("diagnostic-complete", { ...input, answers: { 1: 4 } })).status, 400);
    assert.equal((await h.route("diagnostic-complete", { ...input, answers: { ...input.answers, 1: 9 } })).status, 400);
    assert.equal((await h.route("diagnostic-complete", { ...input, website: "bot.example.invalid" })).status, 200);
    assert.equal(h.sqlite.prepare("SELECT count(*) n FROM diagnostic_submissions").get().n, 0);
    assert.equal(h.state.messages.length, 0);
    assert.equal(h.state.supabaseCalls, 0);
  } finally { h.sqlite.close(); }
});

for (const failure of ["provider outage", "missing configuration"]) {
  test(`A saved D1 Health Check remains successful during an advisor email ${failure}`, async () => {
    const h = harness();
    try {
      if (failure === "provider outage") h.state.failAdvisorEmail = true;
      else delete h.processEnv.CONTACT_TO_EMAIL;
      const completed = await h.route("diagnostic-complete", {
        ...healthCheckInput(h), email: "participant@example.invalid",
      });
      assert.equal(completed.status, 200, JSON.stringify(completed.body));
      assert.equal(completed.body.ok, true);
      assert.equal(completed.body.internalEmailStatus, "failed");
      assert.equal(completed.body.resendId, null);
      assert.equal(h.sqlite.prepare("SELECT count(*) n FROM diagnostic_submissions").get().n, 1);
      assert.equal((await h.route("public-diagnostic-result", null, "GET", `?token=${completed.body.publicToken}`)).status, 200);
      assert.equal(h.state.messages.at(-1).to[0], "participant@example.invalid", "Client result email still attempted");
      const event = h.sqlite.prepare("SELECT status, metadata FROM system_events WHERE event_type = 'health_check_internal_email'").get();
      assert.equal(event.status, "error");
      assert.ok(JSON.parse(event.metadata).error);
      assert.equal(h.sqlite.prepare("SELECT count(*) n FROM system_events WHERE event_type = 'health_check_failure'").get().n, 0);
      assert.equal(h.state.supabaseCalls, 0);
    } finally { h.sqlite.close(); }
  });
}

test("A failed D1 Health Check write returns failure without sending notifications or falling back", async () => {
  const h = harness();
  try {
    const prepare = h.db.prepare;
    h.db.prepare = (sql) => {
      if (/INSERT INTO diagnostic_submissions/.test(sql)) throw new Error("Synthetic D1 write failure");
      return prepare(sql);
    };
    const completed = await h.route("diagnostic-complete", healthCheckInput(h));
    assert.equal(completed.status, 500);
    assert.equal(completed.body.publicToken, undefined);
    assert.equal(h.sqlite.prepare("SELECT count(*) n FROM diagnostic_submissions").get().n, 0);
    assert.equal(h.state.messages.length, 0);
    assert.equal(h.state.supabaseCalls, 0);
  } finally { h.sqlite.close(); }
});

test("Health Check enquiries, CRM updates, notes and link/unlink work together in D1", async () => {
  const h = harness();
  try {
    const input = healthCheckInput(h);
    const completed = await h.route("diagnostic-complete", input);
    assert.equal(completed.status, 200, JSON.stringify(completed.body));
    const contact = await h.route("contact", {
      ...input,
      submissionId: completed.body.submissionId,
      diagnosticAnswers: input.answers,
      name: "Synthetic Contact",
      email: "contact@example.invalid",
      company: "Synthetic Ltd",
      message: "Please discuss this synthetic Health Check result.",
      source: "diagnostic-interpretation",
    });
    assert.equal(contact.status, 200, JSON.stringify(contact.body));
    assert.equal(h.sqlite.prepare("SELECT count(*) n FROM diagnostic_submissions").get().n, 1);
    const healthProspect = h.sqlite.prepare("SELECT * FROM health_check_prospects").get();
    assert.equal(healthProspect.submission_id, completed.body.submissionId);
    const updatedHealthProspect = await h.route("prospect-update", {
      prospect_id: healthProspect.prospect_id,
      source: "website", relationship: "strong", status: "contacted",
      notes: "Synthetic follow-up", next_action_date: "2030-01-01",
    });
    assert.equal(updatedHealthProspect.status, 200, JSON.stringify(updatedHealthProspect.body));
    assert.equal(h.sqlite.prepare("SELECT status FROM health_check_prospects").get().status, "contacted");
    assert.ok(h.sqlite.prepare("SELECT count(*) n FROM health_check_prospect_activity").get().n > 0);
    const created = await h.route("advisor-create-prospect", {
      name: "Synthetic Contact", company: "Synthetic Ltd", source: "website",
    });
    assert.equal(created.status, 200, JSON.stringify(created.body));
    const prospectId = created.body.prospect_id;
    for (const [name, body] of [
      ["advisor-update-prospect", { prospect_id: prospectId, deal_stage: "in_conversation", contact_email: "contact@example.invalid", next_step: "Discuss result" }],
      ["advisor-add-prospect-note", { prospect_id: prospectId, note: "Synthetic CRM note", note_type: "internal", next_action_date: "2030-01-01" }],
      ["advisor-link-health-check-prospect", { prospect_id: prospectId, submission_id: completed.body.submissionId }],
    ]) {
      const response = await h.route(name, body);
      assert.equal(response.status, 200, `${name}: ${JSON.stringify(response.body)}`);
    }
    const dashboard = await h.load("lib/advisor-dashboard.ts").getAdvisorDashboardData();
    assert.equal(dashboard.prospects.error, null);
    assert.equal(dashboard.prospects.data[0].linked_submission_id, completed.body.submissionId);
    assert.equal(dashboard.prospects.data[0].deal_stage, "in_conversation");
    assert.equal(dashboard.healthChecks.data[0].contact_name, "Synthetic Contact");
    assert.ok(h.sqlite.prepare("SELECT count(*) n FROM advisor_prospect_activity WHERE prospect_id = ?").get(prospectId).n >= 3);
    const unlinked = await h.route("advisor-unlink-health-check-prospect", { prospect_id: prospectId });
    assert.equal(unlinked.status, 200, JSON.stringify(unlinked.body));
    assert.equal(h.sqlite.prepare("SELECT linked_submission_id FROM advisor_prospects").get().linked_submission_id, null);
    h.state.authorized = false;
    assert.equal((await h.route("advisor-create-prospect", { name: "Forbidden" })).status, 401);
    assert.equal(h.sqlite.prepare("SELECT count(*) n FROM advisor_prospects").get().n, 1);
    assert.equal(h.state.supabaseCalls, 0);
  } finally { h.sqlite.close(); }
});

test("D1 project spaces support details, participant OTP, questionnaires, Fact Pack and reports", async () => {
  const h = harness();
  try {
    const projectId = h.project();
    const details = await h.route("client-diagnostic-project-update", {
      projectId, billingContactName: "Synthetic Billing", notes: "Synthetic project space",
    }, "PATCH");
    assert.equal(details.status, 200, JSON.stringify(details.body));
    assert.equal(h.sqlite.prepare("SELECT billing_contact_name FROM client_projects WHERE project_id = ?").get(projectId).billing_contact_name, "Synthetic Billing");
    const schema = h.load("lib/client-diagnostic/segmentation.ts").buildDefaultSegmentationSchema();
    h.sqlite.prepare("UPDATE client_projects SET segmentation_schema = ? WHERE project_id = ?").run(JSON.stringify(schema), projectId);
    const segmentationValues = Object.fromEntries(schema.fields.map(f => [f.fieldKey, f.options[0].optionKey]));
    const bank = h.load("lib/client-diagnostic/question-bank.ts");

    for (const questionnaireType of ["hr", "manager", "leadership", "client_fact_pack"]) {
      h.state.cookies.clear();
      const added = await h.route("advisor-project-participants", {
        projectId, questionnaireType, segmentationValues,
        name: `Synthetic ${questionnaireType}`, roleLabel: questionnaireType,
        email: `${questionnaireType}@example.invalid`,
      });
      assert.equal(added.status, 201, JSON.stringify(added.body));
      const participant = h.sqlite.prepare("SELECT * FROM client_participants WHERE project_id = ? AND questionnaire_type = ?").get(projectId, questionnaireType);
      const identifiers = { projectId, participantId: participant.participant_id, inviteToken: participant.invite_token };
      const issued = await h.route("client-diagnostic-otp-request", { inviteToken: participant.invite_token });
      assert.equal(issued.status, 200, JSON.stringify(issued.body));
      const otpCode = h.state.messages.at(-1).html.match(/>\s*(\d{6})\s*</)?.[1];
      assert.match(otpCode, /^\d{6}$/);
      const verified = await h.route("client-diagnostic-otp-verify", {
        inviteToken: participant.invite_token, challengeId: issued.body.challengeId, otpCode,
      });
      assert.equal(verified.status, 200, JSON.stringify(verified.body));
      assert.equal([...h.state.cookies.values()][0].httpOnly, true);
      assert.equal([...h.state.cookies.values()][0].secure, true);

      if (questionnaireType === "client_fact_pack") {
        const responseJson = { companyProfile: { employees: 100 }, notes: "Synthetic Fact Pack" };
        const draft = await h.route("client-fact-pack-submit", { ...identifiers, responseJson, mode: "draft" });
        assert.equal(draft.status, 200, JSON.stringify(draft.body));
        const loaded = await h.route("client-fact-pack", null, "GET", `?${new URLSearchParams(identifiers)}`);
        assert.equal(loaded.status, 200, JSON.stringify(loaded.body));
        assert.deepEqual(loaded.body.data, responseJson);
        assert.equal(loaded.body.status, "in_progress");
        const submitted = await h.route("client-fact-pack-submit", { ...identifiers, responseJson, mode: "submit" });
        assert.equal(submitted.status, 200, JSON.stringify(submitted.body));
        assert.equal(h.sqlite.prepare("SELECT status FROM client_fact_packs WHERE participant_id = ?").get(participant.participant_id).status, "completed");
      } else {
        const responses = bank.getQuestionsForQuestionnaireType(questionnaireType).map(q => ({
          questionId: q.id, dimension: q.dimension, kind: q.kind,
          value: q.kind === "score" ? 4 : "Synthetic operational evidence",
        }));
        const submitted = await h.route("client-diagnostic-submit", {
          ...identifiers, questionnaireType, submission: { questionnaireType, responses },
        });
        assert.equal(submitted.status, 200, JSON.stringify(submitted.body));
        assert.equal(submitted.body.savedResponseCount, responses.length);
        assert.equal(h.sqlite.prepare("SELECT count(*) n FROM client_responses WHERE participant_id = ?").get(participant.participant_id).n, responses.length);
        assert.ok(h.sqlite.prepare("SELECT count(*) n FROM client_dimension_scores WHERE participant_id = ?").get(participant.participant_id).n > 0);
      }
      assert.equal(h.sqlite.prepare("SELECT participant_status FROM client_participants WHERE participant_id = ?").get(participant.participant_id).participant_status, "completed");
    }

    const projects = await h.route("client-diagnostic-projects", null, "GET");
    assert.equal(projects.status, 200, JSON.stringify(projects.body));
    assert.equal(projects.body.projects[0].project_id, projectId);
    const summary = await h.route("client-diagnostic-project-summary", null, "GET", `?projectId=${projectId}`);
    assert.equal(summary.status, 200, JSON.stringify(summary.body));
    assert.equal(summary.body.completion.completed, 4);
    const report = await h.route("client-diagnostic-report", null, "GET", `?projectId=${projectId}`);
    assert.equal(report.status, 200, JSON.stringify(report.body));
    assert.equal(report.body.report.project.projectId, projectId);
    assert.equal(report.body.report.executiveSummary.completedRespondentGroups, 3);
    const dashboard = await h.load("lib/advisor-dashboard.ts").getAdvisorDashboardData();
    assert.equal(dashboard.projects.error, null);
    assert.equal(dashboard.projects.data[0].project_id, projectId);
    const closed = await h.route("client-diagnostic-project-status", { projectId, projectStatus: "closed" }, "PATCH");
    assert.equal(closed.status, 200, JSON.stringify(closed.body));
    assert.equal(h.sqlite.prepare("SELECT project_status FROM client_projects WHERE project_id = ?").get(projectId).project_status, "closed");
    h.state.authorized = false;
    assert.equal((await h.route("client-diagnostic-projects", null, "GET")).status, 403);
    assert.equal((await h.route("client-diagnostic-report", null, "GET", `?projectId=${projectId}`)).status, 403);
    assert.equal(h.state.supabaseCalls, 0);
  } finally { h.sqlite.close(); }
});

test("Advisor server pages read Health Checks, CRM and project spaces entirely from D1", async () => {
  const h = harness();
  try {
    const completed = await h.route("diagnostic-complete", healthCheckInput(h));
    assert.equal(completed.status, 200, JSON.stringify(completed.body));
    const created = await h.route("advisor-create-prospect", { name: "D1 synthetic prospect", company: "D1 synthetic company" });
    assert.equal(created.status, 200, JSON.stringify(created.body));
    const projectId = h.project();
    h.sqlite.prepare("UPDATE client_projects SET project_name = 'D1 synthetic workspace' WHERE project_id = ?").run(projectId);
    const props = { searchParams: Promise.resolve({}), params: Promise.resolve({
      submissionId: completed.body.submissionId, prospectId: created.body.prospect_id, projectId,
    }) };
    for (const [page, expected] of [
      ["page.tsx", "D1 synthetic workspace"],
      ["health-checks/page.tsx", completed.body.submissionId],
      ["[submissionId]/page.tsx", completed.body.submissionId],
      ["prospects/page.tsx", "D1 synthetic prospect"],
      ["prospects/[prospectId]/page.tsx", "D1 synthetic prospect"],
      ["projects/page.tsx", "D1 synthetic workspace"],
      ["project/[projectId]/page.tsx", "D1 synthetic workspace"],
      ["explorers/page.tsx", "D1 synthetic workspace"],
    ]) {
      const render = h.load(`app/advisor/${page}`).default;
      const element = await render(props);
      const renderedProps = JSON.stringify(element, (key, value) => key === "type" ? undefined : value);
      assert.ok(renderedProps.includes(expected), `${page} must include its D1 record`);
      h.state.authorized = false;
      await assert.rejects(() => render(props), /redirect:\/advisor\/login/, page);
      h.state.authorized = true;
    }
    assert.equal(h.state.supabaseCalls, 0);
  } finally { h.sqlite.close(); }
});
