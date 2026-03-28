import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getSeedAnnouncements } from "../../../../components/society/utils/seedAnnouncements";

function formatExpectedDate(value) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

describe("getSeedAnnouncements", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-28T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the real announcements for edit mode, existing posts, and admins", () => {
    const realAnnouncements = [{ id: 1, title: "Real" }];

    expect(getSeedAnnouncements({ announcements: realAnnouncements }, true)).toBe(realAnnouncements);
    expect(getSeedAnnouncements({ announcements: realAnnouncements })).toBe(realAnnouncements);
    expect(getSeedAnnouncements({ announcements: [], is_admin: true })).toEqual([]);
  });

  it("returns an empty array when there is no bio and no upcoming event", () => {
    expect(getSeedAnnouncements()).toEqual([]);
    expect(getSeedAnnouncements({ id: 1, name: "Chess", announcements: [], events: [] })).toEqual([]);
  });

  it("creates welcome and upcoming announcements with formatted event details", () => {
    const nextEvent = {
      id: 5,
      title: "Practice Night",
      start_time: "2026-04-01T18:45:00.000Z",
      tag_data: { id: 12 },
    };

    const announcements = getSeedAnnouncements({
      id: 7,
      name: "Chess Society",
      bio: "We play chess every week.",
      announcements: [],
      events: [nextEvent],
    });

    expect(announcements).toHaveLength(2);
    expect(announcements[0]).toEqual(expect.objectContaining({
      id: "seed-welcome-7",
      title: "Welcome to Chess Society",
      content: expect.stringContaining("We play chess every week."),
      pinned: true,
      created_at: "2026-03-28T12:00:00.000Z",
      updated_at: "2026-03-28T12:00:00.000Z",
    }));
    expect(announcements[1]).toEqual(expect.objectContaining({
      id: "seed-up-next-7",
      event_id: 5,
      tag: 12,
      created_at: "2026-03-28T10:30:00.000Z",
      updated_at: "2026-03-28T10:30:00.000Z",
    }));
    expect(announcements[1].content).toContain(
      `Practice Night is next on the schedule for ${formatExpectedDate(nextEvent.start_time)}`,
    );
  });

  it("falls back to default copy when the event date is invalid or the bio is blank", () => {
    const announcements = getSeedAnnouncements({
      id: 2,
      name: "Debate Club",
      bio: "",
      announcements: [],
      events: [{ id: 6, title: "Mixer", start_time: "not-a-date", tag: 9 }],
    });

    expect(announcements[0].content).toContain("This society is getting ready for the term.");
    expect(announcements[1].content).toContain("The next session is being finalised now.");
    expect(announcements[1]).toEqual(expect.objectContaining({ event_id: 6, tag: 9 }));
  });

  it("uses the society tag as a fallback when the next event has no tag data", () => {
    const announcements = getSeedAnnouncements({
      id: 3,
      name: "Art Club",
      bio: "Sketch nights every week.",
      announcements: [],
      tags: [{ id: 42, label: "Creative" }],
      events: [null, { id: 7, title: "Unused" }],
    });

    expect(announcements[1]).toEqual(expect.objectContaining({ event_id: null, tag: 42 }));
  });

  it("falls back to a null tag when there is bio but no event tag source", () => {
    const announcements = getSeedAnnouncements({
      id: 4,
      name: "Film Club",
      bio: "Weekly watch-alongs incoming.",
      announcements: [],
      events: null,
      tags: [],
    });

    expect(announcements[1]).toEqual(expect.objectContaining({ event_id: null, tag: null }));
  });
});
