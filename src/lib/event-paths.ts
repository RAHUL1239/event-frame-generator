/** Public event home: https://rsvpshare.com/event/{slug} */
export function publicEventPath(slug: string) {
  return `/event/${slug}`;
}

export function publicEventPreviewPath(slug: string, id: string) {
  return `/event/${slug}/preview/${id}`;
}

export function publicEventGuestsPath(slug: string) {
  return `/event/${slug}/guests`;
}
