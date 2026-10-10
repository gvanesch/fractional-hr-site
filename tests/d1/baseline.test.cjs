const { test } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm"),
  ts = require("typescript");
const root = path.resolve(__dirname, "../..");
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
          send: async (message) => {
            state.emails.push(message);
            return { data: { id: "fake" }, error: null };
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
    route,
    adminRoute,
    request,
    setup,
    access,
    complete,
  };
}
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
