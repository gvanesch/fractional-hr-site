// Isolated browser contract. All responses and dashboard tokens are synthetic.
const { chromium } = require(
    process.env.BASELINE_PLAYWRIGHT_PATH || "playwright",
  ),
  esbuild = require("esbuild"),
  assert = require("node:assert/strict"),
  path = require("node:path"),
  fs = require("node:fs");
const root = path.resolve(__dirname, "../..");
(async () => {
  const built = await esbuild.build({
    stdin: {
      contents:
        'import React from "react";import{createRoot}from"react-dom/client";import Shared from"./app/baseline/dashboard/shared";createRoot(document.getElementById("root")).render(<Shared/>);',
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
      let mode = "ok",
        narrow = false,
        requests = 0;
      const token = "a".repeat(64);
      const rows = ["Alice Example", "Bob Example"].map((name, i) => ({
        participantId: "p" + i,
        name,
        email: "person" + i + "@example.invalid",
        jobTitle: "People Operations Specialist",
        country: "GB",
        region: "Northern Europe",
        entity: "Example",
        team: "People",
        regionalLeaderName: "Example leader",
        regionalLeaderEmail: "leader@example.invalid",
        status: i ? "in_progress" : "completed",
        active: true,
        invited: true,
        progress: i ? 3 : 8,
        updatedAt: "2026-10-20T12:00:00Z",
        submittedAt: i ? null : "2026-10-20T12:00:00Z",
      }));
      await page.route(
        "https://dashboard.example.invalid/**",
        async (route) => {
          const req = route.request();
          if (new URL(req.url()).pathname !== "/api/baseline/dashboard")
            return route.fulfill({
              contentType: "text/html",
              body: '<!doctype html><html><body><div id="root"></div></body></html>',
            });
          requests++;
          assert.equal(req.postDataJSON().token, token);
          if (mode !== "ok")
            return route.fulfill({
              status: mode === "revoked" ? 403 : 503,
              contentType: "application/json",
              body: JSON.stringify({
                error:
                  mode === "revoked"
                    ? "This dashboard link has expired or been withdrawn."
                    : "Temporary service failure",
              }),
            });
          const participants = narrow ? [rows[0]] : rows;
          return route.fulfill({
            contentType: "application/json",
            body: JSON.stringify({
              campaign: {
                name: "Example baseline",
                status: "open",
                closesAt: "2026-10-30T18:00:00Z",
              },
              counts: {
                roster: participants.length,
                removed: 0,
                invited: participants.length,
                notInvited: 0,
                notStarted: 0,
                inProgress: narrow ? 0 : 1,
                completed: 1,
              },
              completionPercent: narrow ? 100 : 50,
              participants,
              groups: {},
              scope: {
                role: "regional_lead",
                regionalLeaderEmail: "leader@example.invalid",
                regions: [],
                countries: [],
                entities: [],
              },
              generatedAt: new Date().toISOString(),
            }),
          });
        },
      );
      await page.goto(
        "https://dashboard.example.invalid/baseline/dashboard#" + token,
      );
      await page.addStyleTag({
        content:
          "*,*::before,*::after{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif}" +
          fs.readFileSync(root + "/app/baseline/start/style.css", "utf8") +
          fs.readFileSync(root + "/app/advisor/baseline/admin.css", "utf8"),
      });
      await page.addScriptTag({ content: built.outputFiles[0].text });
      const heading = page.getByRole("heading", {
        name: "Completion dashboard",
        exact: true,
      });
      await heading.waitFor();
      await page.getByText("Alice Example", { exact: true }).waitFor();
      await page.getByText("Bob Example", { exact: true }).waitFor();
      assert.equal(new URL(page.url()).hash, "");
      assert.equal(
        await page
          .getByRole("button", { name: "Edit participant data", exact: true })
          .count(),
        0,
      );
      assert.equal(
        await page.getByRole("link", { name: /Download/ }).count(),
        0,
      );
      mode = "transient";
      await page
        .getByRole("button", { name: "Refresh dashboard", exact: true })
        .click();
      await page.getByRole("alert").waitFor();
      assert.equal(
        await page.getByRole("alert").innerText(),
        "Temporary service failure",
      );
      assert.equal(
        await heading.count(),
        0,
        "A failed refresh does not keep showing stale respondent data",
      );
      mode = "ok";
      narrow = true;
      await page
        .getByRole("button", { name: "Refresh dashboard", exact: true })
        .click();
      await heading.waitFor();
      assert.equal(
        await page.getByRole("alert").count(),
        0,
        "A successful refresh clears the previous error",
      );
      assert.equal(
        await page.getByText("Bob Example", { exact: true }).count(),
        0,
        "A changed scope removes previous respondents",
      );
      mode = "revoked";
      await page
        .getByRole("button", { name: "Refresh dashboard", exact: true })
        .click();
      await page.getByRole("alert").waitFor();
      assert.equal(
        await page.getByRole("alert").innerText(),
        "This dashboard link has expired or been withdrawn.",
      );
      assert.equal(await heading.count(), 0);
      assert.equal(
        await page.evaluate(() =>
          sessionStorage.getItem("tb-baseline-dashboard"),
        ),
        null,
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      assert.equal(requests, 4);
      await page.close();
    }
  } finally {
    await browser.close();
  }
  console.log(
    "Shared dashboard desktop/mobile: private token handling, read-only controls, manual refresh, recovery, scope changes and revocation passed. Synthetic responses only.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
