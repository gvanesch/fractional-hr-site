const { chromium } = require(
    process.env.BASELINE_PLAYWRIGHT_PATH || "playwright",
  ),
  esbuild = require("esbuild"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const root = path.resolve(__dirname, "../..");
(async () => {
  const build = async (manager) =>
    esbuild.build({
      stdin: {
        contents:
          'import React from "react";import {createRoot} from "react-dom/client";import Prototype from "./app/advisor/baseline/prototype/prototype";createRoot(document.getElementById("root")).render(<Prototype managerRecord={{isPeopleManager:' +
          manager +
          ",directReports:6}}/>);",
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
  const yes = await build(true),
    no = await build(false);
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
      let api = 0;
      await page.route("https://manager.example.invalid/**", (route) => {
        if (route.request().url().includes("/api/")) api++;
        return route.fulfill({
          contentType: "text/html",
          body: '<!doctype html><html><body><div id="root"></div></body></html>',
        });
      });
      const mount = async (built) => {
        await page.goto(
          "https://manager.example.invalid/advisor/baseline/prototype",
        );
        await page.addStyleTag({
          content:
            "*,*::before,*::after{box-sizing:border-box}body{margin:0;font-family:ui-sans-serif,system-ui,sans-serif}h1,h2,h3,h4,p{margin:0}" +
            fs.readFileSync(root + "/app/baseline/start/style.css", "utf8") +
            fs.readFileSync(
              root + "/app/advisor/baseline/prototype/prototype.css",
              "utf8",
            ),
        });
        await page.addScriptTag({ content: built.outputFiles[0].text });
      };
      const btn = (name) => page.getByRole("button", { name, exact: true }),
        check = (name) =>
          page.getByRole("checkbox", { name, exact: true }).check(),
        pick = (name, value) =>
          page.getByLabel(name, { exact: true }).selectOption(value);
      await mount(no);
      await btn("Start with empty answers").click();
      assert.equal(
        await page
          .getByRole("checkbox", {
            name: "People management and team leadership",
            exact: true,
          })
          .count(),
        0,
      );
      await mount(yes);
      await btn("Start with empty answers").click();
      await check("Employee lifecycle support");
      await check("People management and team leadership");
      await btn("Continue").click();
      await page
        .getByLabel("Time spent: Employee lifecycle support", { exact: true })
        .fill("70");
      await page
        .getByLabel("Time spent: People management and team leadership", {
          exact: true,
        })
        .fill("30");
      await btn("Continue").click();
      await check("Main contact routes: Work email (your own work address)");
      await page
        .getByLabel("Request share: Work email (your own work address)", {
          exact: true,
        })
        .fill("100");
      await pick(
        "Are these requests recorded so others can see their status?",
        "none",
      );
      await pick(
        "How often does the same request reach more than one person or arrive through more than one route?",
        "unknown",
      );
      await pick(
        "Do employees and managers generally use the same routes?",
        "same",
      );
      await btn("Continue").click();
      await page
        .getByRole("heading", { name: "Managing your team", exact: true })
        .waitFor();
      assert.equal(await page.locator("input[type=number]").count(), 5);
      await btn("Continue").click();
      await page.getByRole("alert").waitFor();
      assert.ok(
        (await page.getByRole("alert").innerText()).includes(
          "100% of your management time",
        ),
      );
      const shares = [
        ["Team coordination", "30"],
        ["Individual support", "40"],
        ["Hiring and team changes", "20"],
        ["Management administration", "10"],
      ];
      for (const [label, value] of shares)
        await page
          .getByLabel("Management time: " + label, { exact: true })
          .fill(value);
      assert.equal(
        await page
          .getByLabel("Management time: Other management work", { exact: true })
          .inputValue(),
        "0",
      );
      assert.equal(
        await page
          .getByLabel(
            "Do you manage people who also report to another manager?",
            { exact: true },
          )
          .count(),
        0,
      );
      await page
        .getByLabel(
          "Where could clearer processes or support save management time? (optional)",
          { exact: true },
        )
        .fill("Repeated coordination meetings");
      await btn("Continue").click();
      await pick(
        "Do you regularly support one business or more than one?",
        "one",
      );
      assert.equal(
        await page
          .getByRole("group", {
            name: "Does any of your work need the following?",
            exact: true,
          })
          .count(),
        0,
      );
      await check("Systems and tools you use regularly: Excel");
      await btn("Review answers").click();
      await page
        .getByText("People management and team leadership: 30%", {
          exact: true,
        })
        .waitFor();
      assert.equal(await page.getByText(/Shared reporting:/).count(), 0);
      await page
        .getByText(
          "Team coordination: 30% of management time (9% of working time)",
          { exact: true },
        )
        .waitFor();
      await btn("Edit managing your team").click();
      await page
        .getByLabel("Management time: Other management work", { exact: true })
        .fill("10");
      await btn("Return to review").click();
      assert.ok(
        (await page.getByRole("alert").innerText()).includes(
          "100% of your management time",
        ),
      );
      assert.equal(
        await page
          .getByLabel("Management time: Team coordination", { exact: true })
          .getAttribute("aria-invalid"),
        "true",
      );
      await page
        .getByLabel("Management time: Team coordination", { exact: true })
        .fill("20");
      await btn("Return to review").click();
      assert.equal(
        await page
          .getByLabel("Describe your other management work", { exact: true })
          .getAttribute("aria-invalid"),
        "true",
      );
      await page
        .getByLabel("Describe your other management work", { exact: true })
        .fill("Own-team wellbeing check-ins");
      if (process.env.BASELINE_SCREENSHOT_DIR) {
        fs.mkdirSync(process.env.BASELINE_SCREENSHOT_DIR, { recursive: true });
        await page.screenshot({
          path: path.join(
            process.env.BASELINE_SCREENSHOT_DIR,
            "management-" + (mobile ? "mobile" : "desktop") + ".png",
          ),
          fullPage: true,
        });
      }
      await btn("Return to review").click();
      await page
        .getByText(
          "Team coordination: 20% of management time (6% of working time)",
          { exact: true },
        )
        .waitFor();
      await page
        .getByText(/Other management work: 10% of management time/)
        .waitFor();
      await btn("Edit managing your team").click();
      await check("Not sure how to split my management time");
      assert.equal(await page.locator("input[type=number]").count(), 0);
      await btn("Return to review").click();
      await page
        .getByText("Management time split: Not sure", { exact: true })
        .waitFor();
      assert.equal(
        await page.getByText(/Team coordination:.*of management time/).count(),
        0,
      );
      await btn("Edit your work areas").click();
      await page
        .getByRole("checkbox", {
          name: "People management and team leadership",
          exact: true,
        })
        .uncheck();
      await btn("Continue").click();
      await page
        .getByLabel("Time spent: Employee lifecycle support", { exact: true })
        .fill("100");
      await btn("Return to review").click();
      await page
        .getByRole("heading", { name: "Review", exact: true })
        .waitFor();
      assert.equal(await btn("Edit managing your team").count(), 0);
      assert.equal(
        await page
          .getByRole("heading", { name: "Managing your team", exact: true })
          .count(),
        0,
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      assert.equal(api, 0);
      await page.close();
    }
  } finally {
    await browser.close();
  }
  console.log(
    "Manager roster branching, management-only time shares, percentage validation, Other description, uncertainty, review edits, optional local context and mobile layout passed. No API writes.",
  );
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
