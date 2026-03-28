/*
 * Lightweight display-only announcement seeds for societies that have not posted yet.
 */

function formatEventDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildWelcomeAnnouncement(society) {
  return {
    id: `seed-welcome-${society.id}`,
    title: `Welcome to ${society.name}`,
    content: `${society.bio || "This society is getting ready for the term."} Check the calendar for upcoming sessions and drop in whenever you can.`,
    pinned: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [],
    event_id: null,
    tag: null,
  };
}

function buildUpcomingAnnouncement(society, nextEvent) {
  const tagId = nextEvent?.tag_data?.id || nextEvent?.tag || society.tags?.[0]?.id || null;
  const slot = formatEventDate(nextEvent?.start_time);
  return {
    id: `seed-up-next-${society.id}`,
    title: "Coming up this week",
    content: slot
      ? `${nextEvent.title} is next on the schedule for ${slot}. Bring a friend, arrive a little early, and check the group chat for any last-minute updates.`
      : "The next session is being finalised now. Keep an eye on the calendar for the latest timing.",
    pinned: false,
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    images: [],
    event_id: nextEvent?.id || null,
    tag: tagId,
  };
}

export function getSeedAnnouncements(society, editMode = false) {
  const realAnnouncements = Array.isArray(society?.announcements) ? society.announcements : [];
  if (editMode || realAnnouncements.length > 0 || society?.is_admin) return realAnnouncements;

  const nextEvent = Array.isArray(society?.events) ? society.events[0] : null;
  if (!nextEvent && !society?.bio) return realAnnouncements;

  return [buildWelcomeAnnouncement(society), buildUpcomingAnnouncement(society, nextEvent)];
}
