/** Keep organizer credentials off responses and client props. */
export function hideOrganizerSecret<
  T extends { organizerPasswordHash?: string | null },
>(event: T): T {
  return { ...event, organizerPasswordHash: null };
}

export function toPublicEvent<
  T extends {
    organizerPasswordHash?: string | null;
    organizerUsername?: string | null;
  },
>(event: T): T {
  return {
    ...event,
    organizerUsername: null,
    organizerPasswordHash: null,
  };
}
