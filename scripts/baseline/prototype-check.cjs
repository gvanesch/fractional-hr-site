// Exercise the real prototype component. No D1, invitations, email or persistent answers.
const { chromium } = require(
  process.env.BASELINE_PLAYWRIGHT_PATH || "playwright",
);
const esbuild = require("esbuild"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const root = path.resolve(__dirname, "../..");
(async () => {
  const logic = await esbuild.build({
    entryPoints: [root + "/lib/baseline/prototype.ts"],
    bundle: true,
    platform: "node",
    format: "cjs",
    write: false,
  });
  const mod = { exports: {} };
  new Function("module", "exports", logic.outputFiles[0].text)(
    mod,
    mod.exports,
  );
  const m = mod.exports;
  const built = await esbuild.build({
    stdin: {
      contents:
        'import React from "react";import {createRoot} from "react-dom/client";import Prototype from "./app/advisor/baseline/prototype/prototype";createRoot(document.getElementById("root")).render(<Prototype/>);',
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
      let apiRequests = 0;
      await page.route("https://prototype.example.invalid/**", (route) => {
        if (new URL(route.request().url()).pathname.includes("/api/"))
          apiRequests++;
        return route.fulfill({
          contentType: "text/html",
          body: '<!doctype html><html><body><div id="root"></div></body></html>',
        });
      });
      async function mount() {
        await page.addStyleTag({
          content:
            fs.readFileSync(root + "/app/baseline/start/style.css", "utf8") +
            fs.readFileSync(
              root + "/app/advisor/baseline/prototype/prototype.css",
              "utf8",
            ),
        });
        await page.addScriptTag({ content: built.outputFiles[0].text });
      }
      await page.goto(
        "https://prototype.example.invalid/advisor/baseline/prototype",
      );
      await mount();
      await page
        .getByRole("button", {
          name: "Try a broad example (all activities)",
          exact: true,
        })
        .click();
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      assert.equal(await page.locator('input[type="number"]').count(), 9);
      await page.locator('input[type="number"]').first().fill("70");
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      await page.getByRole("alert").waitFor();
      assert.equal(await page.locator('input[aria-invalid="true"]').count(), 9);
      for (let i = 0; i < 9; i++)
        await page
          .locator('input[type="number"]')
          .nth(i)
          .fill(i === 8 ? "12" : "11");
      assert.equal(
        await page
          .locator(".tb-total")
          .evaluate((el) => getComputedStyle(el).position),
        "sticky",
      );
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      await page
        .getByRole("button", { name: "Review answers", exact: true })
        .click();
      await page.getByRole("alert").waitFor();
      for (let i = 0; i < m.PROCESSES.length; i++) {
        const p = m.PROCESSES[i],
          details = page.locator("details").nth(i);
        if (!(await details.evaluate((el) => el.open)))
          await details.locator("summary").click();
        await page
          .getByLabel("Group frequency: " + p.label, { exact: true })
          .selectOption("most_days");
        await page
          .getByLabel("Group part in the work: " + p.label, { exact: true })
          .selectOption("administration_support");
        await details
          .getByRole("button", {
            name: /Apply to .* activities with empty answers/,
          })
          .click();
      }
      const cases = page
        .locator("details")
        .nth(m.PROCESSES.findIndex((p) => p.code === "advice_cases"));
      await cases.locator("summary").click();
      await page
        .getByLabel("Your part: Employee relations", { exact: true })
        .selectOption("final_result");
      await page
        .getByLabel("How often? Employee relations", { exact: true })
        .selectOption("few_times_year");
      await page
        .locator('[data-activity="bp_02"]')
        .getByLabel("Important occasional responsibility")
        .check();
      await page
        .getByRole("button", { name: "Review answers", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Review", exact: true })
        .waitFor();
      assert.equal(await page.locator(".tb-review-activity").count(), 60);
      await page
        .getByText(
          /A few times each year · I am responsible for the final result · Important occasional responsibility/,
        )
        .waitFor();
      assert.equal(await page.locator('input[type="number"]').count(), 0);
      await page
        .getByRole("button", { name: "Edit time by process", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Return to review", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Review", exact: true })
        .waitFor();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      assert.equal(apiRequests, 0);
      await page.reload();
      await mount();
      await page
        .getByRole("button", { name: "Start with empty answers", exact: true })
        .click();
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      await page
        .getByRole("alert")
        .filter({ hasText: "Choose at least one activity" })
        .waitFor();
      await page.close();
    }
    console.log(
      "Prototype: 60 activities, nine time entries, all-activity coverage, explicit bulk answers, exceptions, occasional responsibility, review and zero API writes passed on desktop/mobile.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
