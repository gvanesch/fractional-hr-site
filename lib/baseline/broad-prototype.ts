// QA design only. Broad selections are not evidence of individual example tasks.
export const BROAD_AREAS = [
  {
    code: "lifecycle",
    label: "Employee lifecycle support",
    examples:
      "Joining and leaving, job or contract changes, employee documents, records, leave, everyday questions and coordinating with IT or other teams.",
  },
  {
    code: "recruitment",
    label: "Recruitment",
    examples:
      "Finding candidates, arranging interviews, selecting candidates, preparing offers and working with hiring managers.",
  },
  {
    code: "pay_benefits",
    label: "Payroll, pay and benefits",
    examples:
      "Payroll information and checks, pay questions, benefits, salary reviews and working with payroll providers.",
  },
  {
    code: "advice_cases",
    label: "Manager advice and employee cases",
    examples:
      "Advising managers, employee concerns, absence or performance cases, complaints, investigations and working with Legal.",
  },
  {
    code: "planning_development",
    label: "People planning, performance and development",
    examples:
      "Staffing plans, team changes, performance reviews, talent and succession, training, development and supporting business changes.",
  },
  {
    code: "experience",
    label: "Employee engagement and experience",
    examples:
      "Employee feedback, surveys, communication, events, recognition and activities that improve working life.",
  },
  {
    code: "policies",
    label: "Policies and local requirements",
    examples:
      "Writing or updating policies, local employment requirements, audits, employee representatives and consultation.",
  },
  {
    code: "systems_data",
    label: "People systems, data and improvement",
    examples:
      "Maintaining or improving People systems, system user support, reports, analysis, integrations, automation and AI tools. Record routine employee updates under lifecycle support.",
  },
  {
    code: "office",
    label: "Reception, facilities and office support",
    examples:
      "Reception, visitors, deliveries, office supplies, building access, repairs, meeting rooms, workplace suppliers and safety administration.",
  },
  {
    code: "other",
    label: "Other work",
    examples:
      "Work that does not fit the areas above. Add a short description if useful.",
  },
];
export type BroadDraft = {
  selected: string[];
  time: Record<string, number>;
  notes: Record<string, string>;
  occasional: string;
};
export const emptyBroadDraft = (): BroadDraft => ({
  selected: [],
  time: {},
  notes: {},
  occasional: "",
});
export const broadSelected = (d: BroadDraft) =>
  BROAD_AREAS.filter((a) => d.selected.includes(a.code));
export const broadTotal = (d: BroadDraft) =>
  Math.round(
    broadSelected(d).reduce(
      (n, a) => n + (Number.isFinite(d.time[a.code]) ? d.time[a.code] : 0),
      0,
    ) * 100,
  ) / 100;
export function toggleBroad(d: BroadDraft, code: string): BroadDraft {
  if (!BROAD_AREAS.some((a) => a.code === code)) return d;
  return {
    ...d,
    selected: d.selected.includes(code)
      ? d.selected.filter((c) => c !== code)
      : [...d.selected, code],
  };
}
export function broadIssues(d: BroadDraft, stage: number): string[] {
  if (!broadSelected(d).length) return ["selection"];
  if (stage === 0) return [];
  const invalid = broadSelected(d)
    .filter(
      (a) =>
        !Object.hasOwn(d.time, a.code) ||
        !Number.isFinite(d.time[a.code]) ||
        d.time[a.code] < 0 ||
        d.time[a.code] > 100,
    )
    .map((a) => a.code);
  if (invalid.length) return invalid;
  return broadTotal(d) < 98 || broadTotal(d) > 102 ? d.selected : [];
}
export const broadEvidence = (d: BroadDraft) => ({
  designVersion: "broad-work-prototype-v1",
  workAreas: broadSelected(d).map((a) => ({
    code: a.code,
    label: a.label,
    percentage: d.time[a.code] ?? null,
    respondentNote: d.notes[a.code] ?? "",
  })),
  importantOccasionalWork: d.occasional,
  // No individual activities or future pillar/role are inferred from a broad answer.
});
