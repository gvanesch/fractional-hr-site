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
  participants: DashboardParticipant[];
  scope: {
    regions: string[];
    countries: string[];
    entities: string[];
    role: "all" | "regional_lead" | "legacy";
    regionalLeaderEmail: string;
  };
};
export type LaunchReadiness = {
  ready: boolean;
  blockers: string[];
  warnings: string[];
  active: number;
  toInvite: number;
  questionnaireVersion: string;
};

export type DashboardParticipant = {
  participantId: string;
  name: string;
  email: string;
  jobTitle: string;
  country: string;
  region: string;
  entity: string;
  team: string;
  regionalLeaderName: string;
  regionalLeaderEmail: string;
  status: string;
  active: boolean;
  invited: boolean;
  inviteExpiresAt: string | null;
  progress: number;
  updatedAt: string;
  submittedAt: string | null;
};
