/** Displayed participant # = configurable base + actual submission ordinal. */
export function calculateParticipantNumber(
  participantCountBase: number,
  submissionOrdinal: number
): number {
  const base = Math.max(0, participantCountBase);
  const ordinal = Math.max(1, submissionOrdinal);
  return base + ordinal;
}
