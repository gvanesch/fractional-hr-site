// A mailbox may have one non-Fact-Pack assignment and one Fact Pack assignment.
// Callers supply only other participants in the same project with the same email.
export function hasParticipantEmailConflict(
  questionnaireType: string,
  participants: ReadonlyArray<{ questionnaire_type: string }>,
): boolean {
  const isFactPack = questionnaireType === "client_fact_pack";
  return participants.some(
    (participant) =>
      (participant.questionnaire_type === "client_fact_pack") === isFactPack,
  );
}
