const { test } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm"),
  ts = require("typescript");
const root = path.resolve(__dirname, "../..");
test("Prototype custom work remains comparable and unclassified work is explicit", () => {
  const h = harness(),
    p = h.prototype;
  let d = p.addActivity(
    p.emptyPrototype(),
    "Coordinate welcome gifts",
    "employee_admin",
    "added_11111111-1111-1111-1111-111111111111",
  );
  assert.equal(p.activeProcesses(d).length, 1);
  d = p.applyAnswers(d, "employee_admin", "most_weeks", "lead_part");
  assert.equal(
    p.prototypeEvidence(d).activities[0].label,
    "Coordinate welcome gifts",
  );
  assert.equal(p.prototypeEvidence(d).activities[0].role, "lead_part");
  d = p.addActivity(
    d,
    "A different local process",
    "other_work",
    "added_22222222-2222-2222-2222-222222222222",
  );
  assert.equal(p.activeProcesses(d).length, 2);
  const e = p
    .prototypeEvidence(d)
    .activities.find((a) => a.label === "A different local process");
  assert.equal(e.processCode, "other_work");
  assert.equal(e.role, null);
  assert.throws(() =>
    p.addActivity(
      d,
      "coordinate welcome gifts",
      "office",
      "added_33333333-3333-3333-3333-333333333333",
    ),
  );
  assert.throws(() =>
    p.addActivity(
      d,
      "Some task",
      "guessed-group",
      "added_33333333-3333-3333-3333-333333333333",
    ),
  );
  const choices = p.activityChoices(d);
  assert.ok(
    choices
      .find((a) => a.code === "ops_07")
      .label.includes("payroll information"),
  );
  assert.ok(
    choices.find((a) => a.code === "office_01").label.includes("front desk"),
  );
  h.sqlite.close();
});
test("Process prototype bounds time entry while retaining every activity", () => {
  const h = harness(),
    p = h.prototype,
    m = h.model;
  const codes = p.PROCESSES.flatMap((x) => x.codes);
  assert.equal(new Set(codes).size, m.AREAS.length);
  assert.equal(codes.length, m.AREAS.length);
  const d = { ...p.emptyPrototype(), selected: m.AREAS.map((a) => a.code) };
  assert.equal(p.activeProcesses(d).length, 9);
  assert.equal(p.prototypeIssues(d, 2).length, m.AREAS.length);
  d.time = Object.fromEntries(
    p.PROCESSES.map((x, i) => [x.code, i === 8 ? 12 : 11]),
  );
  assert.equal(p.processTotal(d), 100);
  assert.equal(p.prototypeIssues(d, 1).length, 0);
  const e = p.prototypeEvidence(d);
  assert.equal(e.activities.length, m.AREAS.length);
  assert.ok(e.activities.every((a) => !("percentage" in a)));
  h.sqlite.close();
});
test("Prototype bulk answers are explicit, preserve exceptions and never infer unselected work", () => {
  const h = harness(),
    p = h.prototype;
  let d = p.selectActivities(p.emptyPrototype(), [
    "ops_01",
    "ops_02",
    "ops_05",
  ]);
  assert.equal(Object.keys(d.answers).length, 0);
  d.answers.ops_01 = {
    frequency: "few_times_year",
    role: "final_result",
    important: true,
  };
  d.answers.ops_02 = { frequency: "", role: "lead_part", important: false };
  assert.throws(() => p.applyAnswers(d, "employee_admin", "", "contribute"));
  d = p.applyAnswers(
    d,
    "employee_admin",
    "most_days",
    "administration_support",
  );
  assert.equal(d.answers.ops_01.frequency, "few_times_year");
  assert.equal(d.answers.ops_01.role, "final_result");
  assert.equal(d.answers.ops_01.important, true);
  assert.equal(d.answers.ops_02.role, "lead_part");
  assert.equal(d.answers.ops_02.frequency, "most_days");
  assert.equal(d.answers.ops_05.role, "administration_support");
  assert.equal(d.answers.ops_06, undefined);
  assert.equal(p.prototypeIssues(d, 2).length, 0);
  d.time.employee_admin = 100;
  d.notes.employee_admin = "Synthetic note";
  const removed = p.selectActivities(d, []);
  assert.equal(Object.keys(removed.time).length, 0);
  assert.equal(Object.keys(removed.answers).length, 0);
  assert.equal(Object.keys(removed.notes).length, 0);
  h.sqlite.close();
});
test("Baseline incoming routes accept five and identify percentage fields that need attention", () => {
  const h = harness(),
    m = h.model,
    d = h.complete(m.initialDraft());
  d.channels = ["ticket", "email", "chat", "employees", "planned"];
  d.channelAllocation = {
    ticket: 20,
    email: 20,
    chat: 20,
    employees: 20,
    planned: 20,
  };
  assert.equal(m.stepError(d, 6), null);
  assert.equal(m.parseDraft(d).channels.length, 5);
  d.channelAllocation.email = 5;
  assert.ok(
    m.validationIssues(d, 6).some((i) => i.key === "channelAllocation:email"),
  );
  d.channelAllocation.email = 20;
  delete d.channelAllocation.chat;
  assert.ok(
    m.validationIssues(d, 6).some((i) => i.key === "channelAllocation:chat"),
  );
  d.channels.push("project");
  assert.throws(() => m.parseDraft(d));
  assert.ok(
    m.QUESTIONNAIRE.roles.every((r) => m.QUESTIONNAIRE.descriptions[r.code]),
  );
  for (const code of ["slack", "claude", "blueai"])
    assert.ok(m.SYSTEMS.includes(code));
  assert.doesNotMatch(m.PRIVACY, /future role|restructur|job loss/i);
  h.sqlite.close();
});
test("Baseline roster management is imported and cannot be changed or disclosed by participants", async () => {
  const h = harness();
  try {
    const { campaign, a, token } = await h.setup();
    const p = await h.access(token),
      response = await h.service.readResponse(p);
    assert.equal(response.draft.profile.name, "");
    assert.equal(response.draft.profile.email, "");
    assert.equal(response.draft.profile.country, "");
    const d = h.complete(response.draft);
    d.profile.name = "Changed";
    d.profile.job_title = "Changed";
    d.profile.manages_people = "yes";
    d.profile.direct_reports = "999";
    await h.service.saveResponse(p, d, 0, 1);
    const stored = JSON.parse(
      h.sqlite
        .prepare(
          "SELECT draft_json FROM tb_baseline_responses WHERE participant_id=?",
        )
        .get(a.participant_id).draft_json,
    );
    assert.equal(stored.profile.name, "Person A");
    assert.equal(stored.profile.email, "a@example.invalid");
    assert.equal(stored.profile.manages_people, "");
    const parsed = h.model.parseRoster(
      "name,email,manages_people,direct_reports\nTest,t@example.invalid,yes,3",
    );
    assert.equal(parsed[0].manages_people, "yes");
    assert.equal(parsed[0].direct_reports, "3");
    assert.throws(() =>
      h.model.parseRoster(
        "name,email,manages_people\nTest,t@example.invalid,sometimes",
      ),
    );
    assert.equal(
      (await h.service.campaignRows(campaign)).participants.find(
        (x) => x.participant_id === a.participant_id,
      ).draft.profile.name,
      "Person A",
    );
  } finally {
    h.sqlite.close();
  }
});
test("Baseline approved entity choices validate scope and freeze after invitation", async () => {
  const h = harness();
  try {
    const { campaign, token } = await h.setup(),
      p = await h.access(token),
      draft = h.complete((await h.service.readResponse(p)).draft);
    draft.scope = {
      reach: "one_entity",
      entities: ["entity_0000000000000000"],
    };
    await assert.rejects(
      h.service.saveResponse(p, draft, 0, 1),
      /campaign's list/,
    );
    await assert.rejects(
      h.service.configureCampaign("admin@example.invalid", campaign, {
        entityList: "Approved A\nApproved B",
      }),
      (e) => e.status === 409,
    );
    const next = await h.service.createCampaign("admin@example.invalid", {
      name: "Revised test",
      closesAt: new Date(Date.now() + 86400000).toISOString(),
      entityList: "Approved A\nApproved B",
      copyRosterFrom: campaign,
    });
    const rows = await h.service.campaignRows(next.campaignId);
    assert.equal(rows.participants.length, 2);
    assert.equal(rows.participants[0].status, "not_started");
    assert.equal(rows.participants[0].invited, 0);
    assert.equal(rows.campaign.entities.length, 2);
    assert.match(rows.campaign.entities[0].code, /^entity_[a-f0-9]{16}$/);
    draft.scope = { reach: "one_entity", entities: [] };
    assert.ok(h.model.stepError(draft, 0, rows.campaign.entities));
    draft.scope.entities = [rows.campaign.entities[0].code];
    assert.equal(h.model.stepError(draft, 0, rows.campaign.entities), null);
    draft.scope.reach = "multiple_entities";
    assert.ok(h.model.stepError(draft, 0, rows.campaign.entities));
    draft.scope.entities.push(rows.campaign.entities[1].code);
    assert.equal(h.model.stepError(draft, 0, rows.campaign.entities), null);
    const old = h.sqlite
      .prepare(
        "SELECT draft_json FROM tb_baseline_responses WHERE participant_id=?",
      )
      .get(p.participant_id).draft_json;
    await assert.rejects(
      h.service.readResponse({ ...p, version: "team-blue-baseline-v1" }),
      /earlier questionnaire/,
    );
    assert.equal(
      h.sqlite
        .prepare(
          "SELECT draft_json FROM tb_baseline_responses WHERE participant_id=?",
        )
        .get(p.participant_id).draft_json,
      old,
    );
  } finally {
    h.sqlite.close();
  }
});
function harness() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys=ON");
  sqlite.exec(
    fs.readFileSync(
      path.join(root, "baseline-migrations/0001_baseline.sql"),
      "utf8",
    ),
  );
  sqlite.exec(
    fs.readFileSync(
      path.join(root, "baseline-migrations/0002_campaign_entities.sql"),
      "utf8",
    ),
  );
  sqlite.exec(
    fs.readFileSync(
      path.join(root, "baseline-migrations/0003_administration.sql"),
      "utf8",
    ),
  );
  sqlite.exec(
    fs.readFileSync(
      path.join(root, "baseline-migrations/0004_reviewed_collection.sql"),
      "utf8",
    ),
  );
  const db = {
    prepare(sql) {
      const s = sqlite.prepare(sql);
      let values = [];
      return {
        bind(...v) {
          assert.ok(v.length <= 100);
          values = v;
          return this;
        },
        async first(column) {
          const row = s.get(...values) ?? null;
          return column ? row?.[column] : row;
        },
        async all() {
          return { results: s.all(...values), success: true };
        },
        async run() {
          return {
            success: true,
            meta: { changes: Number(s.run(...values).changes) },
          };
        },
      };
    },
    async batch(statements) {
      sqlite.exec("BEGIN");
      try {
        const results = [];
        for (const s of statements) results.push(await s.run());
        sqlite.exec("COMMIT");
        return results;
      } catch (e) {
        sqlite.exec("ROLLBACK");
        throw e;
      }
    },
  };
  const env = {
    DB: db,
    BASELINE_ENABLED: "true",
    BASELINE_MAIL_MODE: "preview",
    NEXT_PUBLIC_APP_ENV: "qa",
    NEXT_PUBLIC_SITE_URL: "https://qa.example.invalid",
    INVITE_RATE_LIMIT_SALT: "synthetic-test-salt",
  };
  const state = { admin: true, cookie: "", emails: [] };
  class NextResponse extends Response {
    static json(body, options) {
      return new NextResponse(JSON.stringify(body), {
        ...options,
        headers: { "Content-Type": "application/json", ...options?.headers },
      });
    }
    cookies = {
      set: (name, value, options) => {
        this.headers.set(
          "set-cookie",
          `${name}=${value}; HttpOnly; Secure; SameSite=Strict; Path=/`,
        );
        state.cookie = value;
        state.cookieOptions = options;
      },
    };
  }
  const overrides = {
    "@opennextjs/cloudflare": { getCloudflareContext: () => ({ env }) },
    "next/headers": {
      cookies: async () => ({
        get: () => (state.cookie ? { value: state.cookie } : undefined),
      }),
    },
    "@/lib/advisor-auth": {
      requireAdvisorUser: async () =>
        state.admin ? { email: "admin@example.invalid" } : null,
    },
    "next/server": { NextResponse },
    resend: {
      Resend: class {
        emails = {
          send: async (message, options) => {
            state.emails.push(message);
            (state.mailKeys ??= []).push(options?.idempotencyKey);
            return state.failMail
              ? { data: null, error: { message: "Synthetic delivery failure" } }
              : { data: { id: "fake" }, error: null };
          },
        };
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
    const req = (name) =>
      overrides[name] ??
      (name.startsWith("@/")
        ? load(name.slice(2))
        : name.startsWith(".")
          ? load(path.resolve(path.dirname(file), name))
          : require(name));
    vm.runInNewContext(
      `(function(require,module,exports){${code}\n})`,
      {
        console,
        process,
        crypto: globalThis.crypto,
        Request,
        Response,
        Headers,
        URL,
        TextEncoder,
        TextDecoder,
        Buffer,
        structuredClone,
        Intl,
        Date,
        setTimeout,
        clearTimeout,
      },
      { filename: file },
    )(req, module, module.exports);
    return module.exports;
  }
  const service = load("lib/baseline/server.ts"),
    model = load("lib/baseline/model.ts"),
    prototype = load("lib/baseline/prototype.ts"),
    route = load("app/api/baseline/[...path]/route.ts"),
    adminRoute = load("app/advisor/baseline/api/[...path]/route.ts");
  const request = (body) =>
    new Request("https://qa.example.invalid/api/baseline/save", {
      method: "POST",
      headers: {
        origin: "https://qa.example.invalid",
        "content-type": "application/json",
        "cf-connecting-ip": "192.0.2.1",
      },
      body: JSON.stringify(body ?? {}),
    });
  async function setup() {
    const c = await service.createCampaign("admin@example.invalid", {
      name: "Synthetic baseline",
      privacy: model.PRIVACY,
      closesAt: new Date(Date.now() + 86400000).toISOString(),
    });
    await service.importRoster(
      "admin@example.invalid",
      c.campaignId,
      "name,email,job_title,country,region,entity,work_type\nPerson A,a@example.invalid,Reception coordinator,GB,Test region,Test business,reception\nPerson B,b@example.invalid,People technology specialist,NL,Test region,Test business,people_technology",
    );
    await service.configureCampaign("admin@example.invalid", c.campaignId, {
      status: "open",
    });
    const rows = await service.campaignRows(c.campaignId),
      a = rows.participants.find((p) => p.email === "a@example.invalid"),
      b = rows.participants.find((p) => p.email === "b@example.invalid");
    const link = await service.invite(
      "admin@example.invalid",
      c.campaignId,
      a.participant_id,
      false,
    );
    return { campaign: c.campaignId, a, b, token: link.link.split("#")[1] };
  }
  async function access(token) {
    const result = await service.redeem(request({}), token);
    state.cookie = result.session;
    return service.participant(request({}));
  }
  function complete(draft) {
    draft.privacyAcknowledged = true;
    draft.profile.manages_people = "no";
    draft.scope = { reach: "all_group", entities: [] };
    draft.areas = ["office_01"];
    draft.allocation = { office_01: 100 };
    draft.details = {
      office_01: {
        description: "Welcome visitors and manage the reception desk.",
        frequency: "most_days",
        role: "administration_support",
        handoffs: ["local_office"],
        other: "",
      },
    };
    draft.cyclical.answer = "no";
    draft.systems = ["Excel"];
    draft.knowledge = ["office_facilities"];
    draft.channels = ["in_person_phone"];
    draft.channelAllocation = { in_person_phone: 100 };
    return draft;
  }
  return {
    sqlite,
    db,
    env,
    state,
    service,
    model,
    prototype,
    collection: load("lib/baseline/collection.ts"),
    route,
    adminRoute,
    request,
    setup,
    access,
    complete,
  };
}
test("Roster template downloads require advisor access and contain the supported import headers", async () => {
  const h=harness();
  try {
    const request=()=>new Request("https://qa.example.invalid/advisor/baseline/api/roster-template");
    const context={params:Promise.resolve({path:["roster-template"]})};
    h.state.admin=false;
    assert.equal((await h.adminRoute.GET(request(),context)).status,403);
    h.state.admin=true;
    const response=await h.adminRoute.GET(request(),context);
    assert.equal(response.status,200);
    assert.match(response.headers.get("content-type"),/text\/csv/);
    assert.match(response.headers.get("content-disposition"),/baseline-roster-template.csv/);
    const fields=(await response.text()).trim().split(",");
    for(const field of ["name","email","country","region","manages_people","direct_reports","job_level","manager_name","contracted_hours","working_fraction"])assert.ok(fields.includes(field));
    assert.equal(h.state.emails.length,0);
  } finally {h.sqlite.close();}
});
test("Baseline activity choices cover hybrid roles and map reception/facilities to Operations", () => {
  const h = harness(),
    m = h.model;
  assert.equal(m.pillar("reception"), "people_operations");
  assert.equal(m.pillar("facilities"), "people_operations");
  assert.equal(m.pillar("mixed"), null);
  assert.ok(m.availableAreas("reception").some((a) => a.category === "bp"));
  assert.ok(
    m
      .availableAreas("business_partnering")
      .some((a) => a.category === "office"),
  );
  assert.equal(m.availableAreas("mixed").length, m.AREAS.length);
  for (const [type] of m.WORK_TYPES)
    assert.equal(m.availableAreas(type).length, m.AREAS.length);
  for (const code of ["bp_02", "ops_07", "ops_18", "office_01"])
    assert.ok(m.availableAreas("reception").some((a) => a.code === code));
  assert.ok(
    m
      .availableAreas("reception", false, "integrations")
      .some((a) => a.category === "tech"),
  );
  assert.equal(new Set(m.AREAS.map((a) => a.code)).size, m.AREAS.length);
  h.sqlite.close();
});
test("Baseline validates approximate percentages, detail limits, version and five channels", () => {
  const h = harness(),
    m = h.model;
  const draft = h.complete(
    m.initialDraft({
      name: "Test",
      email: "a@example.invalid",
      job_title: "Current role",
      country: "GB",
      work_type: "reception",
    }),
  );
  assert.equal(m.completionError(draft), null);
  draft.allocation.office_01 = 97;
  assert.match(m.completionError(draft), /100%/);
  draft.allocation.office_01 = 99.5;
  assert.equal(m.completionError(draft), null);
  assert.throws(() =>
    m.parseDraft({
      ...draft,
      channels: ["email", "chat", "project", "ticket", "planned", "employees"],
    }),
  );
  assert.throws(() => m.parseDraft({ ...draft, version: "other-version" }));
  assert.throws(() =>
    m.parseDraft({ ...draft, allocation: { office_01: Infinity } }),
  );
  draft.areas = m.AREAS.slice(0, 8).map((a) => a.code);
  draft.allocation = Object.fromEntries(draft.areas.map((c, i) => [c, 8 - i]));
  draft.important = draft.areas.slice(3, 5);
  assert.equal(m.detailCodes(draft).length, 5);
  h.sqlite.close();
});
test("Baseline CSV imports and exports handle quotes, duplicate mailboxes and formula injection", () => {
  const h = harness(),
    m = h.model;
  const rows = m.parseRoster(
    'name,email,job_title,country\r\n"Person, A",TEST@example.invalid,"Title with ""quotes""",GB\r\n',
  );
  assert.equal(rows[0].email, "test@example.invalid");
  assert.equal(rows[0].name, "Person, A");
  assert.throws(() =>
    m.parseRoster("name,email\nA,a@example.invalid\nB,A@example.invalid"),
  );
  assert.throws(() => m.parseRoster('name,email\n"A,a@example.invalid'));
  assert.match(
    m.toCsv([{ name: "=SUM(1,2)", email: "test@example.invalid", time: 20 }]),
    /'=SUM/,
  );
  assert.match(m.csvCell(" \t@formula"), /'/);
  h.sqlite.close();
});
test("Baseline private invitations are hashed, scope sessions, expire, revoke and rate-limit", async () => {
  const h = harness();
  try {
    const { campaign, a, token } = await h.setup();
    assert.equal(token.length, 64);
    const stored = h.sqlite
      .prepare("SELECT token_hash FROM tb_baseline_invites")
      .get();
    assert.notEqual(stored.token_hash, token);
    assert.equal(stored.token_hash, h.service.hashToken(token));
    const p = await h.access(token);
    assert.equal(p.participant_id, a.participant_id);
    assert.equal((await h.service.readResponse(p)).draft.profile.email, "");
    await assert.rejects(h.service.redeem(h.request({}), "0".repeat(64)));
    await h.service.revoke("admin@example.invalid", campaign, a.participant_id);
    await assert.rejects(h.service.participant(h.request({})));
    for (let i = 0; i < 150; i++)
      try {
        await h.service.redeem(h.request({}), "bad");
      } catch (e) {
        if (e.status === 429) return;
      }
    assert.fail("Rate limiter did not block");
  } finally {
    h.sqlite.close();
  }
});
test("Baseline autosaves are atomic, resumable and reject stale revisions without changing child rows", async () => {
  const h = harness();
  try {
    const { token } = await h.setup(),
      p = await h.access(token),
      data = await h.service.readResponse(p),
      draft = h.complete(data.draft);
    draft.strengths = "Local office knowledge works well.";
    const saved = await h.service.saveResponse(p, draft, 0, 3);
    assert.equal(saved.revision, 1);
    const resumed = await h.service.readResponse(p);
    assert.equal(resumed.progress, 3);
    assert.equal(resumed.draft.strengths, draft.strengths);
    const losing = structuredClone(draft);
    losing.allocation.office_01 = 5;
    await assert.rejects(
      h.service.saveResponse(p, losing, 0, 1),
      (e) => e.status === 409,
    );
    assert.equal(
      h.sqlite.prepare("SELECT percentage FROM tb_baseline_work").get()
        .percentage,
      100,
    );
    const submitted = await h.service.saveResponse(p, draft, 1, 8, true);
    assert.equal(submitted.status, "completed");
    await assert.rejects(h.service.saveResponse(p, draft, 2, 8));
    assert.equal(
      h.sqlite
        .prepare(
          "SELECT count(*) AS n FROM tb_baseline_audit WHERE action='submitted'",
        )
        .get().n,
      1,
    );
  } finally {
    h.sqlite.close();
  }
});
test("Baseline enforces identity on save, revocation during save, admin authorization and same-origin requests", async () => {
  const h = harness();
  try {
    const { campaign, a, b, token } = await h.setup();
    let p = await h.access(token);
    const draft = h.complete((await h.service.readResponse(p)).draft);
    draft.profile.email = "b@example.invalid";
    await h.service.saveResponse(p, draft, 0, 1);
    assert.equal((await h.service.readResponse(p)).draft.profile.email, "");
    assert.equal(
      h.sqlite
        .prepare(
          "SELECT revision FROM tb_baseline_responses WHERE participant_id=?",
        )
        .get(b.participant_id).revision,
      0,
    );
    await h.service.revoke("admin@example.invalid", campaign, a.participant_id);
    await assert.rejects(h.service.saveResponse(p, draft, 1, 1));
    h.state.admin = false;
    const forbidden = await h.route.GET(
      new Request("https://qa.example.invalid/api/baseline/admin/campaigns"),
      { params: Promise.resolve({ path: ["admin", "campaigns"] }) },
    );
    assert.equal(forbidden.status, 403);
    const crossSite = new Request(
      "https://qa.example.invalid/api/baseline/access",
      {
        method: "POST",
        headers: {
          origin: "https://evil.example.invalid",
          "content-type": "application/json",
        },
        body: JSON.stringify({ token }),
      },
    );
    assert.equal(
      (
        await h.route.POST(crossSite, {
          params: Promise.resolve({ path: ["access"] }),
        })
      ).status,
      403,
    );
    h.env.BASELINE_ENABLED = "false";
    assert.throws(() => h.service.baselineEnv());
  } finally {
    h.sqlite.close();
  }
});
test("Baseline export excludes security tokens and preserves classification, hand-offs and audit records", async () => {
  const h = harness();
  try {
    const { campaign, token } = await h.setup(),
      p = await h.access(token),
      draft = h.complete((await h.service.readResponse(p)).draft);
    await h.service.saveResponse(p, draft, 0, 8, true);
    const exported = JSON.parse(
      await h.service.exportDataset("admin@example.invalid", campaign, "json"),
    );
    assert.equal(exported.activities[0].activity_pillar, "people_operations");
    assert.equal(exported.activities[0].work_type, "reception");
    assert.equal(exported.activities[0].handoffs[0], "local_office");
    assert.equal(
      exported.respondents[0].questionnaire_version,
      h.model.VERSION,
    );
    assert.ok(!JSON.stringify(exported).includes(token));
    assert.ok(!JSON.stringify(exported).includes("token_hash"));
    assert.equal(
      h.sqlite
        .prepare(
          "SELECT count(*) AS n FROM tb_baseline_audit WHERE action='dataset_exported'",
        )
        .get().n,
      1,
    );
    await assert.rejects(
      h.service.invite(
        "admin@example.invalid",
        campaign,
        p.participant_id,
        true,
      ),
    );
    assert.equal(h.state.emails.length, 0);
  } finally {
    h.sqlite.close();
  }
});
test("Baseline access cookie is secure; replacement, expiry and logout invalidate server sessions", async () => {
  const h = harness();
  try {
    const { campaign, a, token } = await h.setup();
    const response = await h.route.POST(h.request({ token }), {
      params: Promise.resolve({ path: ["access"] }),
    });
    assert.equal(response.status, 200);
    assert.equal(h.state.cookieOptions.httpOnly, true);
    assert.equal(h.state.cookieOptions.secure, true);
    assert.equal(h.state.cookieOptions.sameSite, "strict");
    assert.equal(h.state.cookieOptions.path, "/");
    assert.ok(!response.headers.get("set-cookie").includes(token));
    const oldSession = h.state.cookie;
    const replacement = await h.service.invite(
      "admin@example.invalid",
      campaign,
      a.participant_id,
      false,
    );
    await assert.rejects(h.service.participant(h.request({})));
    await assert.rejects(h.service.redeem(h.request({}), token));
    await h.access(replacement.link.split("#")[1]);
    const newSession = h.state.cookie;
    await h.service.endSession();
    h.state.cookie = newSession;
    await assert.rejects(h.service.participant(h.request({})));
    assert.notEqual(oldSession, newSession);
    h.sqlite
      .prepare(
        "UPDATE tb_baseline_invites SET expires_at='2000-01-01T00:00:00.000Z'",
      )
      .run();
    await assert.rejects(
      h.service.redeem(h.request({}), replacement.link.split("#")[1]),
    );
  } finally {
    h.sqlite.close();
  }
});
test("Baseline duplicate roster import is atomic and privacy/version cannot silently change", async () => {
  const h = harness();
  try {
    const { campaign, token } = await h.setup(),
      p = await h.access(token);
    const draft = h.complete((await h.service.readResponse(p)).draft);
    await assert.rejects(
      h.service.importRoster(
        "admin@example.invalid",
        campaign,
        "name,email\nNew,new@example.invalid\nDuplicate,a@example.invalid",
      ),
    );
    assert.equal(
      h.sqlite
        .prepare("SELECT count(*) AS n FROM tb_baseline_participants")
        .get().n,
      2,
    );
    await assert.rejects(
      h.service.configureCampaign("admin@example.invalid", campaign, {
        privacy: h.model.PRIVACY + " Changed.",
      }),
    );
    await h.service.configureCampaign("admin@example.invalid", campaign, {
      status: "closed",
    });
    await assert.rejects(h.service.saveResponse(p, draft, 0, 1));
    const oversized = new Request(
      "https://qa.example.invalid/api/baseline/save",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: "x".repeat(80000) }),
      },
    );
    await assert.rejects(
      h.service.readBody(oversized),
      (e) => e.status === 413,
    );
  } finally {
    h.sqlite.close();
  }
});
test("Baseline exports operational BP work as Operations and preserves captured labels", async () => {
  const h = harness();
  try {
    const { campaign, token } = await h.setup(),
      p = await h.access(token),
      draft = h.complete((await h.service.readResponse(p)).draft);
    const roster = JSON.parse(p.profile_json);
    roster.work_type = "business_partnering";
    p.profile_json = JSON.stringify(roster);
    draft.profile.work_type = "business_partnering";
    draft.areas = ["bp_13"];
    draft.allocation = { bp_13: 100 };
    draft.details = { bp_13: draft.details.office_01 };
    await h.service.saveResponse(p, draft, 0, 8, true);
    h.model.AREAS.find((a) => a.code === "bp_13").label =
      "A later display label";
    const exported = JSON.parse(
      await h.service.exportDataset("admin@example.invalid", campaign, "json"),
    );
    assert.equal(exported.activities[0].primary_pillar, "business_partnering");
    assert.equal(exported.activities[0].activity_pillar, "people_operations");
    assert.equal(
      exported.activities[0].area_label,
      "Operational People administration",
    );
    assert.equal(
      exported.questionnaire.areas.find((a) => a.code === "bp_13").label,
      "Operational People administration",
    );
  } finally {
    h.sqlite.close();
  }
});
test("Baseline administration stays under the page's Access path and still requires an advisor", async () => {
  const h = harness();
  try {
    await h.setup();
    const request = new Request(
      "https://qa.example.invalid/advisor/baseline/api/campaigns",
    );
    const allowed = await h.adminRoute.GET(request, {
      params: Promise.resolve({ path: ["campaigns"] }),
    });
    assert.equal(allowed.status, 200);
    assert.equal((await allowed.json()).campaigns.length, 1);
    h.state.admin = false;
    const blocked = await h.adminRoute.GET(request, {
      params: Promise.resolve({ path: ["campaigns"] }),
    });
    assert.equal(blocked.status, 403);
    const create = await h.adminRoute.POST(
      h.request({ name: "Unauthorised" }),
      { params: Promise.resolve({ path: ["create"] }) },
    );
    assert.equal(create.status, 403);
    const panel = fs.readFileSync(
      path.join(root, "app/advisor/baseline/panel.tsx"),
      "utf8",
    );
    assert.ok(!panel.includes("/api/baseline/admin/"));
    assert.ok(panel.includes("/advisor/baseline/api/"));
  } finally {
    h.sqlite.close();
  }
});

test("Expanded roster validates hours and imports metadata atomically without exposing it to respondents", async () => {
  const h = harness();
  try {
    const c = await h.service.createCampaign("admin@example.invalid", {
      name: "Roster QA",
      privacy: h.model.PRIVACY,
      closesAt: new Date(Date.now() + 86400000).toISOString(),
    });
    const csv =
      "name,email,country,region,manages_people,direct_reports,participant_reference,division,brand,team,manager_email,contracted_hours,full_time_hours,working_fraction\nPerson,a@example.invalid,GB,North,yes,3,REF1,Division A,Brand A,Team A,manager@example.invalid,32,40,0.8";
    const preview = await h.service.previewRoster(c.campaignId, csv);
    assert.equal(preview.canImport, true);
    assert.equal(preview.count, 1);
    assert.equal(
      h.sqlite
        .prepare("SELECT count(*) AS n FROM tb_baseline_participants")
        .get().n,
      0,
    );
    await h.service.importRoster("admin@example.invalid", c.campaignId, csv);
    const p = (await h.service.campaignRows(c.campaignId)).participants[0];
    assert.equal(p.roster.contracted_hours, "32");
    assert.equal(p.roster.working_fraction, "0.8");
    assert.ok(!("manager_email" in p.profile));
    assert.ok(!("contracted_hours" in p.draft.profile));
    const dup = await h.service.previewRoster(c.campaignId, csv);
    assert.equal(dup.canImport, false);
    assert.equal(dup.duplicates.length, 1);
    assert.throws(
      () => h.model.parseRoster(csv.replace("32,40,0.8", "32,40,0.5")),
      /fraction/,
    );
    assert.throws(
      () =>
        h.model.parseRoster(
          csv.replace("manager@example.invalid", "bad-address"),
        ),
      /manager_email/,
    );
    assert.throws(
      () =>
        h.model.parseRoster("name,email,health\nPerson,x@example.invalid,none"),
      /Unknown CSV columns/,
    );
    await h.service.configureCampaign("admin@example.invalid", c.campaignId, {
      status: "open",
    });
    const link = await h.service.invite(
        "admin@example.invalid",
        c.campaignId,
        p.participant_id,
        false,
      ),
      identity = await h.access(link.link.split("#")[1]);
    const response = await h.service.readResponse(identity);
    assert.equal(response.draft.profile.email, "");
    assert.ok(!("roster" in response));
    const exported = JSON.parse(
      await h.service.exportDataset(
        "admin@example.invalid",
        c.campaignId,
        "json",
      ),
    );
    assert.equal(exported.respondents[0].participant_reference, "REF1");
    assert.equal(exported.respondents[0].working_fraction, "0.8");
  } finally {
    h.sqlite.close();
  }
});
test("Respondent edits protect concurrent work, revoke changed addresses and retain answers on removal", async () => {
  const h = harness();
  try {
    const { campaign, a, token } = await h.setup();
    const identity = await h.access(token);
    const before = await h.service.readResponse(identity);
    await h.service.saveResponse(identity, before.draft, 0, 1, false);
    let p = (await h.service.campaignRows(campaign)).participants.find(
      (p) => p.participant_id === a.participant_id,
    );
    const original = p.draft;
    await assert.rejects(
      h.service.changeParticipant(
        "admin@example.invalid",
        campaign,
        p.participant_id,
        {
          action: "edit",
          revision: 0,
          csv: "name,email\nNew,new@example.invalid",
        },
      ),
      (e) => e.status === 409,
    );
    await h.service.changeParticipant(
      "admin@example.invalid",
      campaign,
      p.participant_id,
      {
        action: "edit",
        revision: p.revision,
        csv: "name,email,manages_people,contracted_hours\nNew,new@example.invalid,no,35",
      },
    );
    await assert.rejects(
      h.service.participant(h.request({})),
      (e) => e.status === 401,
    );
    await assert.rejects(
      h.service.redeem(h.request({}), token),
      (e) => e.status === 403,
    );
    p = (await h.service.campaignRows(campaign)).participants.find(
      (p) => p.participant_id === a.participant_id,
    );
    assert.equal(p.email, "new@example.invalid");
    assert.equal(p.draft.anything, original.anything);
    assert.equal(p.roster.contracted_hours, "35");
    await assert.rejects(
      h.service.changeParticipant(
        "admin@example.invalid",
        campaign,
        p.participant_id,
        {
          action: "edit",
          revision: p.revision,
          csv: "name,email\nDup,b@example.invalid",
        },
      ),
      (e) => e.status === 409,
    );
    await h.service.changeParticipant(
      "admin@example.invalid",
      campaign,
      p.participant_id,
      { action: "remove", revision: p.revision },
    );
    p = (await h.service.campaignRows(campaign)).participants.find(
      (p) => p.participant_id === a.participant_id,
    );
    assert.equal(p.active, 0);
    assert.equal(p.status, "in_progress");
    await h.service.changeParticipant(
      "admin@example.invalid",
      campaign,
      p.participant_id,
      { action: "reinstate", revision: p.revision },
    );
    await assert.rejects(
      h.service.redeem(h.request({}), token),
      (e) => e.status === 403,
    );
    const events = h.sqlite
      .prepare("SELECT action FROM tb_baseline_audit WHERE subject_id=?")
      .all(p.participant_id)
      .map((x) => x.action);
    assert.ok(events.includes("participant_edit"));
    assert.ok(events.includes("participant_remove"));
    assert.ok(events.includes("participant_reinstate"));
  } finally {
    h.sqlite.close();
  }
});
test("Named dashboards show small groups and bind regional visibility to CSV leader assignments", async () => {
  const h = harness();
  try {
    const { campaign } = await h.setup();
    await h.service.importRoster(
      "admin@example.invalid",
      campaign,
      "name,email,country,region,entity,team,regional_leader_name,regional_leader_email\nC,c@example.invalid,GB,North,Entity A,Team A,Leader A,leader.a@example.invalid\nD,d@example.invalid,GB,North,Entity A,Team A,Leader A,leader.a@example.invalid\nE,e@example.invalid,GB,North,Entity A,Team B,Leader B,leader.b@example.invalid\nF,f@example.invalid,GB,North,Entity A,Team A,Leader A,leader.a@example.invalid\nG,g@example.invalid,GB,North,Entity A,Team A,Leader A,leader.a@example.invalid",
    );
    const rows = (await h.service.campaignRows(campaign)).participants;
    for (const p of rows)
      await h.service.invite(
        "admin@example.invalid",
        campaign,
        p.participant_id,
        false,
      );
    const share = await h.service.createDashboardShare(
        "admin@example.invalid",
        campaign,
        {
          label: "Leader A",
          days: 7,
          scope: {
            role: "regional_lead",
            regionalLeaderEmail: "leader.a@example.invalid",
          },
        },
      ),
      token = share.link.split("#")[1];
    const report = await h.service.sharedDashboard(h.request({}), token);
    assert.equal(report.counts.invited, 4);
    assert.equal(report.groups.region[0].invited, 4);
    assert.equal(report.participants.length, 4);
    assert.ok(
      report.participants.every(
        (p) => p.regionalLeaderEmail === "leader.a@example.invalid",
      ),
    );
    assert.ok(!JSON.stringify(report).includes("e@example.invalid"));
    assert.ok(!("draft" in report));
    assert.ok(!("answers" in report));
    const leaderB = await h.service.createDashboardShare(
      "admin@example.invalid",
      campaign,
      {
        label: "Leader B",
        scope: {
          role: "regional_lead",
          regionalLeaderEmail: "leader.b@example.invalid",
        },
      },
    );
    const one = await h.service.sharedDashboard(
      h.request({}),
      leaderB.link.split("#")[1],
    );
    assert.equal(one.participants.length, 1);
    assert.equal(one.groups.region[0].invited, 1);
    const gaia = await h.service.createDashboardShare(
      "admin@example.invalid",
      campaign,
      { label: "Gaia", scope: { role: "all" } },
    );
    const all = await h.service.sharedDashboard(
      h.request({}),
      gaia.link.split("#")[1],
    );
    assert.equal(all.participants.length, 7);
    assert.equal(all.counts.invited, 7);
    await assert.rejects(
      h.service.createDashboardShare("admin@example.invalid", campaign, {
        label: "Unknown leader",
        scope: {
          role: "regional_lead",
          regionalLeaderEmail: "not-in-roster@example.invalid",
        },
      }),
    );
    await assert.rejects(
      h.service.createDashboardShare("admin@example.invalid", campaign, {
        label: "Missing role",
        scope: { regions: ["North"] },
      }),
    );
    const shares = await h.service.dashboardShares(campaign);
    assert.ok(!JSON.stringify(shares).includes(token));
    assert.ok(!JSON.stringify(shares).includes("token_hash"));
    await h.service.revokeDashboardShare(
      "admin@example.invalid",
      campaign,
      shares.find((s) => s.label === "Leader A").share_id,
    );
    await assert.rejects(
      h.service.sharedDashboard(h.request({}), token),
      (e) => e.status === 403,
    );
    h.state.admin = false;
    const anonymous = await h.route.POST(
      h.request({ token: leaderB.link.split("#")[1], scope: { role: "all" } }),
      { params: Promise.resolve({ path: ["dashboard"] }) },
    );
    assert.equal(anonymous.status, 200);
    assert.equal((await anonymous.json()).participants.length, 1);
    const admin = await h.route.POST(h.request({ campaign }), {
      params: Promise.resolve({ path: ["admin", "share"] }),
    });
    assert.equal(admin.status, 403);
    h.sqlite
      .prepare(
        "UPDATE tb_baseline_dashboard_shares SET scope_json=? WHERE label=?",
      )
      .run(
        JSON.stringify({ regions: [], countries: [], entities: [] }),
        "Gaia",
      );
    await assert.rejects(
      h.service.sharedDashboard(h.request({}), gaia.link.split("#")[1]),
      (e) => e.status === 403,
    );
  } finally {
    h.sqlite.close();
  }
});
test("Launch preflight blocks the preview questionnaire and QA delivery before any email or campaign mutation", async () => {
  const h = harness();
  try {
    const { campaign } = await h.setup();
    const ready = await h.service.launchReadiness(campaign);
    assert.equal(ready.ready, false);
    assert.ok(ready.blockers.some((b) => b.includes("versioned saving")));
    assert.ok(ready.blockers.some((b) => b.includes("preview mode")));
    await assert.rejects(
      h.service.launchCampaign("admin@example.invalid", campaign, {
        confirmation: "Synthetic baseline",
        expectedActive: 2,
      }),
      (e) => e.status === 409,
    );
    await assert.rejects(
      h.service.inviteBatch("admin@example.invalid", campaign, {
        participantIds: [],
      }),
      (e) => e.status === 409,
    );
    assert.equal(h.state.emails.length, 0);
    const events = h.sqlite
      .prepare(
        "SELECT count(*) AS n FROM tb_baseline_audit WHERE action='campaign_launched'",
      )
      .get();
    assert.equal(events.n, 0);
  } finally {
    h.sqlite.close();
  }
});

test("Production cannot open or mail the earlier questionnaire even with active D1 flags", async () => {
  const h = harness();
  try {
    const { campaign, a } = await h.setup();
    h.env.NEXT_PUBLIC_APP_ENV = "production";
    h.env.BASELINE_MAIL_MODE = "send";
    h.env.RESEND_API_KEY = "synthetic";
    h.env.CONTACT_FROM_EMAIL = "Synthetic <mail@example.invalid>";
    for (const flag of [
      "D1_SYSTEM_EVENTS_MODE",
      "D1_CRM_PROSPECTS_MODE",
      "D1_DIAGNOSTIC_SUBMISSIONS_MODE",
      "D1_CLIENT_DIAGNOSTIC_MODE",
      "D1_CLIENT_DIAGNOSTIC_SECURITY_MODE",
    ])
      h.env[flag] = "d1";
    await assert.rejects(
      h.service.configureCampaign("admin@example.invalid", campaign, {
        status: "open",
      }),
      (e) => e.status === 409,
    );
    await assert.rejects(
      h.service.invite(
        "admin@example.invalid",
        campaign,
        a.participant_id,
        true,
      ),
      (e) => e.status === 409,
    );
    assert.equal(h.state.emails.length, 0);
  } finally {
    h.sqlite.close();
  }
});

test("Invitation extension keeps the link, respects campaign closing and prevents withdrawn/completed changes", async () => {
  const h = harness();
  try {
    const { campaign, a, token } = await h.setup();
    await h.service.configureCampaign("admin@example.invalid", campaign, {
      closesAt: new Date(Date.now() + 100 * 86400000).toISOString(),
    });
    let p = (await h.service.campaignRows(campaign)).participants.find(
      (p) => p.participant_id === a.participant_id,
    );
    const prior = p.invite_expires_at;
    const extended = await h.service.extendBaselineInvite(
      "admin@example.invalid",
      campaign,
      p.participant_id,
      { revision: p.revision, days: 21 },
    );
    assert.ok(extended.expiresAt > prior);
    await h.access(token);
    await assert.rejects(
      h.service.extendBaselineInvite(
        "admin@example.invalid",
        campaign,
        p.participant_id,
        { revision: p.revision, days: 21 },
      ),
      (e) => e.status === 409,
    );
    p = (await h.service.campaignRows(campaign)).participants.find(
      (p) => p.participant_id === a.participant_id,
    );
    await assert.rejects(
      h.service.extendBaselineInvite(
        "admin@example.invalid",
        campaign,
        p.participant_id,
        { revision: p.revision, days: 0 },
      ),
    );
    await h.service.changeParticipant(
      "admin@example.invalid",
      campaign,
      p.participant_id,
      { action: "remove", revision: p.revision },
    );
    await assert.rejects(
      h.service.extendBaselineInvite(
        "admin@example.invalid",
        campaign,
        p.participant_id,
        { revision: p.revision + 1, days: 21 },
      ),
    );
    assert.equal(h.state.emails.length, 0);
    assert.equal(
      h.sqlite
        .prepare(
          "SELECT count(*) AS n FROM tb_baseline_audit WHERE action='invitation_extended'",
        )
        .get().n,
      1,
    );
  } finally {
    h.sqlite.close();
  }
});

async function reviewedSetup(
  h,
  email = "reviewed@example.invalid",
  version = h.collection.COLLECTION_VERSION,
) {
  const c = await h.service.createCampaign("admin@example.invalid", {
    questionnaireVersion: version,
    name: "Reviewed synthetic baseline",
    privacy: h.model.PRIVACY,
    closesAt: new Date(Date.now() + 86400000).toISOString(),
  });
  await h.service.importRoster(
    "admin@example.invalid",
    c.campaignId,
    "name,email,country,region,manages_people,direct_reports\nSynthetic," +
      email +
      ",GB,QA,no,0",
  );
  await h.service.configureCampaign("admin@example.invalid", c.campaignId, {
    status: "open",
  });
  const p = (await h.service.campaignRows(c.campaignId)).participants[0];
  const link = await h.service.invite(
    "admin@example.invalid",
    c.campaignId,
    p.participant_id,
    false,
  );
  return { campaign: c.campaignId, p, token: link.link.split("#")[1] };
}
function reviewedComplete(h) {
  const d = h.collection.initialCollection();
  d.started = true;
  d.broad.selected = ["office"];
  d.broad.time = { office: 100 };
  Object.assign(d.rich, {
    routes: ["work_email"],
    routeTime: { work_email: 100 },
    recording: "none",
    duplicates: "rarely",
    sameRoutes: "same",
    scope: "one",
    localNeeds: ["none"],
    systems: ["excel"],
  });
  return d;
}
test("Reviewed collection requires OTP, saves/resumes atomically and submits separate versioned evidence", async () => {
  const h = harness();
  try {
    const { campaign, p, token } = await reviewedSetup(h);
    await assert.rejects(
      h.service.redeem(h.request({}), token),
      (e) => e.status === 403,
    );
    const code = await h.service.requestVerification(
      h.request({}),
      token,
      true,
    );
    const verified = await h.route.POST(
      h.request({ token, challenge: code.challenge, code: code.code }),
      { params: Promise.resolve({ path: ["verify-code"] }) },
    );
    assert.equal(verified.status, 200);
    const identity = await h.service.participant(h.request({}));
    let response = await h.service.readResponse(identity);
    assert.equal(response.draft.version, h.collection.COLLECTION_VERSION);
    assert.ok(!("profile" in response.draft));
    assert.ok(!("email" in response.campaign));
    const d = reviewedComplete(h);
    d.rich.recording = "";
    await h.service.saveResponse(identity, d, 0, 2);
    await assert.rejects(
      h.service.saveResponse(identity, d, 0, 2),
      (e) => e.status === 409,
    );
    await assert.rejects(h.service.saveResponse(identity, d, 1, 8, true));
    d.rich.recording = "none";
    d.answerCopy = true;
    const saved = await h.service.saveResponse(identity, d, 1, 7);
    assert.equal(saved.revision, 2);
    response = await h.service.readResponse(identity);
    assert.equal(response.draft.broad.time.office, 100);
    await h.service.saveResponse(identity, d, 2, 8, true);
    await assert.rejects(
      h.service.saveResponse(identity, d, 3, 7),
      (e) => e.status === 409,
    );
    const exported = JSON.parse(
      await h.service.exportDataset("admin@example.invalid", campaign, "json"),
    );
    assert.equal(exported.activities[0].area_code, "office");
    assert.equal(exported.respondents[0].answerCopyRequested, true);
    assert.ok(!("activity_pillar" in exported.activities[0]));
    assert.equal(
      h.sqlite
        .prepare(
          "SELECT COUNT(*) AS n FROM tb_baseline_work WHERE participant_id=?",
        )
        .get(p.participant_id).n,
      0,
    );
    assert.equal(
      h.sqlite
        .prepare(
          "SELECT status FROM tb_baseline_answer_copies WHERE participant_id=?",
        )
        .get(p.participant_id).status,
      "preview",
    );
    assert.equal(h.state.emails.length, 0);
  } finally {
    h.sqlite.close();
  }
});
test("Reviewed OTPs are hashed, expire, bind to invitations, limit guesses and cannot be replayed", async () => {
  const h = harness();
  try {
    const { token } = await reviewedSetup(h);
    const c = await h.service.requestVerification(h.request({}), token, true);
    assert.notEqual(
      h.sqlite
        .prepare(
          "SELECT code_hash FROM tb_baseline_verifications WHERE challenge_id=?",
        )
        .get(c.challenge).code_hash,
      c.code,
    );
    const wrong = c.code === "000000" ? "000001" : "000000";
    for (let i = 0; i < 6; i++)
      await assert.rejects(
        h.service.verifyCode(h.request({}), token, c.challenge, wrong),
        (e) => e.status === 403,
      );
    await assert.rejects(
      h.service.verifyCode(h.request({}), token, c.challenge, c.code),
      (e) => e.status === 429 || e.status === 403,
    );
    const next = await h.service.requestVerification(
      h.request({}),
      token,
      true,
    );
    h.sqlite
      .prepare(
        "UPDATE tb_baseline_verifications SET expires_at='2000-01-01T00:00:00Z' WHERE challenge_id=?",
      )
      .run(next.challenge);
    await assert.rejects(
      h.service.verifyCode(h.request({}), token, next.challenge, next.code),
      (e) => e.status === 403,
    );
    const fresh = await h.service.requestVerification(
      h.request({}),
      token,
      true,
    );
    await h.service.verifyCode(
      h.request({}),
      token,
      fresh.challenge,
      fresh.code,
    );
    await assert.rejects(
      h.service.verifyCode(h.request({}), token, fresh.challenge, fresh.code),
      (e) => e.status === 403,
    );
  } finally {
    h.sqlite.close();
  }
});
test("A new verification code invalidates the prior challenge and leaves no plaintext code response in production", async () => {
  const h = harness();
  try {
    const greg = await reviewedSetup(
      h,
      "greg@vanesch.uk",
      h.collection.FROZEN_COLLECTION_VERSION,
    );
    h.env.NEXT_PUBLIC_APP_ENV = "production";
    for (const flag of [
      "D1_SYSTEM_EVENTS_MODE",
      "D1_CRM_PROSPECTS_MODE",
      "D1_DIAGNOSTIC_SUBMISSIONS_MODE",
      "D1_CLIENT_DIAGNOSTIC_MODE",
      "D1_CLIENT_DIAGNOSTIC_SECURITY_MODE",
    ])
      h.env[flag] = "d1";
    h.env.BASELINE_MAIL_MODE = "greg-only";
    h.env.BASELINE_TEST_CAMPAIGN_ID = greg.campaign;
    h.env.RESEND_API_KEY = "synthetic-production-mail";
    h.env.CONTACT_FROM_EMAIL = "Synthetic <mail@example.invalid>";
    const a = await h.service.requestVerification(h.request({}), greg.token);
    const codeA = h.state.emails.at(-1).text.match(/\b\d{6}\b/)[0];
    assert.equal("code" in a, false);
    const b = await h.service.requestVerification(h.request({}), greg.token);
    const codeB = h.state.emails.at(-1).text.match(/\b\d{6}\b/)[0];
    assert.notEqual(a.challenge, b.challenge);
    await assert.rejects(
      h.service.verifyCode(h.request({}), greg.token, a.challenge, codeA),
      (e) => e.status === 403,
    );
    const response = await h.route.POST(
      h.request({ token: greg.token, challenge: b.challenge, code: codeB }),
      { params: Promise.resolve({ path: ["verify-code"] }) },
    );
    assert.equal(response.status, 200);
    const cookie = response.headers.get("set-cookie");
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /Secure/i);
    assert.match(cookie, /SameSite=Strict/i);
    await assert.rejects(
      h.service.verifyCode(h.request({}), greg.token, b.challenge, codeB),
      (e) => e.status === 403,
    );
    assert.equal(h.state.emails.length, 2);
    assert.ok(
      h.state.emails.every(
        (m) => m.to === "greg@vanesch.uk" && m.replyTo === "info@vanesch.uk",
      ),
    );
  } finally {
    h.sqlite.close();
  }
});
test("Production test email requires both the exact recipient and the pinned campaign, while general invitations stay blocked", async () => {
  const h = harness();
  try {
    const ordinary = await reviewedSetup(
      h,
      "ordinary@example.invalid",
      h.collection.FROZEN_COLLECTION_VERSION,
    );
    const otherGreg = await reviewedSetup(
      h,
      "greg@vanesch.uk",
      h.collection.FROZEN_COLLECTION_VERSION,
    );
    const greg = await reviewedSetup(
      h,
      "greg@vanesch.uk",
      h.collection.FROZEN_COLLECTION_VERSION,
    );
    h.env.NEXT_PUBLIC_APP_ENV = "production";
    for (const flag of [
      "D1_SYSTEM_EVENTS_MODE",
      "D1_CRM_PROSPECTS_MODE",
      "D1_DIAGNOSTIC_SUBMISSIONS_MODE",
      "D1_CLIENT_DIAGNOSTIC_MODE",
      "D1_CLIENT_DIAGNOSTIC_SECURITY_MODE",
    ])
      h.env[flag] = "d1";
    h.env.BASELINE_MAIL_MODE = "greg-only";
    h.env.BASELINE_TEST_CAMPAIGN_ID = greg.campaign;
    h.env.RESEND_API_KEY = "synthetic-production-mail";
    h.env.CONTACT_FROM_EMAIL = "Synthetic <mail@example.invalid>";
    for (const f of [ordinary, otherGreg]) {
      await assert.rejects(
        h.service.requestVerification(h.request({}), f.token),
        (e) => e.status === 403,
      );
      await assert.rejects(
        h.service.qaTestInvitation(h.request({}), f.token),
        (e) => e.status === 403,
      );
      await assert.rejects(
        h.service.invite(
          "admin@example.invalid",
          f.campaign,
          f.p.participant_id,
          true,
        ),
      );
      assert.equal((await h.service.launchReadiness(f.campaign)).ready, false);
    }
    assert.equal(h.state.emails.length, 0);
    await h.service.qaTestInvitation(h.request({}), greg.token);
    await assert.rejects(
      h.service.qaTestInvitation(h.request({}), greg.token),
      (e) => e.status === 409,
    );
    assert.equal(h.state.emails.length, 1);
    assert.equal((await h.service.launchReadiness(greg.campaign)).ready, true);
    h.env.BASELINE_MAIL_MODE = "preview";
    await assert.rejects(
      h.service.requestVerification(h.request({}), greg.token),
      (e) => e.status === 403,
    );
  } finally {
    h.sqlite.close();
  }
});
test("QA actual mail is exact-recipient restricted and once-only for invite and code", async () => {
  const h = harness();
  try {
    h.env.BASELINE_QA_EMAIL_TESTS = "greg-only";
    h.env.BASELINE_QA_RESEND_API_KEY = "synthetic-mail-key";
    h.env.CONTACT_FROM_EMAIL = "Synthetic <mail@example.invalid>";
    const ordinary = await reviewedSetup(h);
    await assert.rejects(
      h.service.qaTestInvitation(h.request({}), ordinary.token),
      (e) => e.status === 403,
    );
    assert.equal(h.state.emails.length, 0);
    const greg = await reviewedSetup(h, "greg@vanesch.uk");
    await h.service.qaTestInvitation(h.request({}), greg.token);
    const sentCode = await h.service.requestVerification(
      h.request({}),
      greg.token,
    );
    assert.equal(h.state.emails.length, 2);
    assert.ok(
      h.state.emails.every(
        (m) => m.to === "greg@vanesch.uk" && m.replyTo === "info@vanesch.uk",
      ),
    );
    await assert.rejects(
      h.service.qaTestInvitation(h.request({}), greg.token),
      (e) => e.status === 409,
    );
    const reused = await h.service.requestVerification(
      h.request({}),
      greg.token,
    );
    assert.equal(reused.challenge, sentCode.challenge);
    assert.equal(h.state.emails.length, 2);
    h.env.NEXT_PUBLIC_APP_ENV = "production";
    for (const flag of [
      "D1_SYSTEM_EVENTS_MODE",
      "D1_CRM_PROSPECTS_MODE",
      "D1_DIAGNOSTIC_SUBMISSIONS_MODE",
      "D1_CLIENT_DIAGNOSTIC_MODE",
      "D1_CLIENT_DIAGNOSTIC_SECURITY_MODE",
    ])
      h.env[flag] = "d1";
    await assert.rejects(
      h.service.qaTestInvitation(h.request({}), greg.token),
      (e) => e.status === 403,
    );
  } finally {
    h.sqlite.close();
  }
});

test("Toni IT invitation is once-only, production-only and exact recipient/campaign restricted; OTP still requires his request", async () => {
  const h = harness();
  try {
    const base = await reviewedSetup(h, "synthetic@example.invalid", h.collection.FROZEN_COLLECTION_VERSION);
    const campaign="55000002-2026-4019-8040-000000000001", person="55000002-2026-4019-8040-000000000002";
    const token=require("node:crypto").randomBytes(32).toString("hex");
    h.sqlite.prepare("INSERT INTO tb_baseline_campaigns SELECT ?,name,version,status,closes_at,privacy_notice,retention_days,created_at,entities_json FROM tb_baseline_campaigns WHERE campaign_id=?").run(campaign,base.campaign);
    h.sqlite.prepare("INSERT INTO tb_baseline_participants SELECT ?,?,email,profile_json,active,created_at FROM tb_baseline_participants WHERE participant_id=?").run(person,campaign,base.p.participant_id);
    h.sqlite.prepare("UPDATE tb_baseline_participants SET email=? WHERE participant_id=?").run("antoni.serra@team.blue",person);
    h.sqlite.prepare("INSERT INTO tb_baseline_responses SELECT ?,version,status,progress,revision,mutation_id,draft_json,updated_at,submitted_at FROM tb_baseline_responses WHERE participant_id=?").run(person,base.p.participant_id);
    h.sqlite.prepare("INSERT INTO tb_baseline_invites VALUES(?,?,?,?,NULL,?)").run(require("node:crypto").randomUUID(),person,h.service.hashToken(token),new Date(Date.now()+86400000).toISOString(),new Date().toISOString());
    await assert.rejects(h.service.qaTestInvitation(h.request({}),token),e=>e.status===403);
    await assert.rejects(h.service.requestVerification(h.request({}),token),e=>e.status===403);
    h.env.NEXT_PUBLIC_APP_ENV="production";
    for(const flag of ["D1_SYSTEM_EVENTS_MODE","D1_CRM_PROSPECTS_MODE","D1_DIAGNOSTIC_SUBMISSIONS_MODE","D1_CLIENT_DIAGNOSTIC_MODE","D1_CLIENT_DIAGNOSTIC_SECURITY_MODE"])h.env[flag]="d1";
    h.env.BASELINE_MAIL_MODE="greg-only";
    h.env.BASELINE_TEST_CAMPAIGN_ID="55000001-2026-4017-8040-000000000001";
    h.env.RESEND_API_KEY="synthetic-mail";h.env.CONTACT_FROM_EMAIL="Synthetic <info@example.invalid>";
    // Wrong identity in the otherwise authorised campaign remains blocked.
    h.sqlite.prepare("UPDATE tb_baseline_participants SET email=? WHERE participant_id=?").run("someone@team.blue",person);
    await assert.rejects(h.service.qaTestInvitation(h.request({}),token),e=>e.status===403);
    await assert.rejects(h.service.requestVerification(h.request({}),token),e=>e.status===403);
    h.sqlite.prepare("UPDATE tb_baseline_participants SET email=? WHERE participant_id=?").run("antoni.serra@team.blue",person);
    // Toni's address in an ordinary campaign does not gain any mail permission.
    h.sqlite.prepare("UPDATE tb_baseline_participants SET email=? WHERE participant_id=?").run("antoni.serra@team.blue",base.p.participant_id);
    await assert.rejects(h.service.requestVerification(h.request({}),base.token),e=>e.status===403);
    assert.equal(h.state.emails.length,0);
    await h.service.qaTestInvitation(h.request({}),token);
    assert.equal(h.state.emails.length,1);
    assert.equal(h.state.emails[0].to,"antoni.serra@team.blue");
    assert.match(h.state.emails[0].subject,/Your current work baseline/);
    assert.equal(h.sqlite.prepare("SELECT count(*) n FROM tb_baseline_verifications").get().n,0);
    await assert.rejects(h.service.qaTestInvitation(h.request({}),token),e=>e.status===409);
    assert.equal(h.state.emails.length,1);
    const code=await h.service.requestVerification(h.request({}),token);
    assert.equal("code" in code,false);
    assert.equal(h.state.emails.length,2);
    assert.equal(h.state.emails[1].to,"antoni.serra@team.blue");
    const otp=h.state.emails[1].text.match(/\b\d{6}\b/)[0];
    const access=await h.service.verifyCode(h.request({}),token,code.challenge,otp);
    h.state.cookie=access.session;
    assert.equal((await h.service.readResponse(await h.service.participant(h.request({})))).status,"not_started");
    assert.equal(h.sqlite.prepare("SELECT count(*) n FROM tb_baseline_qa_mail_tests").get().n,0);
    h.env.BASELINE_MAIL_MODE="preview";
    await assert.rejects(h.service.requestVerification(h.request({}),token),e=>e.status===403);
  } finally {h.sqlite.close();}
});
test("Normal production sending permits Greg's team.blue invitation and OTP, with no automatic invitations to other recipients", async () => {
  const h=harness();
  try {
    const base=await reviewedSetup(h,"synthetic@example.invalid",h.collection.FROZEN_COLLECTION_VERSION);
    const ordinary=await reviewedSetup(h,"ordinary@example.invalid",h.collection.FROZEN_COLLECTION_VERSION);
    const campaign="55000003-2026-4019-8040-000000000001",person="55000003-2026-4019-8040-000000000002",token=require("node:crypto").randomBytes(32).toString("hex");
    h.sqlite.prepare("INSERT INTO tb_baseline_campaigns SELECT ?,name,version,status,closes_at,privacy_notice,retention_days,created_at,entities_json FROM tb_baseline_campaigns WHERE campaign_id=?").run(campaign,base.campaign);
    h.sqlite.prepare("INSERT INTO tb_baseline_participants SELECT ?,?,email,profile_json,active,created_at FROM tb_baseline_participants WHERE participant_id=?").run(person,campaign,base.p.participant_id);
    h.sqlite.prepare("UPDATE tb_baseline_participants SET email=? WHERE participant_id=?").run("Greg.vanesch@team.blue",person);
    h.sqlite.prepare("INSERT INTO tb_baseline_responses SELECT ?,version,status,progress,revision,mutation_id,draft_json,updated_at,submitted_at FROM tb_baseline_responses WHERE participant_id=?").run(person,base.p.participant_id);
    h.sqlite.prepare("INSERT INTO tb_baseline_invites VALUES(?,?,?,?,NULL,?)").run(require("node:crypto").randomUUID(),person,h.service.hashToken(token),new Date(Date.now()+86400000).toISOString(),new Date().toISOString());
    await assert.rejects(h.service.qaTestInvitation(h.request({}),token),e=>e.status===403);
    h.env.NEXT_PUBLIC_APP_ENV="production";
    for(const flag of ["D1_SYSTEM_EVENTS_MODE","D1_CRM_PROSPECTS_MODE","D1_DIAGNOSTIC_SUBMISSIONS_MODE","D1_CLIENT_DIAGNOSTIC_MODE","D1_CLIENT_DIAGNOSTIC_SECURITY_MODE"])h.env[flag]="d1";
    h.env.BASELINE_MAIL_MODE="send";
    h.env.BASELINE_TEST_CAMPAIGN_ID="55000001-2026-4017-8040-000000000001";
    h.env.RESEND_API_KEY="synthetic-mail";h.env.CONTACT_FROM_EMAIL="Synthetic <notifications@example.invalid>";
    assert.equal(h.state.emails.length,0);
    assert.equal((await h.service.launchReadiness(ordinary.campaign)).ready,true);
    assert.equal(h.state.emails.length,0);
    await h.service.qaTestInvitation(h.request({}),token);
    await assert.rejects(h.service.qaTestInvitation(h.request({}),token),e=>e.status===409);
    assert.equal(h.state.emails.length,1);assert.equal(h.state.emails[0].to,"Greg.vanesch@team.blue");
    const code=await h.service.requestVerification(h.request({}),token);
    assert.equal("code" in code,false);assert.equal(h.state.emails.length,2);
    assert.ok(h.state.emails.every(m=>m.to==="Greg.vanesch@team.blue"));
    const access=await h.service.verifyCode(h.request({}),token,code.challenge,h.state.emails[1].text.match(/\b\d{6}\b/)[0]);
    h.state.cookie=access.session;
    assert.equal((await h.service.readResponse(await h.service.participant(h.request({})))).status,"not_started");
  } finally {h.sqlite.close();}
});
test("Requested copy recovery is participant-authenticated, campaign-restricted and once-only", async () => {
  const h = harness();
  try {
    const identities = [];
    for (const email of [
      "ordinary@example.invalid",
      "greg@vanesch.uk",
      "greg@vanesch.uk",
    ]) {
      const setup = await reviewedSetup(h, "identity-" + identities.length + "@example.invalid");
      const code = await h.service.requestVerification(
        h.request({}),
        setup.token,
        true,
      );
      const access = await h.service.verifyCode(
        h.request({}),
        setup.token,
        code.challenge,
        code.code,
      );
      h.state.cookie = access.session;
      h.sqlite.prepare("UPDATE tb_baseline_participants SET email=? WHERE participant_id=?").run(email, setup.p.participant_id);
      identities.push({
        ...setup,
        identity: await h.service.participant(h.request({})),
        session: access.session,
      });
    }
    const greg = identities[2];
    h.env.NEXT_PUBLIC_APP_ENV = "production";
    for (const flag of [
      "D1_SYSTEM_EVENTS_MODE",
      "D1_CRM_PROSPECTS_MODE",
      "D1_DIAGNOSTIC_SUBMISSIONS_MODE",
      "D1_CLIENT_DIAGNOSTIC_MODE",
      "D1_CLIENT_DIAGNOSTIC_SECURITY_MODE",
    ])
      h.env[flag] = "d1";
    h.env.BASELINE_MAIL_MODE = "preview";
    h.env.BASELINE_TEST_CAMPAIGN_ID = greg.campaign;
    h.env.RESEND_API_KEY = "synthetic-production-mail";
    h.env.CONTACT_FROM_EMAIL = "Synthetic <sender@example.invalid>";
    for (const f of identities) {
      const draft = reviewedComplete(h);
      draft.answerCopy = true;
      assert.equal(
        (await h.service.saveResponse(f.identity, draft, 0, 8, true))
          .copyStatus,
        "disabled",
      );
      assert.equal(
        (await h.service.readResponse(f.identity)).copyStatus,
        "disabled",
      );
    }
    assert.equal(h.state.emails.length, 0);
    h.env.BASELINE_MAIL_MODE = "greg-only";
    for (const f of identities.slice(0, 2)) {
      assert.equal(
        (await h.service.requestAnswerCopy(f.identity)).copyStatus,
        "disabled",
      );
      assert.equal(
        h.sqlite
          .prepare(
            "SELECT attempts FROM tb_baseline_answer_copies WHERE participant_id=?",
          )
          .get(f.p.participant_id).attempts,
        0,
      );
    }
    assert.equal(
      (await h.service.readResponse(greg.identity)).copyStatus,
      "pending",
    );
    h.state.cookie = "";
    assert.equal(
      (
        await h.route.POST(h.request({}), {
          params: Promise.resolve({ path: ["answer-copy"] }),
        })
      ).status,
      401,
    );
    h.state.cookie = greg.session;
    const result = await h.route.POST(
      h.request({ recipient: "other@example.invalid" }),
      { params: Promise.resolve({ path: ["answer-copy"] }) },
    );
    assert.equal(result.status, 200);
    assert.equal((await result.json()).copyStatus, "sent");
    assert.equal(
      (await h.service.readResponse(greg.identity)).copyStatus,
      "sent",
    );
    assert.equal(h.state.emails.length, 1);
    assert.equal(h.state.emails[0].to, "greg@vanesch.uk");
    assert.equal(
      h.state.emails[0].from,
      "team.blue baseline <sender@example.invalid>",
    );
    assert.doesNotMatch(
      h.state.emails[0].html + h.state.emails[0].text,
      /Van Esch Advisory/,
    );
    await h.service.requestAnswerCopy(greg.identity);
    assert.equal(h.state.emails.length, 1);
    h.sqlite
      .prepare(
        "UPDATE tb_baseline_answer_copies SET status='failed',attempts=3 WHERE participant_id=?",
      )
      .run(greg.p.participant_id);
    assert.equal(
      (await h.service.requestAnswerCopy(greg.identity)).copyStatus,
      "failed",
    );
    assert.equal(h.state.emails.length, 1);
  } finally {
    h.sqlite.close();
  }
});
test("Requested copies remain preview-only in QA and production retries keep the invite email snapshot", async () => {
  const h = harness();
  try {
    const { campaign, p, token } = await reviewedSetup(h);
    const code = await h.service.requestVerification(
      h.request({}),
      token,
      true,
    );
    const access = await h.service.verifyCode(
      h.request({}),
      token,
      code.challenge,
      code.code,
    );
    h.state.cookie = access.session;
    const identity = await h.service.participant(h.request({}));
    const d = reviewedComplete(h);
    d.answerCopy = true;
    h.env.NEXT_PUBLIC_APP_ENV = "production";
    h.env.BASELINE_MAIL_MODE = "send";
    h.env.RESEND_API_KEY = "synthetic-production-mail";
    h.env.CONTACT_FROM_EMAIL = "Synthetic <sender@example.invalid>";
    for (const flag of [
      "D1_SYSTEM_EVENTS_MODE",
      "D1_DIAGNOSTIC_SUBMISSIONS_MODE",
      "D1_CRM_PROSPECTS_MODE",
      "D1_CLIENT_DIAGNOSTIC_MODE",
      "D1_CLIENT_DIAGNOSTIC_SECURITY_MODE",
    ])
      h.env[flag] = "d1";
    h.state.failMail = true;
    const submitted = await h.service.saveResponse(identity, d, 0, 8, true);
    assert.equal(submitted.status, "completed");
    assert.equal(submitted.copyStatus, "failed");
    await h.service.changeParticipant(
      "admin@example.invalid",
      campaign,
      p.participant_id,
      {
        action: "edit",
        revision: 1,
        csv: "name,email,country,region,manages_people,direct_reports\nSynthetic,changed@example.invalid,GB,QA,no,0",
      },
    );
    h.state.failMail = false;
    const retried = await h.service.retryAnswerCopies(
      "admin@example.invalid",
      campaign,
    );
    assert.equal(retried.sent, 1);
    assert.equal(h.state.emails.at(-1).to, "reviewed@example.invalid");
    assert.equal(
      h.state.emails.at(-1).attachments[0].filename,
      "current-work-baseline-answers.docx",
    );
    const attachment = h.state.emails.at(-1).attachments[0];
    assert.equal(attachment.contentType, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    assert.equal(Buffer.from(attachment.content).subarray(0, 2).toString(), "PK");
    assert.ok(Buffer.from(attachment.content).includes(Buffer.from("word/document.xml")));
    assert.match(h.state.emails.at(-1).text, /Word document/);
    const calls = h.state.emails.length;
    await h.service.retryAnswerCopies("admin@example.invalid", campaign);
    assert.equal(h.state.emails.length, calls);
    const firstKey = h.state.mailKeys.at(-1);
    assert.equal(h.state.mailKeys.at(-2), firstKey, "A retry keeps the same delivery identifier");
    h.sqlite.prepare("UPDATE tb_baseline_responses SET submitted_at=? WHERE participant_id=?").run("2026-10-21T12:00:00.000Z", p.participant_id);
    h.sqlite.prepare("UPDATE tb_baseline_answer_copies SET status='pending',attempts=0 WHERE participant_id=?").run(p.participant_id);
    await h.service.retryAnswerCopies("admin@example.invalid", campaign);
    assert.equal(h.state.emails.length, calls + 1);
    assert.notEqual(h.state.mailKeys.at(-1), firstKey, "A new submission after a reset has its own delivery identifier");
  } finally {
    h.sqlite.close();
  }
});

test("Frozen v4 persists manager shares, preserves v3, enforces version and exports the approved design", async () => {
  const h = harness();
  try {
    const old = await reviewedSetup(h);
    const oldDefinition = h.sqlite
      .prepare(
        "SELECT definition_json FROM tb_baseline_versions WHERE version=?",
      )
      .get(h.collection.COLLECTION_VERSION).definition_json;
    const v = h.collection.FROZEN_COLLECTION_VERSION;
    const { campaign, p, token } = await reviewedSetup(
      h,
      "frozen@example.invalid",
      v,
    );
    const profile = JSON.parse(
      h.sqlite
        .prepare(
          "SELECT profile_json FROM tb_baseline_participants WHERE participant_id=?",
        )
        .get(p.participant_id).profile_json,
    );
    profile.manages_people = "yes";
    profile.direct_reports = "3";
    h.sqlite
      .prepare(
        "UPDATE tb_baseline_participants SET profile_json=? WHERE participant_id=?",
      )
      .run(JSON.stringify(profile), p.participant_id);
    await assert.rejects(
      h.service.redeem(h.request({}), token),
      (e) => e.status === 403,
    );
    const code = await h.service.requestVerification(
      h.request({}),
      token,
      true,
    );
    const verified = await h.route.POST(
      h.request({ token, challenge: code.challenge, code: code.code }),
      { params: Promise.resolve({ path: ["verify-code"] }) },
    );
    assert.equal(verified.status, 200);
    const identity = await h.service.participant(h.request({}));
    let response = await h.service.readResponse(identity);
    assert.equal(response.draft.version, v);
    const d = {
      ...reviewedComplete(h),
      version: v,
      managementTime: {
        time: {
          coordination: 25,
          individual: 50,
          hiring: 15,
          administration: 10,
          other: 0,
        },
        uncertain: false,
        other: "",
      },
    };
    d.broad.selected = ["office", "people_management"];
    d.broad.time = { office: 80, people_management: 20 };
    d.rich.localNeeds = [];
    d.management.sharedReporting = "";
    assert.equal(
      h.collection.collectionIssues(d, { isPeopleManager: true }).length,
      0,
    );
    await assert.rejects(
      h.service.saveResponse(identity, reviewedComplete(h), 0, 2),
    );
    await h.service.saveResponse(identity, d, 0, 4);
    response = await h.service.readResponse(identity);
    assert.deepEqual(
      JSON.parse(JSON.stringify(response.draft.managementTime)),
      d.managementTime,
    );
    await assert.rejects(
      h.service.saveResponse(identity, d, 0, 4),
      (e) => e.status === 409,
    );
    const bad = structuredClone(d);
    bad.managementTime.time.individual = 10;
    await assert.rejects(h.service.saveResponse(identity, bad, 1, 8, true));
    const uncertain = structuredClone(bad);
    uncertain.managementTime.uncertain = true;
    assert.equal(
      h.collection.collectionEvidence(uncertain, { isPeopleManager: true })
        .management.groups.length,
      0,
    );
    d.answerCopy = true;
    await h.service.saveResponse(identity, d, 1, 8, true);
    await assert.rejects(
      h.service.saveResponse(identity, d, 2, 4),
      (e) => e.status === 409,
    );
    const exported = JSON.parse(
      await h.service.exportDataset("admin@example.invalid", campaign, "json"),
    );
    assert.equal(exported.questionnaire.version, v);
    assert.equal(
      exported.respondents[0].management.groups.find(
        (x) => x.code === "individual",
      ).approximateShareOfWorkingTime,
      10,
    );
    assert.ok(!("sharedReporting" in exported.respondents[0].management));
    assert.equal(
      h.sqlite
        .prepare(
          "SELECT version FROM tb_baseline_answer_copies WHERE participant_id=?",
        )
        .get(p.participant_id).version,
      v,
    );
    assert.equal(
      h.sqlite
        .prepare(
          "SELECT definition_json FROM tb_baseline_versions WHERE version=?",
        )
        .get(h.collection.COLLECTION_VERSION).definition_json,
      oldDefinition,
    );
    assert.equal(
      (await h.service.campaignRows(old.campaign)).participants[0].draft
        .version,
      h.collection.COLLECTION_VERSION,
    );
    assert.equal(h.state.emails.length, 0);
  } finally {
    h.sqlite.close();
  }
});

test("Advisor Excel download preserves authentication, attachment metadata and versioned responses", async () => {
  const h = harness();
  try {
    const { campaign } = await reviewedSetup(
      h,
      "excel@example.invalid",
      h.collection.FROZEN_COLLECTION_VERSION,
    );
    const request = () =>
      new Request(
        "https://qa.example.invalid/advisor/baseline/api/export?campaign=" +
          campaign +
          "&format=xlsx",
      );
    const context = { params: Promise.resolve({ path: ["export"] }) };
    h.state.admin = false;
    assert.equal((await h.adminRoute.GET(request(), context)).status, 403);
    h.state.admin = true;
    const response = await h.adminRoute.GET(request(), context);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /spreadsheetml/);
    assert.match(
      response.headers.get("content-disposition"),
      /baseline-analysis.xlsx/,
    );
    const bytes = new Uint8Array(await response.arrayBuffer());
    assert.equal(bytes[0], 80);
    assert.equal(bytes[1], 75);
    assert.equal(h.state.emails.length, 0);
  } finally {
    h.sqlite.close();
  }
});

test('Detailed v5 saves and resumes evidence, enforces completion, exports it and keeps submitted answers immutable', async()=>{
 const h=harness();try{
  const {campaign,p,token}=await reviewedSetup(h,'detailed@example.invalid',h.collection.DEPTH_COLLECTION_VERSION);
  const code=await h.service.requestVerification(h.request({}),token,true);
  const access=await h.service.verifyCode(h.request({}),token,code.challenge,code.code);
  h.state.cookie=access.session;const identity=await h.service.participant(h.request({}));
  const d={...reviewedComplete(h),version:h.collection.DEPTH_COLLECTION_VERSION,managementTime:{time:{},uncertain:false,other:''}};
  require('../../scripts/baseline/depth-fixture.cjs').fillDepth(d);
  d.depth.resumeStep='work_detail';
  assert.equal(h.collection.collectionIssues(d,{isPeopleManager:false}).length,0);
  const incomplete=structuredClone(d);incomplete.depth.work.office.taskTime.reception=10;
  await assert.rejects(h.service.saveResponse(identity,incomplete,0,8,true));
  await h.service.saveResponse(identity,d,0,4);
  const resumed=await h.service.readResponse(identity);assert.deepEqual(JSON.parse(JSON.stringify(resumed.draft.depth)),d.depth);
  assert.equal(resumed.progress,4);assert.equal(resumed.draft.depth.resumeStep,'work_detail');
  await assert.rejects(h.service.saveResponse(identity,d,0,4),e=>e.status===409);
  await h.service.saveResponse(identity,d,1,8,true);
  const exported=JSON.parse(await h.service.exportDataset('admin@example.invalid',campaign,'json'));
  assert.equal(exported.questionnaire.version,h.collection.DEPTH_COLLECTION_VERSION);
  assert.equal(exported.respondents[0].depth.countries.find(c=>c.code==='custom:norway').shareOfWorkingTime,10);
  assert.equal(exported.respondents[0].depth.work.find(w=>w.area==='office').tasks[0].shareOfAreaTime,60);
  await assert.rejects(h.service.saveResponse(identity,d,2,4),e=>e.status===409);
  assert.equal(h.sqlite.prepare('SELECT status FROM tb_baseline_responses WHERE participant_id=?').get(p.participant_id).status,'completed');
 }finally{h.sqlite.close();}
});
