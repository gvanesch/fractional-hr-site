const site = process.env.NEXT_PUBLIC_SITE_URL;
if (
  !site ||
  !/^https:\/\/fractional-hr-site-qa\.[a-z0-9-]+\.workers\.dev$/.test(site)
)
  throw new Error("QA-only URL required.");
for (const path of [
  "/baseline/start",
  "/api/baseline/response",
  "/api/baseline/admin/campaigns",
  "/advisor/baseline/api/campaigns",
  "/advisor/baseline/prototype",
]) {
  const response = await fetch(site + path, { redirect: "manual" });
  if (path === "/baseline/start") {
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
