const { chromium } = require(
    process.env.BASELINE_PLAYWRIGHT_PATH || "playwright",
  ),
  esbuild = require("esbuild"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const root = path.resolve(__dirname, "../..");
(async () => {
  const build = await esbuild.build({
    stdin: {
      contents:
        'import React from "react";import {createRoot} from "react-dom/client";import AdminPanel from "./app/advisor/baseline/panel";createRoot(document.getElementById("root")).render(<AdminPanel/>);',
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
      "process.env.NEXT_PUBLIC_APP_ENV": '"qa"',
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
      let expandedRoster = false;
      let shares = [],
        requests = [];
      const campaign = {
        campaign_id: "c1",
        name: "Synthetic campaign",
        version: "team-blue-baseline-v2",
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
        if (op === "campaigns") data = { campaigns: [campaign] };
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
            ready: false,
            blockers: [
              "The reviewed questionnaire still needs versioned saving.",
              "Email is disabled in QA.",
            ],
            warnings: [],
            active: person.active,
            toInvite: person.active,
            questionnaireVersion: campaign.version,
          };
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
        .getByRole("heading", { name: "Campaigns", exact: true })
        .waitFor();
      await page
        .getByLabel("Choose a campaign", { exact: true })
        .selectOption("c1");
      await page
        .getByRole("heading", { name: "Launch readiness", exact: true })
        .waitFor();
      assert.ok(
        await page
          .getByRole("button", { name: "Launch campaign", exact: true })
          .isDisabled(),
      );
      await page
        .getByRole("heading", { name: "Completion dashboard", exact: true })
        .waitFor();
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
          .getByRole("button", { name: "Edit respondent", exact: true })
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
        .getByRole("button", { name: "Edit respondent", exact: true })
        .click();
      await page
        .getByLabel("Contracted hours per week", { exact: true })
        .fill("30");
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
            r.body.csv.includes("30"),
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
        .getByRole("button", { name: "Reinstate respondent", exact: true })
        .click();
      await page
        .getByText("Respondent reinstated. Generate a fresh invitation.", {
          exact: true,
        })
        .waitFor();
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
      await page.locator(".tb-management-card").nth(2).waitFor();
      const positions = await page
        .locator(".tb-management-card")
        .evaluateAll((nodes) =>
          nodes.map((n) => {
            const r = n.getBoundingClientRect();
            return { x: r.x, y: r.y, width: r.width };
          }),
        );
      const respondentPositions = await page
        .locator(".tb-respondent-card")
        .evaluateAll((nodes) =>
          nodes.map((n) => {
            const r = n.getBoundingClientRect();
            return { x: r.x, y: r.y };
          }),
        );
      const dashboardBox = await page.locator(".tb-dashboard").boundingBox();
      const campaignsBox = await page
        .getByRole("heading", { name: "Campaigns", exact: true })
        .boundingBox();
      assert.ok(dashboardBox.y < campaignsBox.y);
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
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await page.close();
    }
  } finally {
    await browser.close();
  }
  console.log(
    "Baseline admin desktop/mobile: CSV preview/confirmation, individual add/edit/remove/reinstate, launch block and scoped share creation/revocation passed. Mocked data only.",
  );
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
