// Synthetic document QA only. No network calls, database writes or email.
const path = require("node:path"),
  esbuild = require("esbuild");
async function load(file) {
  const b = await esbuild.build({
    entryPoints: [path.resolve(__dirname, "../..", file)],
    bundle: true,
    platform: "node",
    format: "cjs",
    write: false,
  });
  const m = { exports: {} };
  new Function("module", "exports", b.outputFiles[0].text)(m, m.exports);
  return m.exports;
}
async function documentFixture() {
  const c = await load("lib/baseline/collection.ts"),
    m = await load("lib/baseline/depth.ts");
  const rows = await require("./production-fixtures.cjs").fixtures();
  const row = structuredClone(rows[0]);
  row.draft.version = c.DEPTH_COLLECTION_VERSION;
  row.draft.broad.selected.push(
    "systems_data",
    "experience",
    "planning_development",
  );
  row.draft.broad.time = Object.fromEntries(
    row.draft.broad.selected.map((area, i) => [area, i === 5 ? 20 : 16]),
  );
  row.draft.rich.workNature.planning_development = "mixed";
  row.draft.technology = structuredClone(rows[2].draft.technology);
  row.draft.technology.activityTime = { support: 60, reporting: 40 };
  row.draft.technology.note =
    "HiBob reporting and user support across the Group.";
  row.draft.rich.manualNote =
    "Use one shared request form to reduce repeated data entry.";
  row.draft.rich.strengths = "Colleagues share knowledge and arrange cover.";
  row.draft.rich.missing =
    "Monthly work also includes a quarterly planning discussion.";
  row.draft.broad.occasional =
    "Annual performance reviews and occasional new-system launches.";
  require("./depth-fixture.cjs").fillDepth(row.draft);
  row.draft.depth.formRevision = m.CURRENT_DEPTH_FORM_REVISION;
  for (const [area, w] of Object.entries(row.draft.depth.work)) {
    w.contributions = ["steps", "coordinate"];
    w.scopeNote =
      area === "experience"
        ? "Two employee events each year and a quarterly listening survey."
        : area === "planning_development"
          ? "Coordinate annual performance reviews for three businesses."
          : area === "systems_data"
            ? "Group HiBob reporting and a new integration project."
            : "";
    w.handoffNote =
      area === "experience"
        ? "Work with Communications on the monthly employee newsletter."
        : "The People team shares the work and agrees priorities.";
  }
  row.profile.name = "Jordan Example";
  row.profile.job_title = "People Operations Specialist";
  row.draft.answerCopy = true;
  const parsed = c.parseCollection(row.draft, row.manager);
  const issues = c.collectionIssues(parsed, row.manager);
  if (issues.length)
    throw Error("Document fixture is incomplete: " + issues.join(", "));
  return {
    ...row,
    draft: parsed,
    evidence: c.collectionEvidence(parsed, row.manager),
    details: { profile: row.profile, submittedAt: "2026-10-21T12:30:00Z" },
  };
}
module.exports = { load, documentFixture };
if (require.main === module)
  documentFixture()
    .then(async (f) => {
      const out = process.argv[2];
      if (!out) throw Error("Provide a local QA output path.");
      const { answerCopyDocx } = await load("lib/baseline/answer-document.ts");
      require("node:fs").writeFileSync(
        out,
        answerCopyDocx(f.evidence, f.details),
      );
      console.log("Synthetic Word answer copy created for visual QA.");
    })
    .catch((e) => {
      console.error(e.message);
      process.exitCode = 1;
    });
