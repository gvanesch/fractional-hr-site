// GET-only production eligibility check. No deployment request or write CLI is
// exposed here, and no generated configuration or credentials are serialized.
import { readFile } from "node:fs/promises";
import { readProductionEligibility } from "./production-retirement-release.mjs";

try {
  const repositoryConfig = JSON.parse(await readFile(new URL("../../wrangler.jsonc", import.meta.url), "utf8"));
  const report = await readProductionEligibility({
    env: process.env, repositoryConfig,
    expectedProductionVersionId: "6f47c7ec-3697-486c-ad8a-a9823be99424",
    expectedQaVersionId: "f6076224-8523-4761-8148-69b637e2e542",
  });
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  // The release module wraps provider/transport errors and uses fixed local
  // validation messages. Withhold all other exceptions rather than echoing data.
  const safe = typeof error?.message === "string" && /^(?:Production |The existing Worker |Required production binding is missing: |All production data modes |Repository production |Unexpected prior Access |An unknown or undeployed Worker |The current Worker deployment |Worker schedule\/routing metadata |Active Worker version and settings |Cloudflare did not confirm the production release request)/.test(error.message);
  console.log(JSON.stringify({ readOnly: true, eligible: false, mutationAttempted: false,
    failure: safe ? error.message : "Production eligibility inspection did not complete; review required." }, null, 2));
  process.exitCode = 1;
}
