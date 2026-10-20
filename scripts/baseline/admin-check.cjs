const { chromium } = require(
    process.env.BASELINE_PLAYWRIGHT_PATH || "playwright",
  ),
  esbuild = require("esbuild"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const root = path.resolve(__dirname, "../..");
const environment = process.env.BASELINE_ADMIN_ENV || "qa";
if (!["qa", "production"].includes(environment))
  throw Error("Unsupported admin test environment");
(async () => {
  const build = await esbuild.build({
    stdin: {
      contents:
        'import React from "react";import {createRoot} from "react-dom/client";import AdminPanel from "./app/advisor/baseline/panel";import ProjectList from "./app/advisor/baseline/projects";import AdvisorNav from "./app/components/advisor/AdvisorNav";import {PathnameContext} from "next/dist/shared/lib/hooks-client-context.shared-runtime";import {AppRouterContext} from "next/dist/shared/lib/app-router-context.shared-runtime";createRoot(document.getElementById("root")).render(<PathnameContext.Provider value={location.pathname}><AppRouterContext.Provider value={{push:(url)=>window.location.assign(url)}}><AdvisorNav/>{window.BASELINE_SCREEN === "list" ? <ProjectList/> : window.BASELINE_SCREEN === "create" ? <AdminPanel mode="create"/> : <AdminPanel initialCampaign="c1"/>}</AppRouterContext.Provider></PathnameContext.Provider>);',
      resolveDir: root,
      loader: "tsx",
    },
    bundle: true,
    write: false,
    format: "iife",
    jsx: "automatic",
    loader: { ".css": "empty" },
    define: {
      "process.env.NODE_ENV": '"production"',
      "process.env.NEXT_PUBLIC_APP_ENV": JSON.stringify(environment),
    },
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
      let person = {
        participant_id: "p1",
        email: "person@example.invalid",
        active: 1,
        invited: 0,
        status: "not_started",
        progress: 0,
        updated_at: "2026-10-13T12:00:00Z",
        invite_expires_at: "2026-10-31T23:59:59Z",
        revision: 0,
        profile: {
          name: "Synthetic person",
          email: "person@example.invalid",
          job_title: "Current title",
          country: "GB",
          region: "North",
          entity: "Business A",
          work_type: "people_operations",
          manages_people: "no",
          direct_reports: "0",
        },
        roster: {
          contracted_hours: "32",
          full_time_hours: "40",
          working_fraction: "0.8",
          team: "Team A",
          regional_leader_name: "Leader A",
          regional_leader_email: "leader.a@example.invalid",
        },
      };
      person.draft = {
        profile: person.profile,
        areas: [],
        allocation: {},
        version: "team-blue-baseline-v2",
      };
      let expandedRoster = false,
        launchReady = false;
      let shares = [],
        requests = [];
      const campaign = {
        campaign_id: "c1",
        name: "Synthetic campaign",
        version: "team-blue-baseline-v4",
        status: "open",
        closes_at: "2026-12-31T23:59:59Z",
        privacy_notice:
          "Synthetic data use statement for isolated QA testing only.",
        retention_days: 90,
        entities: [],
      };
      await page.route("https://admin.example.invalid/**", async (route) => {
        const req = route.request(),
          url = new URL(req.url());
        if (!url.pathname.includes("/api/"))
          return route.fulfill({
            contentType: "text/html",
            body: '<!doctype html><html><body><div id="root"></div></body></html>',
          });
        const op = url.pathname.split("/").pop(),
          body = req.method() === "POST" ? req.postDataJSON() : null;
        requests.push({ op, body });
        let data = {};
        if (op === "campaigns")
          data = {
            campaigns: [
              campaign,
              {
                ...campaign,
                campaign_id: "c2",
                name: "Closed example",
                status: "closed",
              },
              {
                ...campaign,
                campaign_id: "c3",
                name: "Draft example",
                status: "draft",
              },
            ],
          };
        if (op === "create")
          data = { campaignId: "11111111-1111-4111-8111-111111111111" };
        if (op === "configure" && body.closesAt)
          campaign.closes_at = body.closesAt;
        if (op === "campaign")
          data = {
            campaign,
            participants: expandedRoster
              ? [
                  person,
                  ...[2, 3].map((n) => ({
                    ...person,
                    participant_id: "p" + n,
                    email: "person" + n + "@example.invalid",
                    profile: {
                      ...person.profile,
                      name: "Synthetic person " + n,
                      email: "person" + n + "@example.invalid",
                    },
                  })),
                ]
              : [person],
          };
        if (op === "dashboard")
          data = {
            campaign: {
              name: campaign.name,
              status: "open",
              closesAt: campaign.closes_at,
            },
            counts: {
              roster: person.active,
              removed: person.active ? 0 : 1,
              invited: 0,
              notInvited: person.active,
              notStarted: 0,
              inProgress: 0,
              completed: 0,
            },
            completionPercent: 0,
            participants: [1, 2, 3].map((n) => ({
              participantId: "p" + n,
              name: "Synthetic respondent " + n,
              email: "respondent" + n + "@example.invalid",
              jobTitle: "Current title",
              country: "GB",
              region: "North",
              entity: "Business A",
              team: "Team A",
              regionalLeaderName: "Leader A",
              status: "completed",
              active: true,
              invited: true,
              progress: 8,
              updatedAt: new Date().toISOString(),
              submittedAt: null,
            })),
            groups: {
              region: [
                { label: "North", invited: 3, completed: 3, inProgress: 0 },
              ],
              country: [
                { label: "GB", invited: 3, completed: 3, inProgress: 0 },
              ],
              team: [
                { label: "Team A", invited: 3, completed: 3, inProgress: 0 },
              ],
            },
            generatedAt: new Date().toISOString(),
            smallGroupsHidden: false,
            scope: { regions: [], countries: [], entities: [] },
          };
        if (op === "readiness")
          data = {
            ready: launchReady,
            blockers: launchReady
              ? []
              : [
                  "The reviewed questionnaire still needs versioned saving.",
                  "Email is disabled in QA.",
                ],
            warnings: [],
            active: person.active,
            toInvite: person.active,
            questionnaireVersion: campaign.version,
          };
        if (op === "launch") {
          campaign.status = "open";
          data = { success: true };
        }
        if (op === "invite-batch")
          data = { sent: body.participantIds, failed: [] };
        if (op === "shares") data = { shares };
        if (op === "import-preview")
          data = {
            count: 1,
            duplicates: [],
            canImport: true,
            rows: [
              {
                name: "Added",
                email: "added@example.invalid",
                region: "North",
                entity: "Business A",
              },
            ],
          };
        if (op === "import") data = { imported: 1 };
        if (op === "participant") {
          if (body.action === "remove") person.active = 0;
          if (body.action === "reinstate") person.active = 1;
          person.revision++;
          data = { success: true };
        }
        if (op === "extend") {
          person.invite_expires_at = "2026-11-21T23:59:59Z";
          person.revision++;
          data = { success: true, expiresAt: person.invite_expires_at };
        }
        if (op === "share") {
          shares = [
            {
              share_id: "s1",
              label: body.label,
              expires_at: "2026-10-27T00:00:00Z",
              revoked_at: null,
            },
          ];
          data = {
            link:
              "https://admin.example.invalid/baseline/dashboard#" +
              "a".repeat(64),
          };
        }
        if (op === "share-revoke") {
          expandedRoster = true;
          shares[0].revoked_at = new Date().toISOString();
          data = { success: true };
        }
        return route.fulfill({
          contentType: "application/json",
          body: JSON.stringify(data),
        });
      });
      await page.goto("https://admin.example.invalid/advisor/baseline");
      await page.addStyleTag({
        content:
          "*, *::before, *::after {box-sizing:border-box} body {margin:0;font-family:ui-sans-serif,system-ui,sans-serif} h1,h2,h3,h4,p {margin:0} a {color:inherit;text-decoration:none}" +
          fs.readFileSync(root + "/app/globals.css", "utf8"),
      });
      await page.addStyleTag({
        content: fs.readFileSync(
          root + "/app/baseline/start/style.css",
          "utf8",
        ),
      });
      await page.addStyleTag({
        content: fs.readFileSync(
          root + "/app/advisor/baseline/admin.css",
          "utf8",
        ),
      });
      await page.addScriptTag({
        content: "window.process = {env: {NODE_ENV: 'production'}};",
      });
      page.on("pageerror", (error) =>
        console.error("Admin browser runtime: " + error.message),
      );
      await page.addScriptTag({ content: build.outputFiles[0].text });
      await page
        .getByRole("heading", { name: "Completion dashboard", exact: true })
        .waitFor();
      const nav = page.getByRole("navigation", {
        name: "Advisor",
        exact: true,
      });
      await nav
        .getByRole("link", { name: "Baseline projects", exact: true })
        .waitFor();
      await nav
        .getByRole("link", { name: "Create baseline project", exact: true })
        .waitFor();
      if (environment === "production") {
        assert.equal(
          await page.getByText(/QA workspace · Synthetic roster data/).count(),
          0,
        );
        assert.equal(
          await page
            .getByRole("button", {
              name: "Create synthetic QA verification code",
              exact: true,
            })
            .count(),
          0,
        );
        assert.equal(
          await page
            .getByRole("button", {
              name: "Open project for QA testing",
              exact: true,
            })
            .count(),
          0,
        );
      }
      assert.equal(
        await page
          .getByRole("link", {
            name: "Review the current questionnaire preview",
            exact: true,
          })
          .getAttribute("href"),
        "/advisor/baseline/depth-preview",
      );
      assert.equal(
        await page.getByLabel("Choose a campaign", { exact: true }).count(),
        0,
      );
      assert.equal(
        await page
          .getByRole("button", { name: "Create project", exact: true })
          .count(),
        0,
      );
      await page
        .getByRole("button", { name: "Edit participant data", exact: true })
        .first()
        .click();
      await page.getByRole("dialog").waitFor();
      assert.equal(
        await page.getByLabel("Work email *", { exact: true }).inputValue(),
        "person@example.invalid",
      );
      await page.keyboard.press("Escape");
      assert.ok(!(await page.getByRole("dialog").isVisible()));
      await page
        .getByRole("button", { name: "Settings and launch", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Launch readiness", exact: true })
        .waitFor();
      assert.equal(
        await page
          .getByLabel("Closing time (UTC)", { exact: true })
          .inputValue(),
        "23:59",
      );
      await page
        .getByLabel("Closing time (UTC)", { exact: true })
        .fill("18:00");
      await page
        .getByRole("button", { name: "Save settings", exact: true })
        .click();
      await page
        .getByText("Campaign settings saved.", { exact: true })
        .waitFor();
      assert.ok(
        requests.some(
          (r) =>
            r.op === "configure" &&
            r.body.closesAt === "2026-12-31T18:00:00.000Z",
        ),
      );
      assert.equal(
        await page
          .getByLabel("Closing time (UTC)", { exact: true })
          .inputValue(),
        "18:00",
      );
      assert.ok(
        await page
          .getByRole("button", { name: "Launch campaign", exact: true })
          .isDisabled(),
      );
      await page
        .getByRole("button", { name: "Respondents", exact: true })
        .click();
      await page
        .getByLabel("Choose a CSV (up to 200 people per file)", { exact: true })
        .setInputFiles({
          name: "roster.csv",
          mimeType: "text/csv",
          buffer: Buffer.from(
            "name,email,contracted_hours\nAdded,added@example.invalid,32",
          ),
        });
      await page
        .getByRole("button", { name: "Preview and validate CSV", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "CSV preview", exact: true })
        .waitFor();
      assert.equal(requests.filter((r) => r.op === "import").length, 0);
      await page
        .getByRole("button", { name: "Confirm import", exact: true })
        .click();
      await page
        .getByText("1 respondents imported. No invitations sent.", {
          exact: true,
        })
        .waitFor();
      assert.equal(requests.filter((r) => r.op === "import").length, 1);
      await page
        .getByRole("button", { name: "Add respondent", exact: true })
        .click();
      assert.ok(await page.getByRole("dialog").isVisible());
      assert.equal(
        await page.getByRole("dialog").locator("input,select").count(),
        24,
      );
      await page.getByLabel("Name *", { exact: true }).fill("Added");
      await page
        .getByLabel("Work email *", { exact: true })
        .fill("added@example.invalid");
      await page
        .getByRole("button", { name: "Save respondent", exact: true })
        .click();
      await page
        .getByText("Respondent added. No invitation sent.", { exact: true })
        .waitFor();
      assert.equal(requests.filter((r) => r.op === "import").length, 2);
      await page
        .getByLabel("Search participant list", { exact: true })
        .fill("not-found");
      assert.equal(
        await page
          .getByRole("button", { name: "Edit participant data", exact: true })
          .count(),
        0,
      );
      await page
        .getByLabel("Search participant list", { exact: true })
        .fill("person@example.invalid");
      await page
        .getByRole("button", { name: "Extend invitation", exact: true })
        .click();
      await page
        .getByText(
          "Invitation extended. The same private link continues to work.",
          { exact: true },
        )
        .waitFor();
      assert.ok(requests.some((r) => r.op === "extend" && r.body.days === 21));
      await page
        .getByLabel("Search participant list", { exact: true })
        .fill("");
      await page
        .getByRole("button", { name: "Edit participant data", exact: true })
        .click();
      const editsBefore = requests.filter(
        (r) => r.op === "participant" && r.body.action === "edit",
      ).length;
      await page
        .getByLabel("Working fraction (0 to 1)", { exact: true })
        .fill("0.5");
      await page
        .getByRole("button", { name: "Save respondent", exact: true })
        .click();
      const validationAlert = page.getByRole("dialog").getByRole("alert");
      await validationAlert.waitFor();
      assert.ok(
        (await validationAlert.textContent()).includes(
          "20 hours divided by 40 hours gives 0.5",
        ),
      );
      assert.ok(
        await validationAlert.evaluate((el) => document.activeElement === el),
      );
      const alertBox = await validationAlert.boundingBox(),
        dialogBox = await page.getByRole("dialog").boundingBox();
      assert.ok(
        alertBox.y >= dialogBox.y &&
          alertBox.y + alertBox.height <= dialogBox.y + dialogBox.height,
      );
      assert.equal(
        requests.filter(
          (r) => r.op === "participant" && r.body.action === "edit",
        ).length,
        editsBefore,
      );
      assert.equal(
        await page
          .getByLabel("Working fraction (0 to 1)", { exact: true })
          .inputValue(),
        "0.5",
      );
      assert.equal(
        await page.getByRole("dialog").locator('[aria-invalid="true"]').count(),
        3,
      );
      await page
        .getByLabel("Contracted hours per week", { exact: true })
        .fill("20");
      await page
        .getByRole("button", { name: "Save respondent", exact: true })
        .click();
      await page
        .getByText(
          "Respondent details saved. If the email changed, issue a fresh invitation.",
          { exact: true },
        )
        .waitFor();
      assert.ok(
        requests.some(
          (r) =>
            r.op === "participant" &&
            r.body.action === "edit" &&
            r.body.csv.includes("20"),
        ),
      );
      page.on("dialog", (d) => d.accept());
      await page
        .getByRole("button", { name: "Withdraw respondent", exact: true })
        .click();
      await page
        .getByText("Respondent removed. Access withdrawn; answers retained.", {
          exact: true,
        })
        .waitFor();
      await page
        .getByRole("button", {
          name: "Withdrawn participants (1)",
          exact: true,
        })
        .click();
      await page
        .getByRole("button", { name: "Reinstate participant", exact: true })
        .click();
      await page
        .getByText("Respondent reinstated. Generate a fresh invitation.", {
          exact: true,
        })
        .waitFor();
      await page
        .getByRole("button", { name: "All participants (1)", exact: true })
        .click();
      await page.getByRole("button", { name: "Sharing", exact: true }).click();
      await page
        .getByLabel("Viewer / audience label", { exact: true })
        .fill("North leader");
      await page
        .getByLabel("Regional leader from CSV", { exact: true })
        .selectOption("leader.a@example.invalid");
      await page
        .getByRole("button", { name: "Create dashboard link", exact: true })
        .click();
      await page
        .getByLabel("Private dashboard link", { exact: true })
        .waitFor();
      assert.ok(
        (
          await page
            .getByLabel("Private dashboard link", { exact: true })
            .inputValue()
        ).includes("/baseline/dashboard#"),
      );
      assert.deepEqual(
        requests.find((r) => r.op === "share").body.scope.regionalLeaderEmail,
        "leader.a@example.invalid",
      );
      await page
        .getByRole("button", { name: "Revoke dashboard link", exact: true })
        .click();
      await page
        .getByText("Dashboard link revoked.", { exact: true })
        .waitFor();
      await page
        .getByRole("button", { name: "Respondents", exact: true })
        .click();
      await page.locator(".tb-management-card").nth(2).waitFor();
      const positions = await page
        .locator(".tb-management-card")
        .evaluateAll((nodes) =>
          nodes.map((n) => {
            const r = n.getBoundingClientRect();
            return { x: r.x, y: r.y, width: r.width };
          }),
        );
      await page.getByRole("button", { name: "Overview", exact: true }).click();
      if (process.env.BASELINE_SCREENSHOT_DIR) {
        fs.mkdirSync(process.env.BASELINE_SCREENSHOT_DIR, { recursive: true });
        await page.screenshot({
          path: path.join(
            process.env.BASELINE_SCREENSHOT_DIR,
            mobile ? "admin-mobile.png" : "admin-desktop.png",
          ),
          fullPage: true,
        });
      }
      const respondentPositions = await page
        .locator(".tb-respondent-card")
        .evaluateAll((nodes) =>
          nodes.map((n) => {
            const r = n.getBoundingClientRect();
            return { x: r.x, y: r.y };
          }),
        );
      assert.ok(
        await page
          .getByRole("heading", { name: "Completion dashboard", exact: true })
          .isVisible(),
      );
      assert.equal(
        await page
          .getByRole("heading", { name: "Project settings", exact: true })
          .count(),
        0,
      );
      await page.getByRole("button", { name: "Exports", exact: true }).click();
      assert.ok(
        await page
          .getByRole("link", { name: "Raw respondent CSV", exact: true })
          .isVisible(),
      );
      assert.ok(
        !(await page
          .getByRole("heading", { name: "Completion dashboard", exact: true })
          .isVisible()),
      );
      const workbookLink = page.getByRole("link", {
        name: "Download Excel analysis workbook",
        exact: true,
      });
      assert.ok(await workbookLink.isVisible());
      assert.match(await workbookLink.getAttribute("href"), /format=xlsx/);
      if (mobile) {
        assert.equal(positions[0].x, positions[1].x);
        assert.ok(positions[1].y > positions[0].y);
        assert.ok(respondentPositions[1].y > respondentPositions[0].y);
      } else {
        assert.equal(positions[0].y, positions[1].y);
        assert.ok(positions[1].x > positions[0].x);
        assert.equal(respondentPositions[0].y, respondentPositions[1].y);
        assert.ok(respondentPositions[1].x > respondentPositions[0].x);
      }
      assert.equal(
        requests.filter((r) => r.op === "launch" || r.op === "invite-batch")
          .length,
        0,
      );
      if (environment === "production") {
        launchReady = true;
        await page
          .getByRole("button", { name: "Settings and launch", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Save settings", exact: true })
          .click();
        await page
          .getByText("Campaign settings saved.", { exact: true })
          .waitFor();
        await page
          .getByLabel("Confirm campaign name to launch", { exact: true })
          .fill(campaign.name);
        const launch = page.getByRole("button", {
          name: "Launch campaign",
          exact: true,
        });
        await launch.click();
        await page
          .getByText(
            "Campaign launched. Review the roster and send invitations in batches.",
            { exact: true },
          )
          .waitFor();
        assert.equal(requests.filter((r) => r.op === "launch").length, 1);
        assert.equal(
          requests.filter((r) => r.op === "invite-batch").length,
          0,
          "Launching does not send invitations",
        );
        await page
          .getByRole("button", { name: "Respondents", exact: true })
          .click();
        await page
          .getByLabel("Select respondent: " + person.email, { exact: true })
          .check();
        await page
          .getByRole("button", {
            name: "Send selected invitations / reminders (1/20)",
            exact: true,
          })
          .click();
        await page
          .getByText(
            "1 emails sent. 0 failed; only failed rows remain selected.",
            { exact: true },
          )
          .waitFor();
        assert.equal(requests.filter((r) => r.op === "invite-batch").length, 1);
      }
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      // Exercise the separate directory and creation entry points with the same API boundaries.
      for (const screen of ["list", "create"]) {
        await page.goto(
          "https://admin.example.invalid/advisor/baseline/" + screen,
        );
        await page.addStyleTag({
          content:
            "*, *::before, *::after {box-sizing:border-box} body {margin:0;font-family:ui-sans-serif,system-ui,sans-serif}" +
            fs.readFileSync(root + "/app/globals.css", "utf8") +
            fs.readFileSync(root + "/app/baseline/start/style.css", "utf8") +
            fs.readFileSync(root + "/app/advisor/baseline/admin.css", "utf8"),
        });
        await page.addScriptTag({
          content:
            "window.process = {env:{NODE_ENV:'production'}};window.BASELINE_SCREEN=" +
            JSON.stringify(screen),
        });
        await page.addScriptTag({ content: build.outputFiles[0].text });
        if (screen === "list") {
          await page
            .getByRole("heading", { name: "Your projects", exact: true })
            .waitFor();
          await page
            .getByRole("link", { name: "Open project", exact: true })
            .nth(2)
            .waitFor();
          await page
            .getByLabel("Project status", { exact: true })
            .selectOption("closed");
          assert.equal(
            await page
              .getByRole("link", { name: "Open project", exact: true })
              .count(),
            1,
          );
          assert.ok(
            await page
              .getByRole("heading", { name: "Closed example", exact: true })
              .isVisible(),
          );
          await page
            .getByLabel("Search projects", { exact: true })
            .fill("no match");
          await page
            .getByText("No projects match your search and status filter.", {
              exact: true,
            })
            .waitFor();
          await page.getByLabel("Search projects", { exact: true }).fill("");
          await page
            .getByLabel("Project status", { exact: true })
            .selectOption("open");
          assert.equal(
            await page
              .getByRole("link", { name: "Open project", exact: true })
              .getAttribute("href"),
            "/advisor/baseline/project/c1",
          );
        } else {
          await page
            .getByRole("heading", { name: "New project", exact: true })
            .waitFor();
          assert.equal(
            await page
              .getByRole("heading", { name: "Manage respondents", exact: true })
              .count(),
            0,
          );
          await page
            .getByLabel("Campaign name", { exact: true })
            .fill("New synthetic project");
          await page
            .getByLabel("Closing date (UTC)", { exact: true })
            .fill("2026-12-31");
          assert.equal(
            await page
              .getByLabel("Closing time (UTC)", { exact: true })
              .inputValue(),
            "18:00",
          );
          await page
            .getByRole("button", { name: "Create project", exact: true })
            .click();
          await page.waitForURL(
            "**/advisor/baseline/project/11111111-1111-4111-8111-111111111111",
          );
          assert.ok(
            requests.some(
              (r) =>
                r.op === "create" &&
                r.body.name === "New synthetic project" &&
                r.body.closesAt === "2026-12-31T18:00:00.000Z",
            ),
          );
        }
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
  console.log(
    "Baseline admin " +
      environment +
      " desktop/mobile: navigation, directory/create, CSV preview/import, respondent edits, launch controls, scoped shares and exports passed. Mocked data and emails only.",
  );
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
