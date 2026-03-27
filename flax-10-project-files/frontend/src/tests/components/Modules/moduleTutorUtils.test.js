import { describe, expect, it, vi } from "vitest";

import {
  getModuleTutorPhoto,
  hideBrokenTutorImage,
} from "../../../components/modules/Modules/moduleTutorUtils";

const getResolvedUserPhotoMock = vi.hoisted(() => vi.fn());

vi.mock("../../../utils/tutorPhotoFallback.js", () => ({
  getResolvedUserPhoto: (...args) => getResolvedUserPhotoMock(...args),
}));

describe("moduleTutorUtils", () => {
  it("builds tutor photo input from module data and enables generic fallback", () => {
    getResolvedUserPhotoMock.mockReturnValue("/photo.png");

    const result = getModuleTutorPhoto({
      created_by: 9,
      created_by_name: "Dr Rivera",
      created_by_username: "rivera9",
      created_by_profile_photo_url: "/photo.png",
    });

    expect(result).toBe("/photo.png");
    expect(getResolvedUserPhotoMock).toHaveBeenCalledWith(
      {
        id: 9,
        name: "Dr Rivera",
        role: "teacher",
        username: "rivera9",
        profile_photo_url: "/photo.png",
        seed: "rivera9",
      },
      { allowGeneric: true },
    );
  });

  it("falls back to id or name when username is missing", () => {
    getResolvedUserPhotoMock.mockReturnValue("/fallback.png");

    getModuleTutorPhoto({ created_by: 14, created_by_name: "Alex" });
    expect(getResolvedUserPhotoMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ seed: 14 }),
      { allowGeneric: true },
    );

    getModuleTutorPhoto({ created_by_name: "Taylor" });
    expect(getResolvedUserPhotoMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ seed: "Taylor" }),
      { allowGeneric: true },
    );
  });

  it("hides a broken image and reveals the fallback sibling", () => {
    const fallback = { style: { display: "none" } };
    const event = {
      currentTarget: {
        style: { display: "block" },
        nextElementSibling: fallback,
      },
    };

    hideBrokenTutorImage(event);

    expect(event.currentTarget.style.display).toBe("none");
    expect(fallback.style.display).toBe("flex");
  });

  it("uses a custom fallback display and tolerates missing sibling fallback", () => {
    const event = {
      currentTarget: {
        style: { display: "block" },
        nextElementSibling: null,
      },
    };

    expect(() => hideBrokenTutorImage(event, "inline-flex")).not.toThrow();
    expect(event.currentTarget.style.display).toBe("none");
  });
});
