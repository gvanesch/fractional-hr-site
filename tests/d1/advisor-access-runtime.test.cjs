// Exercise the real Access verifier, middleware, server authorization and logout.
// JWTs are signed locally; JWKS is the only mocked HTTP endpoint. Supabase clients
// throw if constructed, and no Supabase environment variables are supplied.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");
const ts = require("typescript");

const root = path.resolve(__dirname, "../..");
const teamDomain = "https://synthetic-advisor.cloudflareaccess.com";
const audience = "synthetic-advisor-audience";
const advisorEmail = "advisor@example.invalid";

async function signingKey(kid) {
  const pair = await webcrypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );
  const publicKey = {
    ...(await webcrypto.subtle.exportKey("jwk", pair.publicKey)),
    alg: "RS256",
    use: "sig",
    kid,
  };
  return {
    publicKey,
    async token(claims = {}, header = {}) {
      const now = Math.floor(Date.now() / 1000);
      const parts = [
        { alg: "RS256", kid, ...header },
        {
          iss: teamDomain,
          aud: [audience],
          exp: now + 600,
          nbf: now - 10,
          sub: "synthetic-advisor-id",
          email: advisorEmail,
          ...claims,
        },
      ].map((value) => Buffer.from(JSON.stringify(value)).toString("base64url"));
      const input = parts.join(".");
      const signature = await webcrypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        pair.privateKey,
        new TextEncoder().encode(input),
      );
      return `${input}.${Buffer.from(signature).toString("base64url")}`;
    },
  };
}

function harness(keys) {
  const state = {
    keys,
    keyRequests: 0,
    keyEndpointStatus: 200,
    supabaseCalls: 0,
    headers: new Headers(),
  };
  const processEnv = {
    ADVISOR_AUTH_MODE: "cloudflare_access",
    ADVISOR_ALLOWED_EMAILS: ` ${advisorEmail.toUpperCase()} `,
    CLOUDFLARE_ACCESS_AUD: audience,
    CLOUDFLARE_ACCESS_TEAM_DOMAIN: teamDomain,
  };
  const failSupabase = () => {
    state.supabaseCalls++;
    throw new Error("Supabase is unavailable after retirement");
  };
  const overrides = {
    "@opennextjs/cloudflare": {
      getCloudflareContext: () => ({
        env: { D1_DIAGNOSTIC_SUBMISSIONS_MODE: "d1" },
      }),
    },
    "@supabase/ssr": {
      createBrowserClient: failSupabase,
      createServerClient: failSupabase,
    },
    "@/lib/supabase/server": {
      createSupabaseServerClient: failSupabase,
    },
    "@/lib/supabase/admin": {
      createSupabaseAdminClient: failSupabase,
    },
    "next/headers": { headers: async () => state.headers },
    "next/navigation": {
      redirect(location) {
        const error = new Error("NEXT_REDIRECT");
        error.location = location;
        throw error;
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
    if (!path.extname(file)) {
      file += fs.existsSync(`${file}.ts`) ? ".ts" : ".tsx";
    }
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText;
    const localRequire = (name) => {
      if (overrides[name]) return overrides[name];
      if (name.startsWith("@/")) return load(name.slice(2));
      if (name.startsWith(".")) return load(path.resolve(path.dirname(file), name));
      return require(name);
    };
    vm.runInNewContext(
      `(function(require,module,exports){${code}\n})`,
      {
        console: { info() {}, log() {}, warn() {}, error() {} },
        process: { env: processEnv },
        crypto: webcrypto,
        Request,
        Response,
        Headers,
        URL,
        TextEncoder,
        TextDecoder,
        Buffer,
        atob,
        btoa,
        fetch: async (url) => {
          assert.equal(url, `${teamDomain}/cdn-cgi/access/certs`);
          state.keyRequests++;
          return Response.json(
            { keys: state.keys },
            { status: state.keyEndpointStatus },
          );
        },
      },
      { filename: file },
    )(localRequire, module, module.exports);
    return module.exports;
  }
  function request(pathname, token) {
    const headers = new Headers();
    if (token) headers.set("cf-access-jwt-assertion", token);
    return {
      url: `https://website.example.invalid${pathname}`,
      nextUrl: { pathname, search: "" },
      headers,
    };
  }
  return { load, state, processEnv, request };
}

test("real Access signatures authorize advisor pages, CRM, projects and server helpers with Supabase unavailable", async () => {
  const key = await signingKey("initial-key");
  const h = harness([key.publicKey]);
  const token = await key.token();
  const middleware = h.load("middleware.ts").middleware;
  for (const pathname of [
    "/advisor",
    "/advisor/login",
    "/advisor/health-checks",
    "/advisor/prospects",
    "/advisor/projects",
    "/advisor/project/synthetic-project",
    "/advisor/baseline/api/campaigns",
    "/api/advisor-create-prospect",
    "/api/advisor-update-prospect",
    "/api/advisor-project-participants",
    "/api/advisor-logout",
    "/api/prospect-update",
    "/api/client-diagnostic-create-project",
    "/api/client-diagnostic-project-status",
    "/api/client-diagnostic-project-summary",
    "/api/client-diagnostic-project-update",
    "/api/client-diagnostic-projects",
    "/api/client-diagnostic-report",
  ]) {
    const result = await middleware(h.request(pathname, token));
    assert.equal(result.status, 200, pathname);
    assert.match(result.headers.get("cache-control"), /private, no-store/);
  }
  const auth = h.load("lib/advisor-auth.ts");
  const request = h.request("/api/advisor-create-prospect", token);
  const explicit = await auth.authenticateAdvisorRequest(request);
  assert.equal(explicit.email, advisorEmail);
  assert.equal(explicit.id, "synthetic-advisor-id");
  h.state.headers = request.headers;
  assert.equal((await auth.requireAdvisorUser()).email, advisorEmail);
  assert.equal(h.state.keyRequests, 1, "accepted requests reuse cached signing keys");
  assert.equal(h.state.supabaseCalls, 0);
});

test("Access denies invalid identities and signatures without falling back to Supabase", async () => {
  const key = await signingKey("initial-key");
  const h = harness([key.publicKey]);
  const token = await key.token();
  const parts = token.split(".");
  parts[1] = Buffer.from(JSON.stringify({
    iss: teamDomain, aud: [audience], exp: Math.floor(Date.now() / 1000) + 600,
    email: advisorEmail, sub: "tampered-subject",
  })).toString("base64url");
  const cases = [
    ["missing", undefined],
    ["malformed", "not.a.valid.jwt"],
    ["tampered", parts.join(".")],
    ["expired", await key.token({ exp: Math.floor(Date.now() / 1000) - 10 })],
    ["future", await key.token({ nbf: Math.floor(Date.now() / 1000) + 600 })],
    ["issuer", await key.token({ iss: "https://other.cloudflareaccess.com" })],
    ["audience", await key.token({ aud: ["other-app"] })],
    ["unlisted user", await key.token({ email: "other@example.invalid" })],
    ["no identity", await key.token({ email: undefined })],
    ["unsigned algorithm", await key.token({}, { alg: "none" })],
    ["unknown key", await key.token({}, { kid: "unpublished-key" })],
  ];
  const middleware = h.load("middleware.ts").middleware;
  const auth = h.load("lib/advisor-auth.ts");
  for (const [name, invalidToken] of cases) {
    const request = h.request("/advisor/projects", invalidToken);
    const response = await middleware(request);
    assert.equal(response.status, 403, name);
    assert.match(response.headers.get("cache-control"), /no-store/);
    assert.equal(await auth.authenticateAdvisorRequest(request), null, name);
  }
  assert.equal(h.state.supabaseCalls, 0);
});

test("Access signing-key rotation succeeds; missing keys or configuration fail closed", async () => {
  const first = await signingKey("first-key");
  const second = await signingKey("rotated-key");
  const h = harness([first.publicKey]);
  const auth = h.load("lib/advisor-auth.ts");
  assert.ok(await auth.authenticateAdvisorRequest(h.request("/advisor", await first.token())));
  h.state.keys = [second.publicKey];
  assert.ok(await auth.authenticateAdvisorRequest(h.request("/advisor", await second.token())));
  assert.equal(h.state.keyRequests, 2, "unknown key triggers a JWKS refresh");
  h.state.keyEndpointStatus = 503;
  assert.equal(await auth.authenticateAdvisorRequest(h.request("/advisor", await first.token())), null);
  h.processEnv.CLOUDFLARE_ACCESS_AUD = "";
  assert.equal(await auth.authenticateAdvisorRequest(h.request("/advisor", await second.token())), null);
  assert.equal(h.state.supabaseCalls, 0);
});

test("Access login and logout use Cloudflare; public forms and cron do not require an advisor JWT", async () => {
  const h = harness([]);
  const login = h.load("app/advisor/login/page.tsx").default;
  for (const [next, destination] of [
    ["/advisor/projects?view=active", "/advisor/projects?view=active"],
    ["https://outside.example.invalid", "/advisor"],
  ]) {
    await assert.rejects(
      login({ searchParams: Promise.resolve({ next }) }),
      (error) => error.message === "NEXT_REDIRECT" && error.location === destination,
    );
  }
  const logout = await h.load("app/api/advisor-logout/route.ts").POST();
  assert.equal(logout.status, 200);
  assert.deepEqual(await logout.json(), { ok: true, logoutUrl: "/cdn-cgi/access/logout" });
  assert.equal(logout.headers.get("cache-control"), "no-store");
  const middleware = h.load("middleware.ts").middleware;
  for (const pathname of [
    "/api/contact",
    "/api/diagnostic-complete",
    "/api/advisor-daily-action-digest",
    "/api/cron/advisor-daily-action-digest",
    "/api/client-diagnostic-daily-summary",
    "/api/client-diagnostic-otp-request",
    "/api/client-diagnostic-otp-verify",
    "/api/baseline/request-code",
    "/api/baseline/verify-code",
  ]) {
    assert.equal((await middleware(h.request(pathname))).status, 200, pathname);
  }
  assert.equal(h.state.keyRequests, 0);
  assert.equal(h.state.supabaseCalls, 0);
});
