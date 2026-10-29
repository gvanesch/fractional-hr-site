const { chromium } = require(
    process.env.BASELINE_PLAYWRIGHT_PATH || "playwright",
  ),
  esbuild = require("esbuild"),
  fs = require("node:fs"),
  assert = require("node:assert/strict"),
  path = require("node:path");
const root = path.resolve(__dirname, "../..");
(async () => {
  const model = await esbuild.build({
    entryPoints: [root + "/lib/baseline/collection.ts"],
    bundle: true,
    platform: "node",
    format: "cjs",
    write: false,
  });
  const m = { exports: {} };
  new Function("module", "exports", model.outputFiles[0].text)(m, m.exports);
  const bundle = await esbuild.build({
    stdin: {
      contents:
        'import React from "react";import{createRoot}from"react-dom/client";import Journey from"./app/baseline/start/collection-journey";createRoot(document.getElementById("root")).render(<Journey/>);',
      resolveDir: root,
      loader: "tsx",
    },
    bundle: true,
    write: false,
    format: "iife",
    jsx: "automatic",
    loader: { ".css": "empty" },
    define: { "process.env.NODE_ENV": '"production"' },
  });
  const css =
    "*,*::before,*::after{box-sizing:border-box}body{margin:0;font-family:ui-sans-serif,system-ui,sans-serif}h1,h2,h3,h4,p{margin:0}" +
    [
      "app/globals.css",
      "app/baseline/start/style.css",
      "app/advisor/baseline/prototype/prototype.css",
    ]
      .map((p) => fs.readFileSync(root + "/" + p, "utf8"))
      .join("\n");
  const emailBuild = await esbuild.build({
    entryPoints: [root + "/lib/baseline/emails.ts"],
    bundle: true,
    platform: "node",
    format: "cjs",
    write: false,
  });
  const emailModule = { exports: {} };
  new Function("module", "exports", emailBuild.outputFiles[0].text)(
    emailModule,
    emailModule.exports,
  );
  const proxyMode = process.env.BASELINE_PROXY_UI === "1";
  const proxyContext = proxyMode ? {participantId:"synthetic-proxy-anne",attribution:{participantName:"Synthetic Anne",completerName:"Synthetic Manager",completerEmail:"manager@example.invalid",referencePeriod:"Usual role before leave",note:"Synthetic leave coverage gap"}} : {};
  const browser = await chromium.launch({
    channel: "chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    for (const version of [
      m.exports.COLLECTION_VERSION,
      m.exports.FROZEN_COLLECTION_VERSION,
    ])
      for (const mobile of [false, true]) {
        const page = await browser.newPage({
          viewport: mobile
            ? { width: 390, height: 844 }
            : { width: 1280, height: 900 },
        });
        let stored = m.exports.initialCollection(version),
          revision = 0,
          progress = 0,
          status = "not_started",
          saves = 0,
          codeRequests = 0;
        await page.route(
          "https://collection.example.invalid/**",
          async (route) => {
            const request = route.request(),
              url = new URL(request.url());
            if (!url.pathname.includes("/api/"))
              return route.fulfill({
                contentType: "text/html",
                body:
                  "<!doctype html><html><head><style>" +
                  css +
                  '</style></head><body><div id="root"></div><script>' +
                  bundle.outputFiles[0].text +
                  "</script></body></html>",
              });
            const action = url.pathname.split("/").pop(),
              body =
                request.method() === "POST" ? request.postDataJSON() : null;
            let result = {};
            if (action === "invitation-info") result = { version };
            if (action === "request-code") {
              codeRequests++;
              result = { challenge: "synthetic-challenge" };
            }
            if (action === "verify-code") {
              assert.equal(body.code, "123456");
              result = { success: true };
            }
            if (action === "response")
              result = {
                draft: stored,
                revision,
                progress,
                status,
                updatedAt: new Date().toISOString(),
                campaign: {
                  ...proxyContext,
                  name: "Synthetic reviewed campaign",
                  privacy:
                    "We use these answers to understand current work and improve support. This is synthetic QA data.",
                  version,
                  closed: false,
                  manager: { isPeopleManager: false },
                },
              };
            if (action === "save" || action === "submit") {
              if(proxyMode) assert.equal(body.participantId,"synthetic-proxy-anne");
              assert.equal(body.revision, revision);
              stored = body.draft;
              revision++;
              progress = body.progress;
              status = action === "submit" ? "completed" : "in_progress";
              saves++;
              result = {
                revision,
                status,
                copyStatus:
                  action === "submit" && stored.answerCopy ? "preview" : null,
              };
            }
            return route.fulfill({
              contentType: "application/json",
              body: JSON.stringify(result),
            });
          },
        );
        await page.goto(
          "https://collection.example.invalid/baseline/start#" + "a".repeat(64),
        );
        // Old return emails may include a challenge: production must replace it.
        await page.getByLabel("Verification code", { exact: true }).waitFor();
        assert.equal(codeRequests, 1);
        assert.equal(
          await page
            .getByRole("button", {
              name: /Send verification code|Get a current code/,
            })
            .count(),
          0,
        );
        await page.goto(
          "https://collection.example.invalid/baseline/start?return=1#" +
            "a".repeat(64) +
            ":11111111-1111-4111-8111-111111111111",
        );
        await page.getByLabel("Verification code", { exact: true }).waitFor();
        assert.equal(codeRequests, 2);
        await page
          .getByLabel("Verification code", { exact: true })
          .fill("123456");
        await page
          .getByRole("button", { name: "Verify and continue", exact: true })
          .click();
        if(proxyMode) await page.getByRole("note",{name:"Completed on behalf"}).getByText("Completed on behalf of Synthetic Anne",{exact:true}).waitFor();
        const start = page.getByRole("button", {
          name: "Start questionnaire",
          exact: true,
        });
        assert.equal(await start.isDisabled(), true);
        await page.getByText(/This questionnaire is not anonymous/).waitFor();
        await page
          .getByLabel(
            "I understand how my answers will be used and that my name and personal information will be visible with my responses.",
            {
              exact: true,
            },
          )
          .check();
        assert.equal(await start.isEnabled(), true);
        await start.click();
        assert.equal(await page.locator(".tb-guidance-note").count(), 1);
        await page
          .getByRole("checkbox", {
            name: "Reception, facilities and office support",
            exact: true,
          })
          .check();
        await page
          .getByRole("button", { name: "Continue", exact: true })
          .click();
        const saveWait = page.waitForResponse((r) =>
          r.url().endsWith("/api/baseline/save"),
        );
        await page.getByText(/If you work part time:/).waitFor();
        await page
          .getByLabel("Time spent: Reception, facilities and office support", {
            exact: true,
          })
          .fill("100");
        await saveWait;
        await page
          .getByRole("status")
          .filter({ hasText: "Saved securely" })
          .waitFor();
        assert.equal(stored.broad.time.office, 100);
        assert.ok(saves > 0);
        await page.reload();
        assert.equal(
          await page
            .getByLabel(
              "Time spent: Reception, facilities and office support",
              {
                exact: true,
              },
            )
            .inputValue(),
          "100",
        );
        await page
          .getByRole("button", { name: "Continue", exact: true })
          .click();
        await page
          .getByRole("checkbox", {
            name: "Main contact routes: Work email (your own work address)",
            exact: true,
          })
          .check();
        await page
          .getByLabel("Request share: Work email (your own work address)", {
            exact: true,
          })
          .fill("100");
        for (const [label, value] of [
          [
            "Are these requests recorded so others can see their status?",
            "none",
          ],
          [
            "How often does the same request reach more than one person or arrive through more than one route?",
            "rarely",
          ],
          ["Do employees and managers generally use the same routes?", "same"],
        ])
          await page.getByLabel(label, { exact: true }).selectOption(value);
        await page
          .getByRole("button", { name: "Continue", exact: true })
          .click();
        const info = page.getByRole("button", {
          name: "More information: Do you regularly support one business or more than one?",
          exact: true,
        });
        await info.focus();
        await page.getByRole("tooltip").waitFor();
        await info.press("Escape");
        await page
          .getByLabel(
            "Do you regularly support one business or more than one?",
            {
              exact: true,
            },
          )
          .selectOption("one");
        if (version === m.exports.COLLECTION_VERSION)
          await page
            .getByRole("checkbox", {
              name: "Does any of your work need the following?: None of these",
              exact: true,
            })
            .check();
        await page
          .getByRole("checkbox", {
            name: "Systems and tools you use regularly: Excel",
            exact: true,
          })
          .check();
        const closingQuestion =
          "Anything important about your work we have missed? (optional)";
        assert.equal(
          await page.getByLabel(closingQuestion, { exact: true }).count(),
          0,
        );
        await page
          .getByRole("button", { name: "Review answers", exact: true })
          .click();
        assert.equal(
          await page.locator("textarea").last().getAttribute("aria-label"),
          closingQuestion,
        );
        await page
          .getByLabel(closingQuestion, { exact: true })
          .fill("A final detail after all selected work areas.");
        if (process.env.BASELINE_SCREENSHOT_DIR) {
          fs.mkdirSync(process.env.BASELINE_SCREENSHOT_DIR, {
            recursive: true,
          });
          await page.screenshot({
            path: path.join(
              process.env.BASELINE_SCREENSHOT_DIR,
              mobile ? "collection-mobile.png" : "collection-desktop.png",
            ),
            fullPage: true,
          });
        }
        await page
          .getByLabel(
            "I would like a copy sent to the email address used for my invitation.",
            { exact: true },
          )
          .check();
        await page
          .getByRole("button", { name: "Submit answers", exact: true })
          .click();
        await page
          .getByRole("heading", {
            name: "Thank you. Your answers have been submitted.",
            exact: true,
          })
          .waitFor();
        if(proxyMode) await page.getByRole("note",{name:"Completed on behalf"}).getByText("Completed on behalf of Synthetic Anne",{exact:true}).waitFor();
        assert.equal(status, "completed");
        assert.equal(stored.answerCopy, true);
        assert.equal(
          stored.rich.missing,
          "A final detail after all selected work areas.",
        );
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        await page.reload();
        await page
          .getByRole("heading", {
            name: "Thank you. Your answers have been submitted.",
            exact: true,
          })
          .waitFor();
        if (process.env.BASELINE_SCREENSHOT_DIR) {
          const previewMessages = [
            [
              "invite",
              emailModule.exports.invitationEmail(
                "team.blue Current work baseline",
                "https://assessment.example.invalid/start",
                "2026-10-27T23:59:59Z",
              ),
            ],
            [
              "code",
              emailModule.exports.verificationEmail(
                "123456",
                "https://collection.example.invalid/baseline/start#synthetic-preview",
              ),
            ],
          ];
          for (const [name, message] of previewMessages) {
            await page.setContent(message.html);
            await page.screenshot({
              path: path.join(
                process.env.BASELINE_SCREENSHOT_DIR,
                `${name}-email-${mobile ? "mobile" : "desktop"}.png`,
              ),
              fullPage: true,
            });
          }
        }
        await page.close();
      }
    for (const mobile of [false, true])
      for (const copyStatus of ["pending", "disabled", "failed", "sent"]) {
        const page = await browser.newPage({
          viewport: mobile
            ? { width: 390, height: 844 }
            : { width: 1280, height: 900 },
        });
        let copies = 0;
        const draft = m.exports.initialCollection();
        draft.answerCopy = true;
        await page.route("https://copy.example.invalid/**", async (route) => {
          const action = new URL(route.request().url()).pathname
            .split("/")
            .pop();
          if (action === "response")
            return route.fulfill({
              json: {
                draft,
                revision: 1,
                progress: 8,
                status: "completed",
                copyStatus,
                campaign: {
                  name: "team.blue",
                  privacy: "Synthetic QA",
                  closed: false,
                  copyPreview: false,
                  version: draft.version,
                  manager: { isPeopleManager: false },
                },
              },
            });
          if (action === "answer-copy") {
            assert.equal(route.request().method(), "POST");
            copies++;
            return route.fulfill({ json: { copyStatus: "sent" } });
          }
          return route.fulfill({
            contentType: "text/html",
            body:
              '<div id="root"></div><script>' +
              bundle.outputFiles[0].text +
              "</script>",
          });
        });
        await page.goto("https://copy.example.invalid/baseline/start");
        await page
          .getByRole("heading", {
            name: "Thank you. Your answers have been submitted.",
            exact: true,
          })
          .waitFor();
        assert.doesNotMatch(
          await page.locator("body").innerText(),
          /Van Esch Advisory|queued for delivery/,
        );
        if (copyStatus === "disabled") {
          await page.getByText(/Email delivery is not enabled/).waitFor();
          assert.equal(
            await page
              .getByRole("button", { name: "Retry email copy" })
              .count(),
            0,
          );
          assert.equal(copies, 0);
        } else if (copyStatus === "failed") {
          await page.getByText(/could not confirm delivery/).waitFor();
          await page.getByRole("button", { name: "Retry email copy" }).click();
          await page
            .getByText(
              "A copy has been emailed to the address used for your invitation.",
              { exact: true },
            )
            .waitFor();
          assert.equal(copies, 1);
        } else {
          await page
            .getByText(
              "A copy has been emailed to the address used for your invitation.",
              { exact: true },
            )
            .waitFor();
          assert.equal(copies, copyStatus === "pending" ? 1 : 0);
        }
        await page.close();
      }
    for (const email of [
      emailModule.exports.invitationEmail(
        "team.blue",
        "https://example.invalid",
        "2026-10-30T23:59:59Z",
      ),
      emailModule.exports.verificationEmail("123456"),
      emailModule.exports.answerCopyEmail({ workAreas: [] }),
    ])
      assert.doesNotMatch(email.text + email.html, /Van Esch Advisory/);
  } finally {
    await browser.close();
  }
  console.log(
    "Reviewed collection desktop/mobile: verification UI, authoritative manager context, autosave/resume, accessible help, final submission and saved answer-copy preference passed. Mocked email only.",
  );
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
