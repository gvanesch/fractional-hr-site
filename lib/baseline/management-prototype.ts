export const MANAGEMENT_AREA = {
  code: "people_management",
  label: "People management and team leadership",
  examples:
    "One-to-one meetings with your direct reports, team meetings, allocating work, setting priorities, development and managing your team’s performance. Include only management of your own team. Record advice to other managers under manager advice. Record other meetings under the work they support.",
};
export const MANAGEMENT_ACTIVITIES = [
  [
    "one_to_ones",
    "One-to-one meetings",
    "Regular conversations with your direct reports about their work and support needs.",
  ],
  [
    "team_meetings",
    "Team meetings",
    "Meetings to keep your own team informed and aligned.",
  ],
  [
    "coordination",
    "Work allocation and coordination",
    "Set priorities, assign work and coordinate delivery within your team.",
  ],
  [
    "development",
    "Development and coaching",
    "Support the learning and development of your direct reports.",
  ],
  [
    "performance",
    "Performance matters",
    "Set goals, review performance and address performance concerns in your team.",
  ],
  [
    "hiring",
    "Hiring and onboarding team members",
    "Recruit and help new members join your own team.",
  ],
  ["other", "Other management work", "Add a short description."],
  [
    "unknown",
    "Not sure",
    "Choose this if you cannot identify the main activities confidently.",
  ],
];
export type ManagerRecord = {
  isPeopleManager: boolean;
  directReports?: number;
};
export type ManagementDraft = {
  activities: string[];
  other: string;
  sharedReporting: string;
  note: string;
};
export const emptyManagement = (): ManagementDraft => ({
  activities: [],
  other: "",
  sharedReporting: "",
  note: "",
});
export const managementVisible = (
  record: ManagerRecord | undefined,
  selected: string[],
) =>
  record?.isPeopleManager === true && selected.includes(MANAGEMENT_AREA.code);
export function managementIssues(d: ManagementDraft) {
  const issues: string[] = [];
  if (
    !d.activities.length ||
    d.activities.length > 3 ||
    new Set(d.activities).size !== d.activities.length ||
    d.activities.some((c) => !MANAGEMENT_ACTIVITIES.some((o) => o[0] === c)) ||
    (d.activities.includes("unknown") && d.activities.length > 1)
  )
    issues.push("activities");
  if (d.activities.includes("other") && !d.other.trim()) issues.push("other");
  if (!["yes", "no", "unknown"].includes(d.sharedReporting))
    issues.push("sharedReporting");
  return issues;
}
export function managementEvidence(d: ManagementDraft, visible: boolean) {
  return visible
    ? {
        version: "management-preview-v1",
        activities: d.activities,
        ...(d.activities.includes("other") ? { other: d.other } : {}),
        sharedReporting: d.sharedReporting,
        note: d.note,
      }
    : null;
}
