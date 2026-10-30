import type { DashboardParticipant } from "./admin-types";
export type DashboardFilters = {
  search: string;
  status: string;
  region: string;
  country: string;
  entity: string;
  team: string;
  leader: string;
};
export const emptyDashboardFilters = (): DashboardFilters => ({
  search: "",
  status: "all",
  region: "",
  country: "",
  entity: "",
  team: "",
  leader: "",
});
export function filterDashboard(
  rows: DashboardParticipant[],
  f: DashboardFilters,
) {
  return rows.filter(
    (p) =>
      [
        p.name,
        p.email,
        p.jobTitle,
        p.region,
        p.country,
        p.entity,
        p.team,
        p.regionalLeaderName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(f.search.trim().toLowerCase()) &&
      (!f.region || p.region === f.region) &&
      (!f.country || p.country === f.country) &&
      (!f.entity || p.entity === f.entity) &&
      (!f.team || p.team === f.team) &&
      (!f.leader || p.regionalLeaderEmail === f.leader) &&
      (f.status === "all" ||
        (f.status === "withdrawn"
          ? !p.active
          : f.status === "not_invited"
            ? p.active && !p.invited
            : f.status === "invited"
              ? p.active && p.invited
              : p.active && p.status === f.status)),
  );
}
export function dashboardCounts(rows: DashboardParticipant[]) {
  const active = rows.filter((p) => p.active),
    invited = active.filter((p) => p.invited),
    completed = invited.filter((p) => p.status === "completed");
  return {
    roster: active.length,
    removed: rows.length - active.length,
    invited: invited.length,
    notInvited: active.length - invited.length,
    notStarted: invited.filter((p) => p.status === "not_started").length,
    inProgress: invited.filter((p) => p.status === "in_progress").length,
    completed: completed.length,
    percent: invited.length
      ? Math.round((completed.length / invited.length) * 100)
      : 0,
  };
}
