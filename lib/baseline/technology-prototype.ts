import { SYSTEMS, otherSystemNames } from "./prototype-enrichment";
export const TECHNOLOGY_ACTIVITIES = [
  [
    "administration",
    "System administration",
    "Configure, maintain or manage the system for other users.",
  ],
  [
    "configuration",
    "System configuration",
    "Change how a platform works to meet business needs.",
  ],
  [
    "support",
    "User support",
    "Help colleagues use systems and resolve problems.",
  ],
  [
    "access",
    "Access and permissions",
    "Manage who can see information or use features.",
  ],
  [
    "integrations",
    "Integrations",
    "Connect systems and manage information moving between them.",
  ],
  [
    "automation",
    "Workflows and automation",
    "Create or improve automatic tasks and approval steps.",
  ],
  [
    "ai",
    "AI tools and digital solutions",
    "Develop or support tools that use artificial intelligence.",
  ],
  [
    "data_quality",
    "Data quality",
    "Check and improve the accuracy of system information.",
  ],
  [
    "reporting",
    "Reporting and analytics",
    "Build reports and help others understand data.",
  ],
  [
    "implementation",
    "New systems and implementations",
    "Introduce a platform or deliver a major rollout.",
  ],
  [
    "vendors",
    "Vendor coordination",
    "Work with suppliers on service, changes or technical issues.",
  ],
  [
    "documentation",
    "Documentation and guidance",
    "Maintain instructions and knowledge for users or the team.",
  ],
  ["other", "Other technology work", "Add a short description."],
  [
    "unknown",
    "Not sure",
    "Choose this if you cannot describe your technology work confidently.",
  ],
];
export const TECHNOLOGY_TIME = [
  [
    "run",
    "Running and supporting existing systems",
    "Day-to-day administration, support, checks and maintenance.",
  ],
  [
    "improve",
    "Improving existing systems",
    "Changes to existing platforms, reports, integrations or workflows.",
  ],
  [
    "deliver",
    "Delivering new systems or projects",
    "Introducing new platforms or delivering a major implementation.",
  ],
];
export const TECHNOLOGY_ROLES = [
  [
    "admin",
    "Day-to-day administration",
    "You maintain the platform and its routine operation.",
  ],
  [
    "technical",
    "Technical configuration or development",
    "You change settings, build solutions or connect systems.",
  ],
  [
    "support",
    "Support and troubleshooting",
    "You help users and investigate problems.",
  ],
  [
    "data",
    "Reporting or data",
    "You maintain information or build reports using this platform.",
  ],
  [
    "provider",
    "Coordination with a provider",
    "You organise work delivered by an external provider.",
  ],
  [
    "responsible",
    "Overall responsibility",
    "You are responsible for the platform service and its final results.",
  ],
  ["unknown", "Not sure", "You are unsure how to describe your involvement."],
];
export const TECHNOLOGY_PARTNERS = [
  ["local_people", "Local People teams"],
  ["group_people", "Group People teams"],
  ["it", "IT"],
  ["finance", "Finance"],
  ["providers", "External providers"],
  ["other", "Other teams"],
  ["none", "No regular collaborators"],
  ["unknown", "Not sure"],
];
export const TECHNOLOGY_SYSTEMS = SYSTEMS.filter(([code]) => code !== "none");
export type TechnologyDraft = {
  involvement: string;
  activities: string[];
  otherActivity: string;
  activityTime?: Record<string, number>;
  time: Record<string, number>;
  platforms: string[];
  otherPlatform: string;
  roles: Record<string, string[]>;
  partners: string[];
  otherPartner: string;
  note: string;
};
export const emptyTechnology = (): TechnologyDraft => ({
  involvement: "",
  activities: [],
  otherActivity: "",
  activityTime: undefined,
  time: {},
  platforms: [],
  otherPlatform: "",
  roles: {},
  partners: [],
  otherPartner: "",
  note: "",
});
export function technologyPlatforms(d: TechnologyDraft) {
  const standard = d.platforms
    .filter((c) => c !== "other")
    .map((code) => ({
      code,
      label: TECHNOLOGY_SYSTEMS.find((o) => o[0] === code)?.[1] ?? code,
    }));
  const custom = d.platforms.includes("other")
    ? otherSystemNames(d.otherPlatform)
        .filter(
          (name) =>
            !standard.some((p) => p.label.toLowerCase() === name.toLowerCase()),
        )
        .map((label) => ({
          code: "custom:" + encodeURIComponent(label.toLowerCase()),
          label,
        }))
    : [];
  return [...standard, ...custom];
}
export const technologyVisible = (enabled: boolean, selected: string[]) =>
  enabled && selected.includes("systems_data");
const valid = (values: string[], options: string[][]) =>
  values.length > 0 &&
  new Set(values).size === values.length &&
  values.every((c) => options.some((o) => o[0] === c)) &&
  !(values.length > 1 && values.some((c) => ["none", "unknown"].includes(c)));
export const technologyTotal = (d: TechnologyDraft) =>
  Math.round(
    TECHNOLOGY_TIME.reduce(
      (n, [c]) => n + (Number.isFinite(d.time[c]) ? d.time[c] : 0),
      0,
    ) * 100,
  ) / 100;
export const technologyActivities = (d: TechnologyDraft) => TECHNOLOGY_ACTIVITIES.filter(([code]) => code !== "unknown" && d.activities.includes(code));
export const technologyActivityTotal = (d: TechnologyDraft) => Math.round(technologyActivities(d).reduce((sum, [code]) => sum + (Number.isFinite(d.activityTime?.[code]) ? d.activityTime![code] : 0), 0) * 100) / 100;
export function technologyIssues(d: TechnologyDraft) {
  if (!["yes", "no", "unknown"].includes(d.involvement)) return ["involvement"];
  if (d.involvement !== "yes") return [];
  const issues: string[] = [];
  if (!valid(d.activities, TECHNOLOGY_ACTIVITIES)) issues.push("activities");
  if (d.activities.includes("other") && !d.otherActivity.trim())
    issues.push("otherActivity");
  if (d.activityTime !== undefined && technologyActivities(d).length) {
    const missing = technologyActivities(d).filter(([code]) => !Number.isFinite(d.activityTime?.[code]) || d.activityTime![code] < 0 || d.activityTime![code] > 100);
    issues.push(...(missing.length ? missing : technologyActivityTotal(d) < 98 || technologyActivityTotal(d) > 102 ? technologyActivities(d) : []).map(([code]) => "activityTime_" + code));
  }
  const bad = TECHNOLOGY_TIME.filter(
    ([c]) => !Number.isFinite(d.time[c]) || d.time[c] < 0 || d.time[c] > 100,
  ).map(([c]) => "time_" + c);
  issues.push(...bad);
  if (!bad.length && (technologyTotal(d) < 98 || technologyTotal(d) > 102))
    issues.push(...TECHNOLOGY_TIME.map(([c]) => "time_" + c));
  if (!valid(d.platforms, TECHNOLOGY_SYSTEMS)) issues.push("platforms");
  if (
    d.platforms.includes("other") &&
    (!d.otherPlatform.trim() ||
      otherSystemNames(d.otherPlatform).length > 20 ||
      otherSystemNames(d.otherPlatform).some((n) => n.length > 80))
  )
    issues.push("otherPlatform");
  for (const { code: c } of technologyPlatforms(d).filter(
    (p) => p.code !== "unknown",
  ))
    if (!valid(d.roles[c] ?? [], TECHNOLOGY_ROLES)) issues.push("roles_" + c);
  if (!valid(d.partners, TECHNOLOGY_PARTNERS)) issues.push("partners");
  if (d.partners.includes("other") && !d.otherPartner.trim())
    issues.push("otherPartner");
  return issues;
}
export function technologyEvidence(d: TechnologyDraft, visible: boolean) {
  if (!visible) return null;
  if (d.involvement !== "yes")
    return { version: "technology-preview-v2", involvement: d.involvement };
  return {
    version: "technology-preview-v2",
    involvement: d.involvement,
    activities: d.activities,
    ...(d.activityTime !== undefined ? { activityAllocation: technologyActivities(d).map(([code]) => ({ code, shareOfTechnologyTime: d.activityTime![code] ?? null })) } : {}),
    ...(d.activities.includes("other")
      ? { otherActivity: d.otherActivity }
      : {}),
    time: TECHNOLOGY_TIME.map(([code]) => ({
      code,
      shareOfTechnologyTime: d.time[code],
    })),
    platforms: technologyPlatforms(d).map(({ code, label }) => ({
      code,
      ...(code.startsWith("custom:") ? { label } : {}),
      roles: code === "unknown" ? [] : (d.roles[code] ?? []),
    })),
    ...(d.platforms.includes("other")
      ? { otherPlatform: d.otherPlatform }
      : {}),
    partners: d.partners,
    ...(d.partners.includes("other") ? { otherPartner: d.otherPartner } : {}),
    note: d.note,
  };
}
