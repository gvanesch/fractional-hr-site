// Read-only live production checks. No credentials, authenticated session or mail.
const site = "https://www.vanesch.uk";
const campaign = "55000040-2026-4016-8040-000000000040";
const cases = [
  ...[
    "/advisor",
    "/advisor/projects",
    "/advisor/baseline",
    "/advisor/baseline/create",
    `/advisor/baseline/project/${campaign}`,
    "/advisor/baseline/depth-preview",
  ].map((path) => ["GET", path]),
  ...[
    "campaigns",
    `campaign?campaign=${campaign}`,
    `dashboard?campaign=${campaign}`,
    `readiness?campaign=${campaign}`,
    `shares?campaign=${campaign}`,
    "roster-template",
    `export?campaign=${campaign}&format=xlsx`,
    `export?campaign=${campaign}&format=csv`,
  ].map((path) => ["GET", "/advisor/baseline/api/" + path]),
  ...[
    "create",
    "configure",
    "import-preview",
    "import",
    "participant",
    "extend",
    "share",
    "share-revoke",
    "launch",
    "invite-batch",
    "retry-answer-copies",
    "test-code",
  ].map((path) => ["POST", "/advisor/baseline/api/" + path]),
];
for (const [method, path] of cases) {
  const r = await fetch(site + path, {
    method,
    redirect: "manual",
    headers:
      method === "POST"
        ? { Origin: site, "Content-Type": "application/json" }
        : undefined,
    body: method === "POST" ? "{}" : undefined,
    signal: AbortSignal.timeout(20000),
  });
  const status = r.status,
    location = r.headers.get("location");
  await r.body?.cancel();
  if (
    ![302, 307, 401, 403].includes(status) ||
    (location && !new URL(location, site).pathname.startsWith("/advisor/login"))
  )
    throw Error(
      `Advisor boundary failed for ${method} ${path}: HTTP ${status}`,
    );
  console.log(`Protected: ${method} ${path.split("?")[0]} (${status})`);
}
console.log(
  `Production advisor workspace: ${cases.length} page/API authentication boundaries verified. No authenticated writes or email performed.`,
);
