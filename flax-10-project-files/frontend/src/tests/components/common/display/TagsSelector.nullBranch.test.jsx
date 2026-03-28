import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useEffect: (effect) => effect(),
    useRef: () => ({ current: null }),
  };
});

vi.mock("framer-motion", () => ({
  motion: new Proxy({}, {
    get: (_, tag) => ({ children, ...props }) => {
      const Tag = typeof tag === "string" ? tag : "div";
      const rest = { ...props };
      delete rest.layoutId;
      delete rest.initial;
      delete rest.animate;
      delete rest.exit;
      delete rest.transition;
      delete rest.layout;
      return <Tag {...rest}>{children}</Tag>;
    },
  }),
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock("lucide-react", () => ({
  X: () => <svg aria-hidden="true" />,
}));

import { TagsSelector } from "../../../../components/common/tags_selector/TagsSelector";

describe("TagsSelector null branch coverage", () => {
  it("handles a null ref current without attempting the scroll fallback", () => {
    render(
      <TagsSelector
        tags={[{ id: 1, label: "Lecture" }]}
        selectedTags={[]}
        onSelectionChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Select tags to filter…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lecture" })).toBeInTheDocument();
  });
});
