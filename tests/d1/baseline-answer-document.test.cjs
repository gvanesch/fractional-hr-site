const { test } = require("node:test"),
  assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const {
  load,
  documentFixture,
} = require("../../scripts/baseline/answer-document-fixture.cjs");
test("Employee Word copy includes every visible questionnaire section and human-readable answers", async () => {
  const f = await documentFixture(),
    { answerDocumentSections } = await load("lib/baseline/answer-document.ts");
  const sections = answerDocumentSections(f.evidence, f.details),
    text = JSON.stringify(sections);
  for (const heading of [
    "About you",
    "Your work areas and time",
    "Countries and businesses supported",
    "Employee engagement and experience",
    "People planning, performance and development",
    "How people contact you or your team",
    "Payroll responsibilities",
    "Managing your team",
    "Your technology work",
    "Systems and final comments",
    "Your decisions and workload",
  ])
    assert.ok(
      sections.some((s) => s.title === heading),
      heading,
    );
  for (const value of [
    "Jordan Example",
    "People Operations Specialist",
    "United Kingdom",
    "21 October 2026",
    "12:30",
    "Work email",
    "Monthly",
    "HiBob",
    "16% of total working time",
    "60% of technology time",
    "50% of management time",
    "Two employee events",
    "three businesses",
    "one shared request form",
  ])
    assert.ok(text.includes(value), value);
  assert.doesNotMatch(
    text,
    /pay_benefits|work_email|formRevision|baseline-v5|custom:/,
  );
  assert.doesNotMatch(
    text,
    /Contracted weekly hours|Service measures|Provider costs|Delivery from another country/,
  );
});
test("Word attachment is valid OOXML with literal Unicode answers, paragraphs and no active or embedded content", async () => {
  const f = await documentFixture(),
    { answerCopyDocx } = await load("lib/baseline/answer-document.ts");
  f.evidence.missing =
    'Åsa & café <test>\nSecond line\u0001 <w:hyperlink> =HYPERLINK("unsafe")';
  const doc = answerCopyDocx(f.evidence, f.details);
  const result = execFileSync(
    "python3",
    [
      "-c",
      `import sys,io,zipfile,xml.etree.ElementTree as E
z=zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read()));assert z.testzip() is None
for name in z.namelist(): E.fromstring(z.read(name))
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
root=E.fromstring(z.read('word/document.xml'));text=''.join(root.itertext())
assert 'Åsa & café <test>' in text and 'Second line' in text
assert '<w:hyperlink>' in text and '=HYPERLINK("unsafe")' in text
assert root.find('.//w:br',ns) is not None
assert root.find('.//w:hyperlink',ns) is None
assert not any('vba' in n.lower() or 'embedding' in n.lower() for n in z.namelist())
assert b'TargetMode="External"' not in z.read('word/_rels/document.xml.rels')
assert root.find('.//w:pStyle[@w:val="Title"]',ns) is not None
print('Word package integrity and literal content passed')`,
    ],
    { input: Buffer.from(doc) },
  ).toString();
  assert.match(result, /passed/);
});
test("Word copy excludes removed and deselected answers while preserving historic collection versions", async () => {
  const f = await documentFixture(),
    c = await load("lib/baseline/collection.ts"),
    { answerDocumentSections } = await load("lib/baseline/answer-document.ts");
  f.draft.depth.work.experience.reworkPercent = 87;
  f.draft.depth.work.systems_data.localNote = "HIDDEN REMOVED LOCALITY";
  f.draft.depth.metricActual = "HIDDEN REMOVED METRIC";
  f.draft.depth.work.recruitment = {
    ...f.draft.depth.work.lifecycle,
    taskNote: "HIDDEN DESELECTED AREA",
  };
  const evidence = c.collectionEvidence(f.draft, f.manager);
  const text = JSON.stringify(answerDocumentSections(evidence, f.details));
  assert.doesNotMatch(text, /HIDDEN REMOVED|HIDDEN DESELECTED|87%/);
  const rows =
    await require("../../scripts/baseline/production-fixtures.cjs").fixtures();
  for (const version of [c.COLLECTION_VERSION, c.FROZEN_COLLECTION_VERSION]) {
    const d = structuredClone(rows[0].draft);
    d.version = version;
    const old = JSON.stringify(
      answerDocumentSections(c.collectionEvidence(d, rows[0].manager)),
    );
    assert.match(old, /Payroll responsibilities/);
    assert.match(old, /Your work areas and time/);
    assert.doesNotMatch(old, /Countries and businesses supported/);
  }
});
test("Historic v5 hand-off answers keep their original labels rather than current filtered options", async () => {
  const f = await documentFixture(), c = await load("lib/baseline/collection.ts");
  const {answerDocumentSections} = await load("lib/baseline/answer-document.ts");
  delete f.draft.depth.formRevision;
  f.draft.broad.selected = ["advice_cases"];
  f.draft.depth.work.advice_cases = {...f.draft.depth.work.lifecycle,tasks:["advice"],taskTime:{advice:100},receives:["finance"],passes:["it"]};
  const text = JSON.stringify(answerDocumentSections(c.collectionEvidence(f.draft,f.manager)));
  assert.match(text,/Finance \/ Payroll/); assert.match(text,/IT \/ People Technology/);
});
