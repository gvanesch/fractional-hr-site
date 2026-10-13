export type CompletionDashboard = {
  campaign: { name: string; status: string; closesAt: string };
  counts: {
    roster: number;
    removed: number;
    invited: number;
    notInvited: number;
    notStarted: number;
    inProgress: number;
    completed: number;
  };
  completionPercent: number;
  groups: Record<
    string,
    { label: string; invited: number; completed: number; inProgress: number }[]
  >;
  generatedAt: string;
  smallGroupsHidden: boolean;
  scope: { regions: string[]; countries: string[]; entities: string[] };
};
export type LaunchReadiness = {
  ready: boolean;
  blockers: string[];
  warnings: string[];
  active: number;
  toInvite: number;
  questionnaireVersion: string;
};
