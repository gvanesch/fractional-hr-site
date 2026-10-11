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
      async function contactOneRoute() {
        assert.equal(
          await page
            .getByLabel(
              "Do you or your team receive employee or manager requests?",
              { exact: true },
            )
            .count(),
          0,
        );
        await check("Main contact routes: Work email (your own work address)");
        await page
          .getByLabel("Request share: Work email (your own work address)", {
            exact: true,
          })
          .fill("100");
        await pick(
          "Are these requests recorded so others can see their status?",
          "some",
        );
        for (const answer of ["none", "unknown"]) {
          await pick(
            "Are these requests recorded so others can see their status?",
            answer,
          );
          assert.equal(
            await page
              .getByLabel("How are requests tracked and followed up?", {
                exact: true,
              })
              .count(),
            0,
          );
        }
        await pick(
          "Are these requests recorded so others can see their status?",
          "most",
        );
        await button("Continue").click();
        assert.equal(
          await page
            .getByLabel("How are requests tracked and followed up?", {
              exact: true,
            })
            .getAttribute("aria-invalid"),
          "true",
        );
        await page
          .getByLabel("How are requests tracked and followed up?", {
            exact: true,
          })
          .fill("Shared spreadsheet with next-day response target");
        await pick(
          "How often does the same request reach more than one person or arrive through more than one route?",
          "sometimes",
        );
        await pick(
          "Do employees and managers generally use the same routes?",
          "same",
        );
        await button("Continue").click();
      }
      async function finishContext() {
        await pick(
          "Do you regularly support one business or more than one?",
          "several",
        );
        await button("Review answers").click();
        await page.getByRole("alert").waitFor();
        assert.ok(
          !(await page.getByRole("alert").innerText()).includes("100%"),
        );
        assert.equal(await page.locator("fieldset.tb-invalid").count(), 2);
        assert.equal(
          await page
            .getByText("Main contribution within work areas (required)", {
              exact: true,
            })
            .count(),
          0,
        );
        await check(
          "Does any of your work need the following?: Being physically present at an office or site",
        );
        await check("Systems and tools you use regularly: Excel");
        await page
          .getByLabel("What works well and should we keep? (optional)", {
            exact: true,
          })
          .fill("Local knowledge");
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
      await button("Continue").click();
      assert.equal(await page.locator('input[type="number"]').count(), 1);
      assert.equal(await page.getByRole("combobox").count(), 0);
      await page.locator('input[type="number"]').fill("100");
      await button("Continue").click();
      assert.equal(
        await page
          .getByLabel(
            "Do you or your team receive employee or manager requests?",
            { exact: true },
          )
          .count(),
        0,
      );
      await check("Main contact routes: Work email (your own work address)");
      await check("Main contact routes: Ticket / service portal");
      await page
        .getByLabel("Request share: Work email (your own work address)", {
          exact: true,
        })
        .fill("60");
      await page
        .getByLabel("Request share: Ticket / service portal", { exact: true })
        .fill("20");
      await pick(
        "Are these requests recorded so others can see their status?",
        "some",
      );
      await page
        .getByLabel("How are requests tracked and followed up?", {
          exact: true,
        })
        .fill("Jira; agreed next-day response target");
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
      await check("Main manager routes: Work email (your own work address)");
      await button("Continue").click();
      await finishContext();
      assert.equal(await page.locator(".tb-review-area").count(), 1);
      await page
        .getByText("Work email (your own work address): 60% of requests", {
          exact: true,
        })
        .waitFor();
      await page
        .getByText(
          /Tracking and follow-up: Jira; agreed next-day response target/,
        )
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
        .getByRole("heading", { name: "Review", exact: true })
        .waitFor();
      assert.equal(await page.locator(".tb-review-area").count(), 2);
      assert.equal(apiRequests, 0);
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
      assert.ok(!(await page.getByRole("alert").innerText()).includes("100%"));
      assert.equal(await page.getByRole("combobox").count(), 2);
      await pick(
        "Main type of work: Manager advice and employee cases",
        "mixed",
      );
      await pick(
        "Main type of work: People planning, performance and development",
        "routine",
      );
      await button("Continue").click();
      await contactOneRoute();
      await pick("Do you do any payroll-related work?", "no");
      assert.equal(
        await page
          .getByLabel("Personal payroll days per cycle", { exact: true })
          .count(),
        0,
      );
      await button("Continue").click();
      await finishContext();
      assert.equal(await page.locator(".tb-review-area").count(), 9);
      await button("Edit payroll responsibilities").click();
      await pick("Do you do any payroll-related work?", "yes");
      await button("Return to review").click();
      assert.ok(!(await page.getByRole("alert").innerText()).includes("100%"));
      const stages = [
        "Collect employee changes and payroll inputs",
        "Prepare or enter payroll information",
        "Check payroll results and resolve corrections",
        "Answer employee payroll questions",
      ];
      assert.equal(await page.getByRole("combobox").count(), 6);
      await pick("Your part: " + stages[0], "do");
      await pick("Your part: " + stages[1], "none");
      await check(
        "Who handles this work? " + stages[1] + ": External payroll partner",
      );
      await check("Who handles this work? " + stages[1] + ": Finance");
      await pick("Your part: " + stages[2], "unknown");
      assert.equal(
        await page
          .getByRole("checkbox", { name: new RegExp(stages[2]) })
          .count(),
        0,
      );
      await pick("Your part: " + stages[3], "coordinate");
      await page
        .getByLabel(
          "Any other payroll work or important responsibilities? (optional)",
          { exact: true },
        )
        .fill("Finance coordinates with our payroll partner");
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
        .getByText(
          /I am not involved. Handled by: External payroll partner, Finance/,
        )
        .waitFor();
      await page
        .getByText(/Additional payroll work: Finance coordinates/)
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
      "Focused baseline prototype: unconditional work contact, tracking explanation, four payroll areas, uninvolved/unknown actor handling, contextual errors, targeted work nature, lean final questions and zero API writes passed on desktop/mobile.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
