import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { TagsSelector } from "../../../components/common/TagsSelector/TagsSelector";

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

describe("TagsSelector", () => {
  const tags = [
    { id: 1, label: "Lecture" },
    { id: 2, label: "Lab" },
  ];

  beforeEach(() => {
    Element.prototype.scrollTo = vi.fn();
  });

  it("shows the empty hint when no tags are selected", () => {
    render(<TagsSelector tags={tags} selectedTags={[]} onSelectionChange={vi.fn()} emptyHint="Nothing selected" />);
    expect(screen.getByText("Nothing selected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lecture" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lab" })).toBeInTheDocument();
  });

  it("adds a tag and removes a selected tag", () => {
    const onSelectionChange = vi.fn();

    render(
      <TagsSelector
        tags={tags}
        selectedTags={[tags[0]]}
        onSelectionChange={onSelectionChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Lab" }));
    expect(onSelectionChange).toHaveBeenCalledWith([tags[0], tags[1]]);

    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(onSelectionChange).toHaveBeenCalledWith([]);
  });

  it("hides the available pills row when every tag is selected", () => {
    render(<TagsSelector tags={tags} selectedTags={tags} onSelectionChange={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Lecture" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lab" })).not.toBeInTheDocument();
  });

  it("uses the built-in empty hint and fallback scrolling when scrollTo is unavailable", () => {
    delete Element.prototype.scrollTo;
    Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
      configurable: true,
      get: () => 180,
    });

    render(<TagsSelector onSelectionChange={vi.fn()} />);

    expect(screen.getByText("Select tags to filter…")).toBeInTheDocument();
  });
});
