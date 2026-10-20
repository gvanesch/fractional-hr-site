// Synthetic v5 browser contract. No hosted database writes or emails.
const { chromium } = require(
    process.env.BASELINE_PLAYWRIGHT_PATH || "playwright",
  ),
  esbuild = require("esbuild"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const root = path.resolve(__dirname, "../..");
(async () => {
  const built = await esbuild.build({
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
  async function load(file) {
    const b = await esbuild.build({
      entryPoints: [root + "/" + file],
      bundle: true,
      write: false,
      platform: "node",
      format: "cjs",
    });
    const m = { exports: {} };
    new Function("module", "exports", b.outputFiles[0].text)(m, m.exports);
    return m.exports;
  }
  const m = await load("lib/baseline/collection.ts"),
    model = await load("lib/baseline/depth.ts");
  const css = [
    "app/baseline/start/style.css",
    "app/advisor/baseline/prototype/prototype.css",
  ]
    .map((f) => fs.readFileSync(root + "/" + f, "utf8"))
    .join("\n");
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
      let stored = m.initialCollection(m.DEPTH_COLLECTION_VERSION),
        revision = 0,
        progress = 0,
        status = "in_progress",
        submits = 0;
      stored.started = true;
      stored.broad.selected = ["lifecycle", "office"];
      stored.broad.time = { lifecycle: 50, office: 50 };
      Object.assign(stored.rich, {
        routes: ["work_email"],
        routeTime: { work_email: 100 },
        recording: "none",
        duplicates: "rarely",
        sameRoutes: "same",
        scope: "one",
        systems: ["excel"],
        workNature: { lifecycle: "routine" },
      });
      require("./depth-fixture.cjs").fillDepth(stored);
      stored.depth.resumeStep = "coverage";
      stored.depth.countries = ["FI"];
      stored.depth.countryTime = { FI: 100 };
      stored.depth.otherCountries = "";
      assert.deepEqual(
        m.collectionIssues(stored, { isPeopleManager: false }),
        [],
      );
      await page.route("https://depth.example.invalid/**", async (route) => {
        const req = route.request(),
          url = new URL(req.url());
        if (!url.pathname.includes("/api/"))
          return route.fulfill({
            contentType: "text/html",
            body:
              "<!doctype html><html><head><style>*,*::before,*::after{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif}" +
              css +
              '</style></head><body><div id="root"></div><script>' +
              built.outputFiles[0].text +
              "</script></body></html>",
          });
        const action = url.pathname.split("/").pop();
        let result = {};
        if (action === "response")
          result = {
            draft: stored,
            revision,
            progress,
            status,
            updatedAt: new Date().toISOString(),
            campaign: {
              name: "Synthetic detailed baseline",
              privacy: "Synthetic QA only.",
              closed: false,
              copyPreview: true,
              version: m.DEPTH_COLLECTION_VERSION,
              manager: { isPeopleManager: false },
            },
          };
        else if (["save", "submit"].includes(action)) {
          const body = req.postDataJSON();
          assert.equal(body.revision, revision);
          assert.ok(
            body.progress >= 0 &&
              body.progress <= (action === "submit" ? 8 : 7),
          );
          stored = m.parseCollection(body.draft, { isPeopleManager: false });
          progress = body.progress;
          if (action === "submit") {
            assert.deepEqual(
              m.collectionIssues(stored, { isPeopleManager: false }),
              [],
            );
            submits++;
            status = "completed";
          }
          revision++;
          result = {
            revision,
            status,
            copyStatus: action === "submit" ? "preview" : null,
          };
        } else throw Error("Unexpected detailed UI request " + action);
        return route.fulfill({
          contentType: "application/json",
          body: JSON.stringify(result),
        });
      });
      const check = (label) =>
          page.getByRole("checkbox", { name: label, exact: true }).check(),
        fill = (label, value) =>
          page.getByLabel(label, { exact: true }).fill(value),
        button = (name) => page.getByRole("button", { name, exact: true });
      await page.goto("https://depth.example.invalid/baseline/start");
      await page
        .getByRole("heading", {
          name: "Countries and businesses supported",
          exact: true,
        })
        .waitFor();
      await check("Countries you regularly support: Other country / countries");
      assert.equal(
        await page
          .getByLabel(
            "Is the number of employees you support based on records or an estimate?",
            { exact: true },
          )
          .count(),
        0,
      );
      assert.equal(
        await page
          .getByLabel(
            "Approximately how many employees do you regularly support?",
            { exact: true },
          )
          .inputValue(),
        "200",
      );
      await fill("Other countries you support", "Norway");
      await fill("Country time: Norway (%)", "20");
      await fill("Country time: Finland (%)", "80");
      await check("Countries you regularly support: Sweden");
      assert.equal(
        await page
          .getByLabel("Country time: Finland (%)", { exact: true })
          .inputValue(),
        "80",
      );
      assert.equal(
        await page
          .getByLabel("Country time: Sweden (%)", { exact: true })
          .inputValue(),
        "",
      );
      await fill("Country time: Sweden (%)", "20");
      await fill("Country time: Finland (%)", "60");
      await fill("Other countries you support", "Norway\nCanada");
      assert.equal(
        await page
          .getByLabel("Country time: Norway (%)", { exact: true })
          .inputValue(),
        "20",
      );
      const saved = page.waitForResponse((r) => r.url().endsWith("/save"));
      await fill("Country time: Canada (%)", "0");
      await saved;
      assert.equal(stored.depth.countryTime["custom:canada"], 0);
      if (process.env.BASELINE_SCREENSHOT_DIR) {
        fs.mkdirSync(process.env.BASELINE_SCREENSHOT_DIR, { recursive: true });
        await page.screenshot({
          path: path.join(
            process.env.BASELINE_SCREENSHOT_DIR,
            mobile ? "depth-coverage-mobile.png" : "depth-coverage-desktop.png",
          ),
          fullPage: true,
        });
      }
      await button("Continue").click();
      await page
        .getByRole("heading", {
          name: "Work activities and delivery",
          exact: true,
        })
        .waitFor();
      const office = "Reception, facilities and office support";
      await page.locator("summary").filter({ hasText: office }).click();
      assert.equal(
        await page
          .getByText(
            /Basis for your personal work volume|Average active minutes per item|Basis for rework|delivered from another country|physical presence\./,
          )
          .count(),
        0,
      );
      const ownership = page.getByLabel(office + ": Your main accountability", {
        exact: true,
      });
      const owner = page.getByLabel(
        office + ": Who is accountable for the whole process / service?",
        { exact: true },
      );
      await ownership.selectOption("accountable");
      assert.equal(await owner.count(), 0);
      await ownership.selectOption("steps");
      assert.equal(await owner.inputValue(), "Regional People Operations lead");
      await check(office + ": Work you actually do: Fleet or company cars");
      assert.equal(
        await page
          .getByLabel(
            office + " activity time: Reception, visitors and deliveries (%)",
            { exact: true },
          )
          .inputValue(),
        "60",
      );
      assert.equal(
        await page
          .getByLabel(office + " activity time: Fleet or company cars (%)", {
            exact: true,
          })
          .inputValue(),
        "",
      );
      await fill(office + " activity time: Fleet or company cars (%)", "10");
      await fill(
        office + " activity time: Facilities, repairs and building access (%)",
        "30",
      );
      const save2 = page.waitForResponse((r) => r.url().endsWith("/save"));
      await check(
        office + ": Local delivery requirements: No specific local requirement",
      );
      await save2;
      assert.equal(stored.depth.resumeStep, "work_detail");
      await page.reload();
      await page
        .getByRole("heading", {
          name: "Work activities and delivery",
          exact: true,
        })
        .waitFor();
      await page.locator("summary").filter({ hasText: office }).click();
      assert.equal(
        await page
          .getByLabel(office + " activity time: Fleet or company cars (%)", {
            exact: true,
          })
          .inputValue(),
        "10",
      );
      assert.equal(stored.depth.countryTime["custom:norway"], 20);
      await button("Continue").click();
      await button("Continue").click();
      await button("Continue").click();
      await page
        .getByRole("heading", {
          name: "Responsibility, demand and capacity",
          exact: true,
        })
        .waitFor();
      await fill("Uncommitted hours in a typical week", "40");
      await button("Review answers").click();
      assert.equal(
        await page
          .getByLabel("Uncommitted hours in a typical week", { exact: true })
          .getAttribute("aria-invalid"),
        "true",
      );
      await fill("Uncommitted hours in a typical week", "1");
      await page
        .getByLabel(
          "Do you have agreed service targets or measured outcomes?",
          { exact: true },
        )
        .selectOption("no");
      await page
        .getByLabel(
          "Do you know a recurring external provider cost for work you support?",
          { exact: true },
        )
        .selectOption("unknown");
      await page
        .getByLabel(
          "Are there predictable peaks or major event-driven demands?",
          { exact: true },
        )
        .selectOption("none");
      await button("Review answers").click();
      await page
        .getByRole("heading", { name: "Review", exact: true })
        .waitFor();
      assert.equal(
        model
          .depthEvidence(stored.depth, stored.broad.selected)
          .work.find((w) => w.area === "office").localNote,
        "",
      );
      const reviewedOffice = page
        .getByRole("heading", { name: office, exact: true })
        .locator("..");
      assert.ok(
        !(await reviewedOffice.textContent()).includes("Helsinki office cover"),
      );
      assert.equal(
        await page
          .getByText("Annual review cycle adds two weeks of checks.", {
            exact: true,
          })
          .count(),
        0,
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await button("Submit answers").click();
      await page
        .getByRole("heading", {
          name: "Thank you. Your answers have been submitted.",
          exact: true,
        })
        .waitFor();
      assert.equal(submits, 1);
      const evidence = m.collectionEvidence(stored, { isPeopleManager: false });
      assert.equal(evidence.depth.metrics.actual, "");
      assert.equal(evidence.depth.costs.amount, null);
      assert.equal(evidence.depth.peaks.extraWeeklyHours, null);
      assert.deepEqual(evidence.depth.peaks.months, []);
      assert.equal(
        evidence.depth.countries.find((c) => c.code === "custom:canada")
          .shareOfWorkingTime,
        0,
      );
      // A separate resumed state exercises the bespoke Other panel and advice handoffs.
      stored = m.initialCollection(m.DEPTH_COLLECTION_VERSION);
      stored.started = true;
      stored.broad.selected = ["advice_cases", "other"];
      stored.broad.time = { advice_cases: 50, other: 50 };
      require("./depth-fixture.cjs").fillDepth(stored);
      stored.depth.resumeStep = "work_detail";
      status = "in_progress";
      await page.reload();
      await page
        .getByRole("heading", {
          name: "Work activities and delivery",
          exact: true,
        })
        .waitFor();
      const advice = page
        .locator("details")
        .filter({
          has: page.locator("summary").filter({ hasText: "Manager advice" }),
        });
      await advice.locator("summary").click();
      for (const irrelevant of [
        /Work or information received from: Finance/,
        /Work or information received from: IT/,
        /Work or information received from: External provider/,
        /Work or approval passed to: Finance/,
        /Work or approval passed to: IT/,
        /Work or approval passed to: External provider/,
      ])
        assert.equal(
          await advice.getByRole("checkbox", { name: irrelevant }).count(),
          0,
        );
      const otherPanel = page
        .locator("details")
        .filter({
          has: page.locator("summary").filter({ hasText: /^Other work$/ }),
        });
      await otherPanel.locator("summary").click();
      assert.equal(await otherPanel.locator("textarea").count(), 2);
      assert.equal(
        await otherPanel
          .locator('input[type="number"],select,input[type="checkbox"]')
          .count(),
        0,
      );
      assert.ok(
        await otherPanel
          .getByLabel(/Describe the other work you do/)
          .inputValue(),
      );
      await page.close();
    }
  } finally {
    await browser.close();
  }
  console.log(
    "Detailed v5 desktop/mobile: late countries/custom countries/tasks, preserved shares, missing/invalid values, exact-step resume, conditional evidence, final submission and no overflow passed. Synthetic only; no email.",
  );
})().catch((e) => {
  console.error(e.stack);
  process.exitCode = 1;
});
