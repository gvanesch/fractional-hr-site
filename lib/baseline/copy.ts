export const BASELINE_COMPLETION_GUIDANCE =
  "Most people will take 15–20 minutes. More complex roles may take up to 30 minutes. You can save and return.";

// This exact operational note belongs to historic delivery-test setup, not the
// participant introduction. Other campaign-specific notices remain unchanged.
export function participantPrivacyNotice(
  notice: string,
  standardNotice: string,
) {
  return notice ===
    "IT delivery and access test only. Use synthetic answers. Exclude this campaign from programme reporting. Responses are retained; no automated deletion applies."
    ? standardNotice
    : notice;
}
