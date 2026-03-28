import { describe, expect, it } from "vitest";

import {
  SOCIETY_SHARED_TRANSITION,
  getPrimarySocietyImage,
  getSocietyHeroLayoutId,
  getSocietyImages,
  getSocietyTitleLayoutId,
} from "../../../../components/society/utils/societyMotion";

describe("societyMotion", () => {
  it("normalises, trims, and deduplicates society images", () => {
    expect(getSocietyImages({
      cover_image: " https://example.com/cover.jpg ",
      image: "https://example.com/cover.jpg",
      images: [" https://example.com/gallery-1.jpg ", { url: "https://example.com/gallery-2.jpg" }],
    })).toEqual([
      "https://example.com/cover.jpg",
      "https://example.com/gallery-1.jpg",
      "https://example.com/gallery-2.jpg",
    ]);
  });

  it("ignores falsy image inputs and falls back to an empty primary image", () => {
    expect(getSocietyImages({
      cover_image: null,
      image: undefined,
      images: [null, "", "   ", { url: null }, { foo: "bar" }],
    })).toEqual([]);
    expect(getPrimarySocietyImage({ images: [{ url: "" }] })).toBe("");
  });

  it("exposes the shared transition and builds layout ids with unknown fallbacks", () => {
    expect(SOCIETY_SHARED_TRANSITION).toEqual({
      duration: 0.28,
      ease: [0.22, 1, 0.36, 1],
    });
    expect(getSocietyHeroLayoutId(17)).toBe("society-hero-17");
    expect(getSocietyHeroLayoutId(undefined)).toBe("society-hero-unknown");
    expect(getSocietyTitleLayoutId("chess")).toBe("society-title-chess");
    expect(getSocietyTitleLayoutId(null)).toBe("society-title-unknown");
  });
});
