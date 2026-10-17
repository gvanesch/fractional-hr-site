// New QA design only. Persisted collection versions retain their existing definition.
export const MANAGEMENT_TIME_GROUPS = [
  [
    "coordination",
    "Team coordination",
    "Team meetings, setting priorities and allocating work.",
  ],
  [
    "individual",
    "Individual support",
    "One-to-one meetings, coaching, development and performance matters.",
  ],
  [
    "hiring",
    "Hiring and team changes",
    "Recruiting, onboarding new team members and arranging cover.",
  ],
  [
    "administration",
    "Management administration",
    "Approvals, team records and management reporting.",
  ],
  [
    "other",
    "Other management work",
    "Other work you do to manage your own team.",
  ],
];
export type ManagementTimeDraft = {
  time: Record<string, number>;
  uncertain: boolean;
  other: string;
};
export const emptyManagementTime = (): ManagementTimeDraft => ({
  time: { other: 0 },
  uncertain: false,
  other: "",
});
export const managementTimeTotal = (d: ManagementTimeDraft) =>
  MANAGEMENT_TIME_GROUPS.reduce(
    (n, [c]) => n + (Number.isFinite(d.time[c]) ? d.time[c] : 0),
    0,
  );
export function managementTimeIssues(d: ManagementTimeDraft) {
  if (d.uncertain) return [];
  const missing = MANAGEMENT_TIME_GROUPS.filter(
    ([c]) => !Number.isFinite(d.time[c]) || d.time[c] < 0 || d.time[c] > 100,
  ).map(([c]) => "time_" + c);
  if (
    !missing.length &&
    (managementTimeTotal(d) < 98 || managementTimeTotal(d) > 102)
  )
    missing.push(...MANAGEMENT_TIME_GROUPS.map(([c]) => "time_" + c));
  if (d.time.other > 0 && !d.other.trim()) missing.push("other");
  return missing;
}
export const managementTimeEvidence = (
  d: ManagementTimeDraft,
  workingShare: number,
) =>
  d.uncertain
    ? { uncertain: true, groups: [] }
    : {
        uncertain: false,
        groups: MANAGEMENT_TIME_GROUPS.filter(([c]) => d.time[c] > 0).map(
          ([code, label]) => ({
            code,
            label,
            shareOfManagementTime: d.time[code],
            approximateShareOfWorkingTime: Number(
              ((workingShare * d.time[code]) / 100).toFixed(1),
            ),
            ...(code === "other" ? { description: d.other } : {}),
          }),
        ),
      };
