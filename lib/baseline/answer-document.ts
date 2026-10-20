import type { collectionEvidence } from "./collection";
import { zipTextFiles } from "./analysis-xlsx";
import { areaQuestions } from "./work-area-questions";
import {
  AUTONOMY,
  CAPACITY,
  LOCAL_REQUIREMENTS,
  OWNERSHIP,
  NUMBER_BASIS,
  MONTHS,
  PROJECT_COUNTRIES,
  handoffOptions,
  CURRENT_DEPTH_FORM_REVISION,
} from "./depth";
import {
  CONTACT_ROUTES,
  SYSTEMS,
  WORK_NATURE,
  LOCAL_NEEDS,
  PAYROLL_STAGES,
  PAYROLL_PARTIES,
  MY_PAYROLL_PART,
} from "./prototype-enrichment";
import {
  TECHNOLOGY_ACTIVITIES,
  TECHNOLOGY_TIME,
  TECHNOLOGY_ROLES,
  TECHNOLOGY_PARTNERS,
  TECHNOLOGY_SYSTEMS,
} from "./technology-prototype";
import { MANAGEMENT_ACTIVITIES } from "./management-prototype";

type Obj = Record<string, unknown>;
const object = (v: unknown): Obj =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {};
const array = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const string = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const label = (options: string[][], code: unknown) =>
  options.find((o) => o[0] === code)?.[1] ?? "Not specified";
const labels = (options: string[][], codes: unknown) =>
  array(codes)
    .map((code) => label(options, code))
    .join("; ");
const choice = (value: unknown, options: Record<string, string>) =>
  options[string(value)] ?? "Not specified";
const percent = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value)
    ? value + "%"
    : "Not estimated";
const xml = (value: unknown) =>
  string(value)
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const run = (text: unknown) =>
  string(text)
    .split(/\r\n|\r|\n/)
    .map(
      (line, i) =>
        (i ? "<w:r><w:br/></w:r>" : "") +
        `<w:r><w:t xml:space="preserve">${xml(line)}</w:t></w:r>`,
    )
    .join("");
const paragraph = (text: unknown, style = "Normal") =>
  `<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr>${run(text)}</w:p>`;

export type AnswerSection = {
  title: string;
  answers: { question: string; answer: string }[];
};
export type AnswerDocumentDetails = {
  profile?: Record<string, unknown>;
  submittedAt?: string | null;
};

// Use the same versioned, visibility-filtered evidence as review and analysis.
// Never traverse raw draft keys: hidden answers and security data do not belong
// in an employee's copy, and internal codes are not readable question labels.
export function answerDocumentSections(
  evidence: ReturnType<typeof collectionEvidence>,
  details: AnswerDocumentDetails = {},
): AnswerSection[] {
  const e = evidence as unknown as Obj;
  const sections: AnswerSection[] = [];
  let current: AnswerSection;
  const section = (title: string) => {
    current = { title, answers: [] };
    sections.push(current);
  };
  const answer = (question: string, value: unknown, optional = false) => {
    const text = string(value).trim();
    if (!text && optional) return;
    current.answers.push({ question, answer: text || "Not answered" });
  };
  const profile = details.profile ?? {};
  if (
    [
      profile.name,
      profile.job_title,
      profile.title,
      profile.country,
      details.submittedAt,
    ].some(Boolean)
  ) {
    section("About you");
    answer("Name", profile.name, true);
    answer("Current job title", profile.job_title || profile.title, true);
    answer(
      "Country",
      PROJECT_COUNTRIES.find((c) => c[0] === profile.country)?.[1] ??
        profile.country,
      true,
    );
    answer("Business or entity", profile.entity, true);
    if (profile.manages_people === "yes" || profile.manages_people === "no")
      answer("People manager", profile.manages_people === "yes" ? "Yes" : "No");
    if (profile.manages_people === "yes")
      answer("Direct reports", profile.direct_reports, true);
    if (details.submittedAt && Number.isFinite(Date.parse(details.submittedAt)))
      answer(
        "Submitted",
        new Intl.DateTimeFormat("en-GB", {
          dateStyle: "long",
          timeStyle: "short",
          timeZone: "UTC",
        }).format(new Date(details.submittedAt)) + " UTC",
      );
  }
  section("Your work areas and time");
  for (const raw of array(e.workAreas)) {
    const w = object(raw);
    answer(string(w.label), percent(w.percentage) + " of total working time");
    answer("About your work in " + string(w.label), w.respondentNote, true);
    const nature = object(e.workNature)[string(w.code)];
    if (nature)
      answer("Type of work in " + string(w.label), label(WORK_NATURE, nature));
  }
  answer(
    "Important work outside a typical month",
    e.importantOccasionalWork,
    true,
  );
  const depth = object(e.depth),
    contextual = depth.formRevision === CURRENT_DEPTH_FORM_REVISION;
  if (Object.keys(depth).length) {
    section("Countries and businesses supported");
    answer(
      "Country where you are normally based",
      depth.basedCountry === "other"
        ? depth.basedOther
        : depth.basedCountry === "unknown"
          ? "Not sure"
          : label(PROJECT_COUNTRIES, depth.basedCountry),
    );
    for (const raw of array(depth.countries)) {
      const c = object(raw);
      answer(
        "Time supporting " + string(c.label),
        percent(c.shareOfWorkingTime) +
          (c.shareOfWorkingTime === null ? "" : " of total working time"),
      );
    }
    answer("Businesses regularly supported", depth.businesses);
    answer(
      "Number of employees regularly supported",
      depth.supportedEmployees === null
        ? "Not known"
        : depth.supportedEmployees,
    );
    answer("Working languages and level", depth.languages);
    for (const raw of array(depth.work)) {
      const w = object(raw),
        area = string(w.area),
        q = areaQuestions(area);
      const broad = array(e.workAreas)
        .map(object)
        .find((a) => a.code === area);
      section(string(broad?.label) || "Your work");
      const activities = array(w.tasks).map(object);
      if (activities.length)
        answer(
          "Activities you do",
          activities
            .map(
              (t) =>
                string(t.label) +
                (t.shareOfAreaTime === null
                  ? ""
                  : " — " + percent(t.shareOfAreaTime) + " of this work area"),
            )
            .join("\n"),
        );
      answer(
        area === "other" ? "Other work you do" : "Other activity",
        w.taskNote,
        true,
      );
      if (contextual) {
        if (array(w.contributions).length)
          answer(
            "How you are involved",
            labels(q.contributions ?? [], w.contributions),
          );
        if (q.scope) answer(q.scope[0], w.scopeNote, true);
        if (q.local) answer(q.local[0], w.localNote, true);
      } else {
        if (array(w.local).length)
          answer(
            "Local delivery requirements",
            labels(LOCAL_REQUIREMENTS, w.local),
          );
        answer("Local context", w.localNote, true);
        if (w.ownership)
          answer("Your main accountability", label(OWNERSHIP, w.ownership));
        answer("Whole process or service owner", w.ownerTeam, true);
      }
      if (array(w.receives).length)
        answer(
          "Work or information received from",
          labels(handoffOptions(area, "receives"), w.receives),
        );
      if (array(w.passes).length)
        answer(
          contextual && q.nextStep
            ? q.nextStep[0]
            : "Work or approval passed to",
          labels(handoffOptions(area, "passes"), w.passes),
        );
      answer(
        area === "other"
          ? "Who requests the work and receives it"
          : contextual && q.collaboration
            ? q.collaboration[0]
            : "Hand-off details",
        w.handoffNote,
        true,
      );
      if (typeof w.volume === "number")
        answer(
          "Personal work volume",
          `${w.volume} ${string(w.volumeUnit)} per ${string(w.volumePeriod)}${w.volumeBasis ? " — " + label(NUMBER_BASIS, w.volumeBasis) : ""}`,
        );
      if (typeof w.handlingMinutes === "number")
        answer("Average active minutes per item", w.handlingMinutes);
      if (typeof w.reworkPercent === "number")
        answer(
          contextual
            ? "Document or record updates needing correction"
            : "Items needing rework or correction",
          percent(w.reworkPercent),
        );
      // Historic submissions keep the answers they actually contained.
      if (w.transferable)
        answer(
          "Delivery from another country",
          choice(w.transferable, {
            yes: "Yes, subject to conditions",
            part: "Part of the work",
            no: "No",
            unknown: "Not sure",
          }),
        );
      if (typeof w.transferPercent === "number")
        answer(
          "Estimated share delivered elsewhere",
          percent(w.transferPercent),
        );
      answer("Delivery conditions", w.transferNote, true);
    }
  }
  const contact = object(e.contact);
  section("How people contact you or your team");
  for (const raw of array(contact.routes)) {
    const r = object(raw);
    answer(
      label(CONTACT_ROUTES, r.code),
      percent(r.shareOfRequests) + " of requests",
    );
  }
  answer(
    "Requests recorded so others can see their status",
    choice(contact.recording, {
      all: "All",
      most: "Most",
      some: "Some",
      none: "None",
      unknown: "Not sure",
    }),
  );
  answer(
    "How requests are tracked and followed up",
    contact.recordingNote,
    true,
  );
  answer(
    "How often the same request arrives more than once",
    choice(contact.duplicateRequests, {
      often: "Often",
      sometimes: "Sometimes",
      rarely: "Rarely",
      unknown: "Not sure",
    }),
  );
  answer(
    "Do employees and managers use the same contact routes",
    choice(contact.sameEmployeeManagerRoutes, {
      same: "Broadly the same",
      different: "Different routes",
      unknown: "Not sure",
    }),
  );
  if (contact.employeeRoutes)
    answer(
      "Main employee routes",
      labels(CONTACT_ROUTES, contact.employeeRoutes),
    );
  if (contact.managerRoutes)
    answer(
      "Main manager routes",
      labels(CONTACT_ROUTES, contact.managerRoutes),
    );
  const payroll = object(e.payroll);
  if (Object.keys(payroll).length) {
    section("Payroll responsibilities");
    answer(
      "Payroll involvement",
      choice(payroll.involvement, {
        yes: "I do payroll-related work",
        no: "Benefits or salary reviews only; no payroll work",
        unknown: "Not sure",
      }),
    );
    if (payroll.involvement === "yes") {
      for (const raw of array(payroll.stages)) {
        const s = object(raw),
          name = label(PAYROLL_STAGES, s.code);
        answer("Your part in " + name, label(MY_PAYROLL_PART, s.mine));
        if (array(s.others).length)
          answer(
            "Others involved in " + name,
            labels(PAYROLL_PARTIES, s.others),
          );
      }
      answer(
        "Payroll cycle",
        choice(payroll.cycle, {
          weekly: "Weekly",
          fortnightly: "Every two weeks",
          four_weekly: "Every four weeks",
          monthly: "Monthly",
          varies: "Several cycles or it varies",
          other: "Other",
          unknown: "Not sure",
        }),
      );
      answer(
        "Personal payroll days per cycle",
        payroll.daysUnknown ? "Not sure" : payroll.estimatedPersonalDays,
      );
      answer("Other payroll work", payroll.otherPayroll, true);
    }
  }
  const management = object(e.management);
  if (Object.keys(management).length) {
    section("Managing your team");
    if (management.uncertain)
      answer("Management time split", "Cannot reasonably estimate this split");
    for (const raw of array(management.groups)) {
      const g = object(raw);
      answer(
        string(g.label),
        percent(g.shareOfManagementTime) + " of management time",
      );
      answer("Other management work", g.description, true);
    }
    if (management.activities)
      answer(
        "Main management activities",
        labels(MANAGEMENT_ACTIVITIES, management.activities),
      );
    answer("Other management activity", management.other, true);
    if (management.sharedReporting)
      answer(
        "Team members with another reporting manager",
        choice(management.sharedReporting, {
          yes: "Yes",
          no: "No",
          unknown: "Not sure",
        }),
      );
    answer("Management context", management.note, true);
  }
  const technology = object(e.technology);
  if (Object.keys(technology).length) {
    section("Your technology work");
    answer(
      "Technology involvement",
      choice(technology.involvement, {
        yes: "I support, administer or improve technology",
        no: "I only use tools for my other work",
        unknown: "Not sure",
      }),
    );
    if (technology.involvement === "yes") {
      answer(
        "Technology activities",
        labels(TECHNOLOGY_ACTIVITIES, technology.activities),
      );
      answer("Other technology activity", technology.otherActivity, true);
      for (const raw of array(technology.activityAllocation)) {
        const a = object(raw);
        answer(
          label(TECHNOLOGY_ACTIVITIES, a.code),
          percent(a.shareOfTechnologyTime) + " of technology time",
        );
      }
      for (const raw of array(technology.time)) {
        const t = object(raw);
        answer(
          label(TECHNOLOGY_TIME, t.code),
          percent(t.shareOfTechnologyTime) + " of technology time",
        );
      }
      for (const raw of array(technology.platforms)) {
        const p = object(raw);
        answer(
          "Your involvement in " +
            (string(p.label) || label(TECHNOLOGY_SYSTEMS, p.code)),
          p.code === "unknown" ? "Not sure" : labels(TECHNOLOGY_ROLES, p.roles),
        );
      }
      answer("Other technology platform", technology.otherPlatform, true);
      answer(
        "Regular collaborators",
        labels(TECHNOLOGY_PARTNERS, technology.partners),
      );
      answer("Other collaborator", technology.otherPartner, true);
      answer("Technology context", technology.note, true);
    }
  }
  section("Systems and final comments");
  if (e.scope)
    answer(
      "Business support scope",
      choice(e.scope, {
        one: "One brand or entity",
        several: "Several brands or entities",
        group: "Group-wide",
        unknown: "Not sure",
      }),
    );
  if (array(e.localNeeds).length)
    answer("Local requirements", labels(LOCAL_NEEDS, e.localNeeds));
  answer("Local context", e.localNote, true);
  answer("Systems and tools used regularly", labels(SYSTEMS, e.systems));
  answer("Other systems and tools", e.otherSystems, true);
  answer(
    "Where simpler processes or better tools could help",
    e.manualNote,
    true,
  );
  answer("What works well and should be kept", e.strengths, true);
  answer("Anything else about your work", e.missing, true);
  if (Object.keys(depth).length) {
    const role = object(depth.role),
      capacity = object(depth.capacity),
      peaks = object(depth.peaks),
      metrics = object(depth.metrics),
      costs = object(depth.costs);
    section("Your decisions and workload");
    answer("How you usually make decisions", label(AUTONOMY, role.autonomy));
    answer(
      "Problems you usually resolve",
      choice(role.complexity, {
        standard: "Mostly standard tasks with known answers",
        varied: "Different situations using established guidance",
        complex: "Complex exceptions needing specialist judgement",
        novel: "New problems without established answers",
        unknown: "Not sure",
      }),
    );
    answer(
      "Usual reach of your decisions",
      choice(role.impact, {
        individual: "An individual request or case",
        team: "A team or local service",
        country: "A country or business",
        regional: "Several countries or a region",
        group: "Group-wide services or policy",
        unknown: "Not sure",
      }),
    );
    answer("Example of a decision you make", role.decisionExample, true);
    answer("Decisions needing someone else's approval", role.escalation, true);
    answer(
      "Current demand compared with available time",
      label(CAPACITY, capacity.capacity),
    );
    if (typeof capacity.weeklyHours === "number")
      answer("Contracted weekly hours", capacity.weeklyHours);
    answer("Typical additional hours per week", capacity.overtimeHours, true);
    answer(
      "Uncommitted hours in a typical week",
      capacity.availableHours,
      true,
    );
    answer(
      "Hours committed to site or reception cover",
      capacity.fixedOnsiteHours,
      true,
    );
    answer("Work delayed or left unfinished", capacity.unmetWork, true);
    answer(
      "Cover available for your main work",
      choice(capacity.backup, {
        full: "All main work",
        partial: "Some work only",
        none: "No trained cover",
        unknown: "Not sure",
      }),
    );
    answer(
      "Workload peaks",
      choice(peaks.pattern, {
        none: "No significant peaks",
        seasonal: "Regular annual or seasonal peaks",
        events: "Peaks linked to events or projects",
        unknown: "Not sure",
      }),
    );
    if (array(peaks.months).length)
      answer("Peak months", labels(MONTHS, peaks.months));
    answer("What causes peaks and when they happen", peaks.description, true);
    answer("Additional work hours per peak week", peaks.extraWeeklyHours, true);
    answer("Improvement opportunities", capacity.improvements, true);
    if (metrics.status) {
      section("Service measures");
      answer(
        "Service measures available",
        choice(metrics.status, { yes: "Yes", no: "No", unknown: "Not sure" }),
      );
      for (const [key, title] of [
        ["name", "Measure"],
        ["target", "Target"],
        ["actual", "Actual result"],
        ["period", "Reporting period"],
        ["source", "Source"],
      ])
        answer(title, metrics[key], true);
    }
    if (costs.status) {
      section("Provider costs");
      answer(
        "Provider cost knowledge",
        choice(costs.status, {
          known: "Known",
          unknown: "Not known",
          na: "Not applicable",
        }),
      );
      if (typeof costs.amount === "number")
        answer(
          "Provider cost",
          string(costs.amount) + " " + string(costs.currency),
        );
      answer("Cost period and scope", costs.period, true);
      answer("Cost source", costs.source, true);
    }
  }
  return sections.filter((s) => s.answers.length);
}

export function answerCopyDocx(
  evidence: ReturnType<typeof collectionEvidence>,
  details: AnswerDocumentDetails = {},
): Uint8Array {
  const sections = answerDocumentSections(evidence, details);
  const ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
  const body =
    paragraph("Your current work baseline answers", "Title") +
    paragraph("team.blue", "Subtitle") +
    paragraph(
      "This is a copy of the answers you submitted. Keep it for your records.",
    ) +
    sections
      .map(
        (s) =>
          paragraph(s.title, "Heading1") +
          s.answers
            .map((a) => paragraph(a.question, "Question") + paragraph(a.answer))
            .join(""),
      )
      .join("");
  const header = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  return zipTextFiles([
    {
      name: "[Content_Types].xml",
      text:
        header +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>',
    },
    {
      name: "_rels/.rels",
      text:
        header +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    },
    {
      name: "word/_rels/document.xml.rels",
      text:
        header +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
    },
    {
      name: "word/document.xml",
      text:
        header +
        `<w:document xmlns:w="${ns}"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr></w:body></w:document>`,
    },
    {
      name: "word/styles.xml",
      text:
        header +
        `<w:styles xmlns:w="${ns}"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="21"/><w:lang w:val="en-GB"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/><w:widowControl/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="0" w:after="120"/></w:pPr><w:rPr><w:b/><w:color w:val="000000"/><w:sz w:val="40"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/></w:pPr><w:rPr><w:color w:val="536477"/><w:sz w:val="22"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="120"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:color w:val="173B66"/><w:sz w:val="28"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Question"><w:name w:val="Question"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="80" w:after="40"/></w:pPr><w:rPr><w:b/></w:rPr></w:style></w:styles>`,
    },
  ]);
}
