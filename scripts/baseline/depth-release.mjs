// Guarded code-only production v5 depth release. No schema, invitation, authentication or response changes.
import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import {
  activationFlags,
  bindingFingerprint,
} from "../d1/prepare-approved-production-activation.mjs";
import { verifyProductionPublicKey } from "../d1/verify-production-public-key.mjs";
const account = "73221f18acc676e4992c89fcbf2b2a8f",
  db = "b81b99d7-4b10-4f7e-a0c1-ada3adf596fc",
  worker = "fractional-hr-site";
const a = JSON.parse(
  await readFile(new URL("./depth-release-approval.json", import.meta.url)),
);
const age = Date.now() - Date.parse(a.confirmedAt);
if (
  process.env.GITHUB_REF !== "refs/heads/migration/d1" ||
  process.env.GITHUB_REPOSITORY !== "gvanesch/fractional-hr-site" ||
  process.env.CLOUDFLARE_ACCOUNT_ID !== account ||
  !process.env.CLOUDFLARE_API_TOKEN ||
  a.approvedBy !== "Greg van Esch" ||
  a.scope !== "production-baseline-v5-depth-no-email" ||
  a.databaseId !== db ||
  a.sendEmail !== false ||
  age < 0 ||
  age > 86400000 ||
  !Number.isFinite(age)
)
  throw Error("Current production v5 depth approval is unavailable.");
const parent = execFileSync("git", ["rev-parse", "HEAD^"], {
  encoding: "utf8",
}).trim();
const changed = execFileSync("git", ["diff", "--name-only", "HEAD^", "HEAD"], {
  encoding: "utf8",
}).trim();
if (
  parent !== a.reviewedCommit ||
  changed !== "scripts/baseline/depth-release-approval.json"
)
  throw Error(
    "V5 release approval must be the only change above the reviewed implementation.",
  );
async function get(path) {
  const r = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${worker}/${path}`,
    {
      headers: { Authorization: "Bearer " + process.env.CLOUDFLARE_API_TOKEN },
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!r.ok) throw Error("Production metadata read failed.");
  const b = await r.json();
  if (!b.success) throw Error("Production metadata unavailable.");
  return b.result;
}
const settings = await get("settings"),
  bindings = new Map(settings.bindings.map((b) => [b.name, b]));
if (
  (bindings.get("DB")?.id ?? bindings.get("DB")?.database_id) !== db ||
  activationFlags.some((n) => bindings.get(n)?.text !== "d1") ||
  bindings.get("BASELINE_ENABLED")?.text !== "true" ||
  bindings.get("BASELINE_MAIL_MODE")?.text !== "greg-only" ||
  (bindings.get("ADVISOR_AUTH_MODE")?.text ?? "supabase") !== "supabase"
)
  throw Error(
    "Production data, baseline, mail or authentication configuration differs.",
  );
const deployment = (await get("deployments")).deployments?.[0];
const recovery = new URL("../../baseline-depth-recovery.json", import.meta.url);
if (process.argv[2] === "prepare") {
  if (
    deployment?.versions?.length !== 1 ||
    deployment.versions[0].version_id !== a.expectedVersionId ||
    deployment.versions[0].percentage !== 100
  )
    throw Error("Production version differs from the approved checkpoint.");
  const result = await fetch(
    `https://api.github.com/repos/gvanesch/fractional-hr-site/actions/runs/${a.qaRunId}`,
    {
      headers: {
        Authorization: "Bearer " + process.env.GH_TOKEN,
        Accept: "application/vnd.github+json",
      },
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!result.ok) throw Error("QA evidence unavailable.");
  const run = await result.json();
  if (
    run.head_sha !== a.reviewedCommit ||
    run.head_branch !== "feature/team-blue-baseline" ||
    run.path !== ".github/workflows/baseline-qa.yml" ||
    run.conclusion !== "success"
  )
    throw Error("Exact reviewed QA run has not passed.");
  await verifyProductionPublicKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const configUrl = new URL("../../wrangler.jsonc", import.meta.url),
    config = JSON.parse(await readFile(configUrl));
  if (
    config.name !== worker ||
    config.route ||
    config.routes ||
    config.custom_domains ||
    config.triggers?.crons?.length ||
    activationFlags.some((n) => config.vars[n] !== "d1") ||
    config.d1_databases?.find((d) => d.binding === "DB")?.database_id !== db
  )
    throw Error("Production export configuration differs.");
  await writeFile(
    recovery,
    JSON.stringify(
      {
        deploymentId: deployment.id,
        versions: deployment.versions,
        bindingFingerprint: bindingFingerprint(bindings),
      },
      null,
      2,
    ) + "\n",
    { mode: 0o600 },
  );
  config.account_id = account;
  Object.assign(config.vars, {
    BASELINE_ENABLED: "true",
    BASELINE_MAIL_MODE: "greg-only",
    NEXT_PUBLIC_APP_ENV: "production",
    NEXT_PUBLIC_SITE_URL: "https://vanesch.uk",
    NEXT_PUBLIC_SUPABASE_URL: "https://qxddddhhpfrrxbaunwfw.supabase.co",
  });
  await writeFile(configUrl, JSON.stringify(config, null, 2) + "\n");
  console.log(
    "Reviewed export code and QA evidence verified; production settings pinned; no data or email changes.",
  );
} else if (process.argv[2] === "verify") {
  const prior = JSON.parse(await readFile(recovery));
  if (
    deployment.id === prior.deploymentId ||
    bindingFingerprint(bindings) !== prior.bindingFingerprint
  )
    throw Error(
      "Deployment did not change or unrelated production bindings changed.",
    );
  const preview = await fetch(
    "https://www.vanesch.uk/advisor/baseline/depth-preview",
    { redirect: "manual", signal: AbortSignal.timeout(15000) },
  );
  if (![302, 307, 401, 403].includes(preview.status))
    throw Error("Detailed preview administrator boundary differs.");
  await preview.body?.cancel();
  const r = await fetch(
    "https://www.vanesch.uk/advisor/baseline/api/export?campaign=55000040-2026-4016-8040-000000000040&format=xlsx",
    { redirect: "manual", signal: AbortSignal.timeout(15000) },
  );
  if (![302, 307, 401, 403].includes(r.status))
    throw Error("Excel download administrator boundary differs.");
  await r.body?.cancel();
  console.log(
    "Production export release verified; D1, baseline, password login and Greg-only email restrictions preserved. Administrator download boundary verified.",
  );
} else throw Error("Choose prepare or verify.");
