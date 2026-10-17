import type { AnalysisTable, Cell } from "./analysis-export";
import { BROAD_AREAS } from "./broad-prototype";
import { MANAGEMENT_AREA } from "./management-prototype";
import {
  LOCAL_REQUIREMENTS,
  WORK_PARTIES,
  OWNERSHIP,
  AUTONOMY,
  CAPACITY,
  MONTHS,
} from "./depth";
type Obj = Record<string, unknown>;
const object = (v: unknown): Obj =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {};
const array = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const s = (v: unknown) => (v == null ? "" : String(v));
const n = (v: unknown): number | null =>
  v !== "" && v != null && Number.isFinite(Number(v)) ? Number(v) : null;
const fraction = (v: unknown) => (n(v) === null ? null : Number(v) / 100);
const label = (options: string[][], v: unknown) =>
  options.find((o) => o[0] === v)?.[1] ?? s(v);
const areaLabel = (code: unknown) =>
  [...BROAD_AREAS, MANAGEMENT_AREA].find((a) => a.code === code)?.label ??
  s(code);
export function depthAnalysisTables(
  people: Obj[],
  baseColumns: string[],
  base: (p: Obj) => Cell[],
): AnalysisTable[] {
  if (
    !people.some(
      (p) =>
        p.version === "team-blue-baseline-v5" ||
        p.questionnaire_version === "team-blue-baseline-v5" ||
        Object.keys(object(p.depth)).length,
    )
  )
    return [];
  const make = (
    name: string,
    columns: string[],
    percentages: string[] = [],
  ): AnalysisTable => ({
    name,
    columns: [...baseColumns, ...columns],
    rows: [],
    percentages,
  });
  const coverage = make(
    "Country coverage",
    [
      "Supported country code",
      "Supported country",
      "Working People region",
      "Share of working time",
      "Hours per week",
      "FTE allocation",
      "Country time not known",
    ],
    ["Share of working time"],
  );
  const tasks = make(
    "Detailed activities",
    [
      "Work area code",
      "Work area",
      "Activity code",
      "Activity",
      "Share of area time",
      "Share of working time",
      "Hours per week",
      "FTE allocation",
      "Activity time not known",
      "Other activity description",
    ],
    ["Share of area time", "Share of working time"],
  );
  const local = make("Local requirements", [
    "Work area code",
    "Work area",
    "Requirement code",
    "Requirement",
    "Country language or site detail",
  ]);
  const handoffs = make("Process handoffs", [
    "Work area code",
    "Work area",
    "Direction",
    "Party code",
    "Party",
    "Hand-off detail",
  ]);
  const delivery = make(
    "Delivery evidence",
    [
      "Work area code",
      "Work area",
      "Accountability code",
      "Accountability",
      "Whole process owner",
      "Volume basis",
      "Personal volume",
      "Volume unit",
      "Volume period",
      "Handling time basis",
      "Active minutes per item",
      "Rework basis",
      "Share of items needing rework",
      "Deliverable elsewhere code",
      "Potential share delivered elsewhere",
      "Potential share of total working time",
      "Potential hours per week",
      "Potential FTE allocation",
      "Conditions for delivery elsewhere",
    ],
    [
      "Share of items needing rework",
      "Potential share delivered elsewhere",
      "Potential share of total working time",
    ],
  );
  const role = make("Role and capacity", [
    "Reported work base country",
    "Other work base",
    "Supported businesses",
    "Working languages",
    "Supported employee population basis",
    "Supported employees",
    "Autonomy code",
    "Autonomy",
    "Complexity code",
    "Decision reach code",
    "Independent decision example",
    "Approval and escalation",
    "Demand balance code",
    "Demand balance",
    "Contracted hours basis",
    "Reported contracted hours per week",
    "Additional hours per week",
    "Available time basis",
    "Reported uncommitted hours per week",
    "Fixed site cover hours per week",
    "Unmet demand and backlog",
    "Trained cover code",
    "Improvement opportunities",
  ]);
  const peaks = make("Workload peaks", [
    "Peak pattern",
    "Month code",
    "Month",
    "Peak description and duration",
    "Additional effort basis",
    "Additional hours per peak week",
  ]);
  const measures = make("Service and provider evidence", [
    "Measures available code",
    "Service measure and unit",
    "Target",
    "Actual result",
    "Reporting period",
    "Measure source",
    "Provider cost status",
    "Provider cost amount",
    "Currency",
    "Cost period and service scope",
    "Cost source",
  ]);
  for (const p of people) {
    if (!Object.keys(object(p.depth)).length) continue;
    const b = base(p),
      d = object(p.depth),
      r = object(d.role),
      c = object(d.capacity),
      peak = object(d.peaks),
      metric = object(d.metrics),
      cost = object(d.costs),
      areas = array(p.workAreas).map(object),
      hours = n(p.contracted_hours),
      fte = n(p.working_fraction);
    const alloc = (share: number | null): Cell[] => [
      share,
      share === null || hours === null ? null : hours * share,
      share === null || fte === null ? null : fte * share,
    ];
    const whole = (share: unknown, area: unknown) => {
      const a = n(areas.find((a) => a.code === area)?.percentage),
        t = n(share);
      return a === null || t === null ? null : (a * t) / 10000;
    };
    for (const country of array(d.countries).map(object))
      coverage.rows.push([
        ...b,
        s(country.code),
        s(country.label),
        s(country.region),
        ...alloc(fraction(country.shareOfWorkingTime)),
        d.countryTimeUnknown === true,
      ]);
    for (const w of array(d.work).map(object)) {
      const a = [s(w.area), areaLabel(w.area)];
      for (const t of array(w.tasks).map(object))
        tasks.rows.push([
          ...b,
          ...a,
          s(t.code),
          s(t.label),
          fraction(t.shareOfAreaTime),
          ...alloc(whole(t.shareOfAreaTime, w.area)),
          w.taskTimeUnknown === true,
          s(w.taskNote),
        ]);
      for (const code of array(w.local))
        local.rows.push([
          ...b,
          ...a,
          s(code),
          label(LOCAL_REQUIREMENTS, code),
          s(w.localNote),
        ]);
      for (const [key, direction] of [
        ["receives", "Received from"],
        ["passes", "Passed to"],
      ])
        for (const code of array(w[key]))
          handoffs.rows.push([
            ...b,
            ...a,
            direction,
            s(code),
            label(WORK_PARTIES, code),
            s(w.handoffNote),
          ]);
      delivery.rows.push([
        ...b,
        ...a,
        s(w.ownership),
        label(OWNERSHIP, w.ownership),
        s(w.ownerTeam),
        s(w.volumeBasis),
        n(w.volume),
        s(w.volumeUnit),
        s(w.volumePeriod),
        s(w.handlingBasis),
        n(w.handlingMinutes),
        s(w.reworkBasis),
        fraction(w.reworkPercent),
        s(w.transferable),
        fraction(w.transferPercent),
        ...alloc(whole(w.transferPercent, w.area)),
        s(w.transferNote),
      ]);
    }
    role.rows.push([
      ...b,
      s(d.basedCountry),
      s(d.basedOther),
      s(d.businesses),
      s(d.languages),
      s(d.populationBasis),
      n(d.supportedEmployees),
      s(r.autonomy),
      label(AUTONOMY, r.autonomy),
      s(r.complexity),
      s(r.impact),
      s(r.decisionExample),
      s(r.escalation),
      s(c.capacity),
      label(CAPACITY, c.capacity),
      s(c.hoursBasis),
      n(c.weeklyHours),
      n(c.overtimeHours),
      s(c.availableBasis),
      n(c.availableHours),
      n(c.fixedOnsiteHours),
      s(c.unmetWork),
      s(c.backup),
      s(c.improvements),
    ]);
    const months = array(peak.months);
    for (const month of months.length ? months : [""])
      peaks.rows.push([
        ...b,
        s(peak.pattern),
        s(month),
        label(MONTHS, month),
        s(peak.description),
        s(peak.basis),
        n(peak.extraWeeklyHours),
      ]);
    measures.rows.push([
      ...b,
      s(metric.status),
      s(metric.name),
      s(metric.target),
      s(metric.actual),
      s(metric.period),
      s(metric.source),
      s(cost.status),
      n(cost.amount),
      s(cost.currency),
      s(cost.period),
      s(cost.source),
    ]);
  }
  return [coverage, tasks, local, handoffs, delivery, role, peaks, measures];
}
