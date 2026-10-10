// Render the real React journey in Chromium against a synthetic API.
// The server/D1/security contract is tested separately in tests/d1/baseline.test.cjs.
const { chromium } = require(process.env.BASELINE_PLAYWRIGHT_PATH || "playwright");
const esbuild = require("esbuild");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const root = require("node:path").resolve(__dirname, "../..");
(async () => {
  const modelBuild = await esbuild.build({
    entryPoints: [root + "/lib/baseline/model.ts"],
    bundle: true,
    platform: "node",
    format: "cjs",
    write: false,
  });
  const module = { exports: {} };
  new Function("module", "exports", modelBuild.outputFiles[0].text)(
    module,
    module.exports,
  );
  const m = module.exports;
  const built = await esbuild.build({
    stdin: {
      contents:
        'import React from "react";import {createRoot} from "react-dom/client";import Journey from "./app/baseline/start/journey";createRoot(document.getElementById("root")).render(<Journey/>);',
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
  const browser = await chromium.launch({
    channel: "chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    for (const mobile of [false, true]) {
      const page = await browser.newPage({
        viewport: mobile
          ? { width: 390, height: 844 }
          : { width: 1280, height: 900 },
      });
      let revision = 0,
        progress = 0,
        status = "not_started",
        saves = 0;
      let draft = m.initialDraft({
        name: "Synthetic person",
        email: "synthetic@example.invalid",
        job_title: "Reception coordinator",
        country: "GB",
        work_type: "reception",
      });
      await page.route("https://baseline.example.invalid/**", async (route) => {
        const path = new URL(route.request().url()).pathname;
        if (path === "/baseline/start")
          return route.fulfill({
            contentType: "text/html",
            body: '<!doctype html><html><head></head><body><div id="root"></div></body></html>',
          });
        let data = {};
        if (path.endsWith("/response"))
          data = {
            draft,
            campaign: {
              name: "Synthetic QA campaign",
              privacy: m.PRIVACY,
              closed: false,
            },
            revision,
            progress,
            status,
          };
        else if (path.endsWith("/save") || path.endsWith("/submit")) {
          const body = route.request().postDataJSON();
          assert.equal(body.revision, revision);
          draft = m.parseDraft(body.draft);
          revision++;
          progress = body.progress;
          status = path.endsWith("/submit") ? "completed" : "in_progress";
          saves++;
          data = { revision, status };
        } else data = { success: true };
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify(data),
        });
      });
      await page.goto(
        "https://baseline.example.invalid/baseline/start#" + "a".repeat(64),
      );
      await page.addStyleTag({
        content: fs.readFileSync(
          root + "/app/baseline/start/style.css",
          "utf8",
        ),
      });
      await page.addScriptTag({ content: built.outputFiles[0].text });
      await page
        .getByLabel("I have read and understand this data-use statement.")
        .check();
      await page
        .getByRole("button", { name: "Start assessment", exact: true })
        .click();
      assert.equal(new URL(page.url()).hash, "");
      await page.getByLabel("Do you manage people?").selectOption("no");
      await page.getByLabel("Group / all team.blue", { exact: true }).check();
      const next = () =>
        page
          .getByRole("button", { name: "Save and continue", exact: true })
          .click();
      await next();
      await page.getByLabel("Reception / front desk", { exact: true }).check();
      assert.equal(
        await page
          .getByLabel("Manager advice and coaching", { exact: true })
          .count(),
        0,
      );
      await next();
      await page.getByLabel("Reception / front desk percentage").fill("70");
      await next();
      await page.getByRole("alert").filter({ hasText: "100%" }).waitFor();
      await page.getByLabel("Reception / front desk percentage").fill("100");
      await next();
      await page
        .getByLabel("What do you normally do in this area?")
        .fill("Welcome visitors and coordinate the front desk.");
      await page
        .getByLabel("How often do you normally do this work?")
        .selectOption("most_days");
      await page
        .getByLabel("Which best describes your role in this work?")
        .selectOption("administration_support");
      await next();
      await page
        .getByLabel("Do you have important occasional work?")
        .selectOption("no");
      await next();
      await page.getByLabel("Excel", { exact: true }).check();
      await page.getByLabel("Office / facilities", { exact: true }).check();
      await next();
      await page.getByLabel("Email", { exact: true }).check();
      await next();
      await page
        .getByLabel(
          "What works particularly well today and should we make sure we keep? (optional)",
        )
        .fill("Local office knowledge.");
      await page.waitForFunction(() =>
        document
          .querySelector(".tb-save")
          ?.textContent.includes("Saved securely"),
      );
      assert.equal(draft.strengths, "Local office knowledge.");
      assert.ok(saves >= 8);
      assert.equal(progress, 7);
      // Recreate the component to simulate resuming the saved response.
      await page.reload();
      await page.addStyleTag({
        content: fs.readFileSync(
          root + "/app/baseline/start/style.css",
          "utf8",
        ),
      });
      await page.addScriptTag({ content: built.outputFiles[0].text });
      assert.equal(
        await page
          .getByLabel(
            "What works particularly well today and should we make sure we keep? (optional)",
          )
          .inputValue(),
        "Local office knowledge.",
      );
      await page
        .getByRole("button", { name: "Review answers", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Submit response", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Thank you. Your response is complete." })
        .waitFor();
      assert.equal(status, "completed");
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      );
      await page.close();
    }
    console.log(
      "Desktop/mobile journey, branching, percentage errors, autosave, resume and submission passed. Synthetic data only.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
