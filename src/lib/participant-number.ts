/** Displayed participant # = configurable base + actual submission ordinal. */
export function calculateParticipantNumber(
  participantCountBase: number,
  submissionOrdinal: number
): number {
  const base = Math.max(0, participantCountBase);
  const ordinal = Math.max(1, submissionOrdinal);
  return base + ordinal;
}

/** Total attendees shown on the form = base + actual submission count. */
export function calculateAttendeeCount(
  participantCountBase: number,
  submissionCount: number
): number {
  return Math.max(0, participantCountBase) + Math.max(0, submissionCount);
}
