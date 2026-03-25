import { describe, expect, it } from "vitest";

import {
  getResolvedUserPhoto,
  getTutorPhotoFallback,
} from "../../utils/tutorPhotoFallback";

describe("tutorPhotoFallback", () => {
  it("returns fixed photos for known usernames and names", () => {
    expect(getTutorPhotoFallback({ username: "johndoe" })).toContain("photo-1568602471122-7832951cc4c5");
    expect(getTutorPhotoFallback({ fullName: "Jane Doe" })).toContain("photo-1534528741775-53994a69daeb");
  });

  it("returns null for unknown users when generic fallbacks are disabled", () => {
    expect(getTutorPhotoFallback()).toBeNull();
    expect(getTutorPhotoFallback({ fullName: "Mystery Person", username: "mystery" })).toBeNull();
  });

  it("builds teacher fallbacks from inferred gender", () => {
    expect(
      getTutorPhotoFallback({ fullName: "John Example", role: "teacher", seed: "teacher-male", allowGeneric: true }),
    ).toContain("randomuser.me/api/portraits/men/");

    expect(
      getTutorPhotoFallback({ fullName: "Sarah Example", role: "teacher", seed: "teacher-female", allowGeneric: true }),
    ).toContain("randomuser.me/api/portraits/women/");

    expect(
      getTutorPhotoFallback({ fullName: "Mystery Person", role: "teacher", seed: "teacher-unknown", allowGeneric: true }),
    ).toContain("i.pravatar.cc/96?img=");
  });

  it("builds deterministic student fallbacks for avatar and non-human seeds", () => {
    expect(
      getTutorPhotoFallback({ role: "student", seed: "a", allowGeneric: true }),
    ).toContain("i.pravatar.cc/96?img=");

    expect(
      getTutorPhotoFallback({ role: "student", seed: "d", allowGeneric: true }),
    ).toContain("robohash.org/d?set=set4&size=96x96");
  });

  it("prefers direct photos and otherwise resolves a fallback avatar", () => {
    expect(
      getResolvedUserPhoto({ profile_photo_url: "https://example.com/photo.jpg", username: "johndoe" }),
    ).toBe("https://example.com/photo.jpg");

    expect(
      getResolvedUserPhoto(
        { first_name: "Riley", last_name: "Wood", role: "teacher", username: "riley" },
        { allowGeneric: true },
      ),
    ).toContain("robohash.org/riley.wood");

    expect(getResolvedUserPhoto(null)).toBeNull();
  });

  it("covers username, id, and name fallbacks when resolving generic avatars", () => {
    expect(
      getTutorPhotoFallback({ role: "teacher", allowGeneric: true, seed: "", username: "", fullName: "" }),
    ).toContain("i.pravatar.cc/96?img=");

    expect(
      getResolvedUserPhoto({ role: "teacher", user_name: "fallback-user" }, { allowGeneric: true }),
    ).toContain("i.pravatar.cc/96?img=");

    expect(
      getResolvedUserPhoto({ id: 42, role: "teacher" }, { allowGeneric: true }),
    ).toContain("i.pravatar.cc/96?img=");

    expect(
      getResolvedUserPhoto({ first_name: "Mystery", last_name: "Person", role: "teacher" }, { allowGeneric: true }),
    ).toContain("i.pravatar.cc/96?img=");
  });

  it("uses the internal user seed when no generic fallback seed is provided", () => {
    expect(
      getTutorPhotoFallback({ role: "teacher", allowGeneric: true, seed: null, username: "", fullName: "" }),
    ).toContain("i.pravatar.cc/96?img=");
  });

  it("normalises null and titled values before resolving generic teacher avatars", () => {
    expect(
      getTutorPhotoFallback({ fullName: "Dr. Sarah Example", role: "teacher", seed: "teacher-dr", allowGeneric: true }),
    ).toContain("randomuser.me/api/portraits/women/");

    expect(
      getTutorPhotoFallback({ fullName: null, username: null, role: "teacher", seed: "teacher-null", allowGeneric: true }),
    ).toContain("i.pravatar.cc/96?img=");
  });
});
