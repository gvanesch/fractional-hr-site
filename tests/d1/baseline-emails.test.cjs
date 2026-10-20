const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  path = require("node:path");
const built = require("esbuild").buildSync({
  entryPoints: [path.resolve(__dirname, "../../lib/baseline/emails.ts")],
  bundle: true,
  platform: "node",
  format: "cjs",
  write: false,
});
const emailModule = { exports: {} };
new Function("module", "exports", built.outputFiles[0].text)(
  emailModule,
  emailModule.exports,
);
test("Invitations show the actual UTC deadline and agreed completion guidance in HTML and plain text", () => {
  for (const version of [
    "team-blue-baseline-v3",
    "team-blue-baseline-v4",
    "team-blue-baseline-v5",
  ]) {
    const email = emailModule.exports.invitationEmail(
      "Synthetic test",
      "https://example.invalid/start",
      "2026-10-30T20:00:00+02:00",
      version,
    );
    for (const content of [email.text, email.html]) {
      assert.match(content, /30 October 2026 at 18:00 UTC/);
      assert.match(content, /15–20 minutes/);
      assert.match(content, /up to 30 minutes/);
      assert.doesNotMatch(content, /25–40|10–15|20–30/);
    }
  }
});
test("A midnight deadline is rendered as 00:00 UTC on the correct day", () => {
  const email = emailModule.exports.invitationEmail(
    "Synthetic test",
    "https://example.invalid/start",
    "2026-10-31T00:00:00Z",
  );
  assert.match(email.text, /31 October 2026 at 00:00 UTC/);
});
test("Code email explains entering the current code and returning later for an automatic fresh code", () => {
  const email = emailModule.exports.verificationEmail(
    "123456",
    "https://example.invalid/baseline/start#private-token",
  );
  for (const content of [email.text, email.html]) {
    assert.match(content, /page you already have open/);
    assert.match(
      content,
      /Keep this email so you can return later and continue your saved answers/,
    );
    assert.match(
      content,
      /fresh verification code will be emailed automatically/,
    );
    assert.match(content, /Use the most recent code/);
  }
});
