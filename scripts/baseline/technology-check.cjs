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
        'import React from "react";import {createRoot} from "react-dom/client";import Prototype from "./app/advisor/baseline/prototype/prototype";createRoot(document.getElementById("root")).render(<Prototype technologyPreview/>);',
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
      let api = 0;
      await page.route("https://technology.example.invalid/**", (route) => {
        if (route.request().url().includes("/api/")) api++;
        return route.fulfill({
          contentType: "text/html",
          body: '<!doctype html><html><body><div id="root"></div></body></html>',
        });
      });
      await page.goto(
        "https://technology.example.invalid/advisor/baseline/prototype",
      );
      await page.addStyleTag({
        content:
          fs.readFileSync(root + "/app/baseline/start/style.css", "utf8") +
          fs.readFileSync(
            root + "/app/advisor/baseline/prototype/prototype.css",
            "utf8",
          ),
      });
      await page.addScriptTag({ content: built.outputFiles[0].text });
      const button = (name) => page.getByRole("button", { name, exact: true }),
        pick = (label, value) =>
          page.getByLabel(label, { exact: true }).selectOption(value),
        check = (label) =>
          page.getByRole("checkbox", { name: label, exact: true }).check();
      await button("Start with empty answers").click();
      await page
        .getByRole("checkbox", {
          name: "Systems, data and improvement",
          exact: false,
        })
        .check();
      await button("Continue").click();
      await page
        .getByLabel("Time spent: People systems, data and improvement", {
          exact: true,
        })
        .fill("100");
      await button("Continue").click();
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
        "unknown",
      );
      await button("Continue").click();
      await pick(
        "Do you regularly support one business or more than one?",
        "one",
      );
      await check("Does any of your work need the following?: None of these");
      await check("Systems and tools you use regularly: HiBob");
      await button("Continue").click();
      await page
        .getByRole("heading", { name: "Your technology work", exact: true })
        .waitFor();
      await pick(
        "Do you support, maintain or improve systems, data or reports?",
        "no",
      );
      assert.equal(
        await page
          .getByLabel(
            "Technology time: Running and supporting existing systems",
            { exact: true },
          )
          .count(),
        0,
      );
      await button("Review answers").click();
      await page
        .getByText("I only use tools for my other work.", { exact: true })
        .waitFor();
      await button("Edit your technology work").click();
      await pick(
        "Do you support, maintain or improve systems, data or reports?",
        "yes",
      );
      await button("Return to review").click();
      await page.getByRole("alert").waitFor();
      assert.ok((await page.locator('[aria-invalid="true"]').count()) > 0);
      await check("Technology work you regularly do: Integrations");
      await page
        .getByText(
          "Connect systems and manage information moving between them.",
          { exact: true },
        )
        .waitFor();
      for (const [label, value] of [
        ["Running and supporting existing systems", "30"],
        ["Improving existing systems", "30"],
        ["Delivering new systems or projects", "40"],
      ])
        await page
          .getByLabel("Technology time: " + label, { exact: true })
          .fill(value);
      await check("Systems you support or improve: HiBob");
      await check(
        "Your involvement: HiBob: Technical configuration or development",
      );
      await check("Your involvement: HiBob: Overall responsibility");
      await page
        .getByText(
          "You are responsible for the platform service and its final results.",
          { exact: true },
        )
        .waitFor();
      await check(
        "Who do you regularly work with on this technology work?: IT",
      );
      await button("Return to review").click();
      await page
        .getByRole("heading", { name: "Review", exact: true })
        .waitFor();
      await page
        .getByText(
          "Running and supporting existing systems: 30% of technology time",
          { exact: true },
        )
        .waitFor();
      await button("Edit your work areas").click();
      await page
        .getByRole("checkbox", {
          name: "Systems, data and improvement",
          exact: false,
        })
        .uncheck();
      await page
        .getByRole("checkbox", {
          name: "Employee lifecycle support",
          exact: false,
        })
        .check();
      await button("Continue").click();
      await page
        .getByLabel("Time spent: Employee lifecycle support", {
          exact: true,
        })
        .fill("100");
      await button("Return to review").click();
      await page
        .getByRole("heading", { name: "Review", exact: true })
        .waitFor();
      assert.equal(await button("Edit your technology work").count(), 0);
      assert.equal(
        await page
          .getByRole("heading", { name: "Technology work", exact: true })
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
    "Advisor-only technology detail: tool-use skip, three time groups, platform roles, review edits, hidden answers and mobile layout passed.",
  );
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
