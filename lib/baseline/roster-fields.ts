export const CORE_ROSTER_FIELDS = [
  "name",
  "email",
  "job_title",
  "country",
  "region",
  "entity",
  "work_type",
  "manages_people",
  "direct_reports",
];
export const EXTRA_ROSTER_FIELDS = [
  "participant_reference",
  "division",
  "brand",
  "department",
  "team",
  "location",
  "manager_name",
  "manager_email",
  "leader_email",
  "regional_leader_name",
  "regional_leader_email",
  "job_level",
  "contracted_hours",
  "full_time_hours",
  "working_fraction",
];
export const ROSTER_FIELDS = [...CORE_ROSTER_FIELDS, ...EXTRA_ROSTER_FIELDS];
export const LAUNCH_ROSTER_FIELDS = [
  "name",
  "email",
  "job_title",
  "job_level",
  "country",
  "region",
  "entity",
  "team",
  "location",
  "manages_people",
  "direct_reports",
  "manager_name",
  "manager_email",
  "regional_leader_name",
  "regional_leader_email",
  "working_fraction",
];
export const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  email: "Work email",
  job_title: "Current job title",
  country: "Country code",
  region: "Region",
  entity: "Employing legal entity",
  work_type: "Current work type",
  manages_people: "Formal people manager",
  direct_reports: "Formal direct reports",
  participant_reference: "Internal participant reference",
  division: "Division / business",
  brand: "Brand",
  department: "Department",
  team: "Team",
  location: "Office / location",
  manager_name: "Line manager name",
  manager_email: "Line manager work email",
  leader_email: "Responsible leader work email",
  regional_leader_name: "Regional leader name",
  regional_leader_email: "Regional leader work email",
  job_level: "Current TB grade",
  contracted_hours: "Contracted hours per week",
  full_time_hours: "Full-time hours per week",
  working_fraction: "Working fraction (0 to 1)",
};
export function rosterMetadata(p: Record<string, unknown>) {
  return Object.fromEntries(
    EXTRA_ROSTER_FIELDS.map((k) => [k, String(p[k] ?? "")]),
  );
}
export function validateRosterExtras(p: Record<string, string>, row: number) {
  for (const key of ["manager_email", "leader_email", "regional_leader_email"])
    if (p[key] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p[key]))
      throw new Error(`Check ${key} on row ${row}.`);
  for (const key of ["contracted_hours", "full_time_hours", "working_fraction"])
    if (
      p[key] &&
      (!/^\d+(?:\.\d+)?$/.test(p[key]) ||
        Number(p[key]) <= 0 ||
        Number(p[key]) > (key === "working_fraction" ? 1 : 168))
    )
      throw new Error(
        `Check ${key} on row ${row}. Use a positive number${key === "working_fraction" ? " up to 1" : ""}.`,
      );
  if (p.manages_people === "no" && Number(p.direct_reports) > 0)
    throw new Error(`Check manager status and direct reports on row ${row}.`);
  if (
    p.contracted_hours &&
    p.full_time_hours &&
    p.working_fraction &&
    Math.abs(
      Number(p.contracted_hours) / Number(p.full_time_hours) -
        Number(p.working_fraction),
    ) > 0.02
  )
    throw new Error(
      `Working fraction does not match the hours on row ${row}. Divide contracted hours by full-time hours. For example, 20 hours divided by 40 hours gives 0.5. Check these three values.`,
    );
}
