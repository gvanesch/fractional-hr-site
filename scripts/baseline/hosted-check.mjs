const site = process.env.NEXT_PUBLIC_SITE_URL;
if (
  !site ||
  !/^https:\/\/fractional-hr-site-qa\.[a-z0-9-]+\.workers\.dev$/.test(site)
)
  throw new Error("QA-only URL required.");
for (const path of [
  "/baseline/start",
  "/baseline/test",
  "/baseline/dashboard",
  "/api/baseline/response",
  "/api/baseline/admin/campaigns",
  "/advisor/baseline/api/campaigns",
  "/advisor/baseline/prototype",
]) {
  const response = await fetch(site + path, { redirect: "manual" });
  if (
    path === "/baseline/start" ||
    path === "/baseline/test" ||
    path === "/baseline/dashboard"
  ) {
    if (
      response.status !== 200 ||
      !(response.headers.get("x-robots-tag") ?? "").includes("noindex") ||
      response.headers.get("referrer-policy") !== "no-referrer"
    )
      throw new Error("Participant entry point or privacy headers failed.");
  } else if (![401, 403, 302, 307].includes(response.status))
    throw new Error(`Anonymous access not blocked: ${path}`);
}
console.log(
  "QA entry point and anonymous participant/admin boundaries verified. No emails sent.",
);

const refused = await fetch(site + "/api/baseline/design-access", {
  method: "POST",
  headers: { Origin: site, "Content-Type": "application/json" },
  body: JSON.stringify({ token: "0".repeat(64) }),
  redirect: "manual",
});
if (refused.status !== 403)
  throw new Error("Invalid private design link was not rejected.");
const crossOrigin = await fetch(site + "/api/baseline/design-access", {
  method: "POST",
  headers: {
    Origin: "https://example.invalid",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ token: "0".repeat(64) }),
  redirect: "manual",
});
if (crossOrigin.status !== 403)
  throw new Error("Cross-origin private design access was not rejected.");
console.log(
  "Outbound design-test entry loads without advisor login; invalid and cross-origin links are rejected.",
);

const invalidDashboard = await fetch(site + "/api/baseline/dashboard", {
  method: "POST",
  headers: { Origin: site, "Content-Type": "application/json" },
  body: JSON.stringify({ token: "0".repeat(64) }),
  redirect: "manual",
});
if (invalidDashboard.status !== 403)
  throw new Error("Invalid dashboard token was accepted.");
console.log("Private dashboard anonymous gate verified.");
