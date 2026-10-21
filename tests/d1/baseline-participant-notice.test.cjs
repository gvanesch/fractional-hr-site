const { test } = require("node:test"),
  assert = require("node:assert/strict");
const { load } = require("../../scripts/baseline/answer-document-fixture.cjs");
test("Participant notice replaces only the exact historic IT-test instruction and preserves bespoke privacy notices", async () => {
  const { participantPrivacyNotice } = await load("lib/baseline/copy.ts");
  const internal =
    "IT delivery and access test only. Use synthetic answers. Exclude this campaign from programme reporting. Responses are retained; no automated deletion applies.";
  const standard =
    "Your name and profile information are visible with your answers.";
  assert.equal(participantPrivacyNotice(internal, standard), standard);
  assert.equal(participantPrivacyNotice(standard, "different"), standard);
  const bespoke =
    "Authorised regional reviewers can access your named responses. Contact the organiser with questions.";
  assert.equal(participantPrivacyNotice(bespoke, standard), bespoke);
});
