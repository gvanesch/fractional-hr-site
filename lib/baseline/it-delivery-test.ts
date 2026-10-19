// Greg's explicit 19 October approval: one IT tester, isolated from programme responses.
export const IT_DELIVERY_TEST = {
  email: "antoni.serra@team.blue",
  campaign: "55000002-2026-4019-8040-000000000001",
  participant: "55000002-2026-4019-8040-000000000002",
  invitationEvent: "55000002-2026-4019-8040-000000000003",
  closes: "2026-10-30T23:59:59.000Z",
} as const;
export function isITDeliveryTest(email: string, campaign?: string) {
  return (
    email.trim().toLowerCase() === IT_DELIVERY_TEST.email &&
    campaign === IT_DELIVERY_TEST.campaign
  );
}
