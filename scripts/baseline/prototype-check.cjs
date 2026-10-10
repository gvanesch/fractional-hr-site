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
      const button = (name) => page.getByRole("button", { name, exact: true });
      const pick = (label, value) =>
        page.getByLabel(label, { exact: true }).selectOption(value);
      const check = (label) =>
        page.getByRole("checkbox", { name: label, exact: true }).check();
      async function finishContext() {
        await pick(
          "Do you regularly support one business or more than one?",
          "several",
        );
        await page
          .getByLabel("What works well and should we keep? (optional)", {
            exact: true,
          })
          .fill("Local knowledge");
        await button("Review answers").click();
        await page.getByRole("alert").waitFor();
        assert.ok((await page.locator("fieldset.tb-invalid").count()) >= 5);
        const contributions = page.getByRole("checkbox", {
          name: /^Contribution: .*: Not sure$/,
        });
        const count = await contributions.count();
        assert.ok(count > 0);
        for (let i = 0; i < count; i++) await contributions.nth(i).check();
        await check(
          "Who do you mainly depend on to complete your work?: Finance",
        );
        await check(
          "What knowledge do colleagues rely on you for?: Office / facilities",
        );
        await check("Systems and tools you use regularly: Slack");
        await check("What creates extra manual work?: Waiting for information");
        await button("Review answers").click();
        await page
          .getByRole("heading", { name: "Review", exact: true })
          .waitFor();
      }
      await button("Start with empty answers").click();
      await button("Continue").click();
      await page
        .getByRole("alert")
        .filter({ hasText: "Choose at least one work area" })
        .waitFor();
      await check("Employee lifecycle support");
      assert.equal(await page.getByRole("checkbox").count(), 10);
      await button("Continue").click();
      assert.equal(await page.locator('input[type="number"]').count(), 1);
      await page.locator('input[type="number"]').fill("100");
      await button("Continue").click();
      await pick(
        "Do you or your team receive employee or manager requests?",
        "yes",
      );
      await check("Main contact routes: Personal email");
      await check("Main contact routes: Ticket / service portal");
      await page
        .getByLabel("Request share: Personal email", { exact: true })
        .fill("60");
      await page
        .getByLabel("Request share: Ticket / service portal", { exact: true })
        .fill("20");
      await pick(
        "Are these requests recorded so others can see their status?",
        "some",
      );
      await pick(
        "How often does the same request reach more than one person or arrive through more than one route?",
        "often",
      );
      await pick(
        "Do employees and managers generally use the same routes?",
        "different",
      );
      await button("Continue").click();
      assert.equal(await page.locator('input[aria-invalid="true"]').count(), 2);
      await page
        .getByLabel("Request share: Ticket / service portal", { exact: true })
        .fill("40");
      await check("Main employee routes: Ticket / service portal");
      await check("Main manager routes: Personal email");
      await button("Continue").click();
      await finishContext();
      assert.equal(await page.locator(".tb-review-area").count(), 1);
      await page
        .getByText("Personal email: 60% of requests", { exact: true })
        .waitFor();
      await button("Edit your work areas").click();
      await check("Reception, facilities and office support");
      await button("Return to review").click();
      await page.getByRole("alert").waitFor();
      await page
        .getByLabel("Time spent: Employee lifecycle support", { exact: true })
        .fill("70");
      await page
        .getByLabel("Time spent: Reception, facilities and office support", {
          exact: true,
        })
        .fill("30");
      await button("Return to review").click();
      await page
        .getByRole("heading", {
          name: "Scope and working context",
          exact: true,
        })
        .waitFor();
      await check(
        "Contribution: Reception, facilities and office support: Coordinating or leading work",
      );
      await button("Return to review").click();
      await page
        .getByRole("heading", { name: "Review", exact: true })
        .waitFor();
      assert.equal(await page.locator(".tb-review-area").count(), 2);
      assert.equal(apiRequests, 0);
      // Broad roles still get nine percentages; benefits-only work skips payroll detail.
      await page.reload();
      await mount();
      await button("Try a broad example").click();
      await button("Continue").click();
      assert.equal(await page.locator('input[type="number"]').count(), 9);
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
      await button("Continue").click();
      await pick(
        "Do you or your team receive employee or manager requests?",
        "no",
      );
      assert.equal(await page.locator('input[type="number"]').count(), 0);
      await button("Continue").click();
      await pick("Are you personally involved in payroll?", "no");
      assert.equal(
        await page
          .getByLabel("Personal payroll days per cycle", { exact: true })
          .count(),
        0,
      );
      await button("Continue").click();
      await finishContext();
      assert.equal(await page.locator(".tb-review-area").count(), 9);
      // Edit payroll only; other completed steps should not need repeating.
      await button("Edit payroll responsibilities").click();
      await pick("Are you personally involved in payroll?", "yes");
      const stages = [
        "Collect employee changes and other inputs",
        "Prepare and enter payroll information",
        "Calculate payroll",
        "Check results and resolve errors",
        "Approve payroll",
        "Release payments",
        "Reconcile payroll and accounting records",
        "Answer employee payroll questions",
      ];
      for (const label of stages) {
        const card = page
          .locator("details")
          .filter({ has: page.locator("summary").filter({ hasText: label }) });
        if (!(await card.evaluate((el) => el.open)))
          await card.locator("summary").click();
        await pick(
          "Your part: " + label,
          label === "Calculate payroll" ? "none" : "coordinate",
        );
        await check(
          "Who else does this stage? " +
            label +
            ": " +
            (label === "Calculate payroll"
              ? "External payroll partner"
              : "Finance"),
        );
      }
      await pick(
        "How often does the payroll cycle you support run?",
        "monthly",
      );
      await page
        .getByLabel("Personal payroll days per cycle", { exact: true })
        .fill("3.5");
      await button("Return to review").click();
      await page
        .getByRole("heading", { name: "Review", exact: true })
        .waitFor();
      await page.getByText(/Personal payroll days: 3.5/).waitFor();
      await page
        .getByText(/I am not involved. Others: External payroll partner/)
        .waitFor();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      assert.equal(apiRequests, 0);
      await page.close();
    }
    console.log(
      "Focused baseline prototype: broad time groups, contact routes/percentages, employee-manager differences, conditional payroll, provider/Finance contributions, required structured context, review edits and zero API writes passed on desktop/mobile.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
