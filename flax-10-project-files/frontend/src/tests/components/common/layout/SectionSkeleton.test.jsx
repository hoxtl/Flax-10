import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";

import SectionSkeleton from "../../../../components/common/loading_state/SectionSkeleton";

describe("SectionSkeleton", () => {
  it("renders the default skeleton structure", () => {
    const { container } = render(<SectionSkeleton />);

    expect(container.querySelector('[aria-label="Loading section"]')).toBeTruthy();
    expect(container.querySelectorAll('div[class*="row"]').length).toBe(3);
  });

  it("can hide the header and button placeholders", () => {
    const { container } = render(<SectionSkeleton label="Custom section" rows={1} showHeader={false} showButton={false} />);

    expect(container.querySelector('[aria-label="Custom section"]')).toBeTruthy();
    expect(container.querySelector('div[class*="header"]')).toBeNull();
    expect(container.querySelector('div[class*="button"]')).toBeNull();
  });
});
