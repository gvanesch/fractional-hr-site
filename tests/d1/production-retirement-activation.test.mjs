import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { recordedActivationInputs, verifyOriginalSourceHistory, ACTIVATION_REQUEST_PATH } from "../../scripts/security/production-retirement-activate-existing.mjs";

test("recorded activation retains original Access ownership while passing the fresh execution and immutable upload evidence", async () => {
  const ownership = { requestId: "original-access-request" };
  const originalRequest = { requestId: "original-upload-request", accessRecovery: { originalRequest: ownership } };
  const access = { stage: "verified", applicationId: "synthetic-owned-application" };
  const evidence = { originalRequest, originalSourceCommit: "a".repeat(40), recordedReport: { access }, originalEligibility: { eligibleForReviewedAuthChange: true },
    env: { unreviewed: true }, request: { unreviewed: true } };
  const request = { requestId: "new-activation-request" }, env = { synthetic: true }, git = { head: "b".repeat(40) };
  const inputs = recordedActivationInputs({ request, env, git, evidence, repositoryConfig: {}, inspectAccessImpl: async args => {
    assert.equal(args.request, ownership); assert.equal(args.checkpoint, access); assert.equal(args.env, env); return { freshlyVerified: true };
  } });
  assert.equal(inputs.request, request); assert.equal(inputs.originalRequest, originalRequest);
  assert.equal(inputs.env, env);
  assert.equal(inputs.originalSourceCommit, evidence.originalSourceCommit);
  assert.deepEqual(await inputs.inspectAccess(), { freshlyVerified: true });
  assert.equal(inputs.uploadImpl, undefined);
});

test("activation-only workflow is request gated and has no build, upload, policy mutation or credential-bearing test step", async () => {
  const source = await readFile(new URL("../../.github/workflows/production-retirement-activate-existing.yml", import.meta.url), "utf8");
  assert.ok(source.includes(`      - ${ACTIVATION_REQUEST_PATH}`));
  assert.ok(source.includes("fetch-depth: 0")); assert.ok(source.includes("persist-credentials: false"));
  assert.ok(source.includes("group: vanesch-production-release")); assert.ok(source.includes("cancel-in-progress: false"));
  assert.ok(source.includes("github.run_attempt == 1"));
  assert.ok(!/workflow_dispatch|wrangler|opennext|npm |SUPABASE/.test(source));
  const [before, stepAndLater] = source.split("      - name: Reconcile the recorded candidate and activate it once\n");
  assert.ok(!before.includes("secrets."));
  const [step, ...after] = stepAndLater.split("      - name:");
  assert.equal((step.match(/secrets\.CLOUDFLARE_API_TOKEN/g) ?? []).length, 1);
  assert.equal((step.match(/secrets\.CLOUDFLARE_RETIREMENT_AUDIT_TOKEN/g) ?? []).length, 1);
  assert.ok(step.includes("production-retirement-activate-existing.mjs preflight"));
  assert.ok(step.includes("production-retirement-activate-existing.mjs activate"));
  assert.ok(!after.join("\n").includes("secrets."));
});

test("recorded upload must be an ancestor whose exact request and reviewed parent agree with Git history", () => {
  const evidence = { originalSourceCommit: "a".repeat(40), originalRequest: { reviewedCommit: "b".repeat(40), requestId: "original-upload" } };
  const command = args => args[0] === "merge-base" ? "" : args[0] === "show" ? JSON.stringify(evidence.originalRequest) :
    args[0] === "diff" ? "scripts/security/production-retirement-release-request.json" : evidence.originalRequest.reviewedCommit;
  verifyOriginalSourceHistory(evidence, command);
  for (const operation of ["merge-base", "show", "diff", "rev-parse"]) {
    assert.throws(() => verifyOriginalSourceHistory(evidence, args => {
      if (args[0] !== operation) return command(args);
      if (operation === "merge-base") throw new Error("unrelated-source");
      if (operation === "show") return JSON.stringify({ ...evidence.originalRequest, requestId: "changed" });
      return "unreviewed-other-source";
    }), /request-only ancestor/);
  }
});
