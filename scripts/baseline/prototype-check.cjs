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
        .getByRole("button", { name: "Start with empty answers", exact: true })
        .click();
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      await page
        .getByRole("alert")
        .filter({ hasText: "Choose at least one work area" })
        .waitFor();
      // A single broad selection is enough; examples never become individual answers.
      await page
        .getByRole("checkbox", {
          name: "Employee lifecycle support",
          exact: true,
        })
        .check();
      assert.equal(await page.getByRole("checkbox").count(), 10);
      assert.equal(await page.getByRole("combobox").count(), 0);
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      assert.equal(await page.locator('input[type="number"]').count(), 1);
      await page.locator('input[type="number"]').fill("100");
      await page
        .getByRole("button", { name: "Review answers", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Review", exact: true })
        .waitFor();
      assert.equal(await page.locator(".tb-review-area").count(), 1);
      await page
        .getByRole("button", { name: "Edit work areas", exact: true })
        .click();
      await page
        .getByRole("checkbox", {
          name: "Reception, facilities and office support",
          exact: true,
        })
        .check();
      await page
        .getByRole("button", { name: "Return to review", exact: true })
        .click();
      await page.getByRole("alert").waitFor();
      assert.equal(await page.locator('input[aria-invalid="true"]').count(), 1);
      await page
        .getByLabel("Time spent: Employee lifecycle support", { exact: true })
        .fill("70");
      await page
        .getByLabel("Time spent: Reception, facilities and office support", {
          exact: true,
        })
        .fill("30");
      await page
        .getByRole("button", { name: "Return to review", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Review", exact: true })
        .waitFor();
      assert.equal(await page.locator(".tb-review-area").count(), 2);
      assert.equal(apiRequests, 0);
      // Full breadth still produces just nine percentages and no task-detail page.
      await page.reload();
      await mount();
      await page
        .getByRole("button", { name: "Try a broad example", exact: true })
        .click();
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      assert.equal(await page.locator('input[type="number"]').count(), 9);
      await page.locator('input[type="number"]').first().fill("70");
      await page
        .getByRole("button", { name: "Review answers", exact: true })
        .click();
      await page.getByRole("alert").waitFor();
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
      await page.locator('input[type="number"]').first().fill("");
      await page
        .getByRole("button", { name: "Review answers", exact: true })
        .click();
      assert.equal(await page.locator('input[aria-invalid="true"]').count(), 1);
      await page.locator('input[type="number"]').first().fill("11");
      await page
        .getByLabel(
          "Any important work that this typical month misses? (optional)",
          { exact: true },
        )
        .fill("Annual audit");
      await page
        .getByRole("button", { name: "Review answers", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Review", exact: true })
        .waitFor();
      assert.equal(await page.locator(".tb-review-area").count(), 9);
      await page.getByText("Annual audit", { exact: true }).waitFor();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      assert.equal(apiRequests, 0);
      await page.close();
    }
    console.log(
      "Broad-work prototype: group-only selection, bounded percentages, yellow validation, sticky total, review edits, occasional work and zero API writes passed on desktop/mobile.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
