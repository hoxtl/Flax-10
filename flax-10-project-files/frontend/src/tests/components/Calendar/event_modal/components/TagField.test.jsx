import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const useTagsMock = vi.fn();
const tagsSelectorSpy = vi.fn();

vi.mock("../../../../../context/TagContext", () => ({
  useTags: () => useTagsMock(),
}));

vi.mock("../../../../../components/common/tags_selector/TagsSelector", () => ({
  TagsSelector: (props) => {
    tagsSelectorSpy(props);
    return (
      <div>
        <button type="button" onClick={() => props.onSelectionChange([{ id: "2", label: "Study" }])}>
          choose-study
        </button>
        <button type="button" onClick={() => props.onSelectionChange([])}>
          clear-tags
        </button>
      </div>
    );
  },
}));

vi.mock("../../../../../components/tags/TagManagerModal", () => ({
  default: ({ onClose }) => (
    <button type="button" onClick={onClose}>
      close-manager
    </button>
  ),
}));

import { TagField } from "../../../../../components/calendar/event_modal/components/TagField";

describe("TagField", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTagsMock.mockReturnValue({
      tags: [
        { id: "10", label: "Lecture" },
        { id: "11", label: "Workshop" },
      ],
    });
  });

  it("deduplicates custom tags correctly", () => {
    render(
      <TagField
        value="2"
        onChange={vi.fn()}
        customTags={[
          { id: "1", label: "Study" },
          { id: "2", label: "study" },
          { id: "3", label: "Meeting" },
        ]}
      />,
    );
    const selectorProps = tagsSelectorSpy.mock.calls.at(-1)[0];
    expect(selectorProps.tags).toEqual([
      { id: "2", label: "study" },
      { id: "3", label: "Meeting" },
    ]);
    expect(selectorProps.selectedTags).toEqual([{ id: "2", label: "study" }]);
  });

  it("handles tag selection changes", () => {
    const onChange = vi.fn();
    render(<TagField value="" onChange={onChange} />);

    fireEvent.click(screen.getByText("choose-study"));
    expect(onChange).toHaveBeenCalledWith({ target: { value: "2" } });

    fireEvent.click(screen.getByText("clear-tags"));
    expect(onChange).toHaveBeenCalledWith({ target: { value: "" } });
  });

  it("toggles the tag manager modal", () => {
    render(<TagField value="" onChange={vi.fn()} />);

    fireEvent.click(screen.getByText("Manage tags…"));
    expect(screen.getByText("close-manager")).toBeInTheDocument();

    fireEvent.click(screen.getByText("close-manager"));
    expect(screen.queryByText("close-manager")).not.toBeInTheDocument();
  });

  it("falls back to global tags when custom tags are not provided", () => {
    render(<TagField value="11" onChange={vi.fn()} />);

    const selectorProps = tagsSelectorSpy.mock.calls.at(-1)[0];
    expect(selectorProps.tags).toEqual([
      { id: "10", label: "Lecture" },
      { id: "11", label: "Workshop" },
    ]);
    expect(selectorProps.selectedTags).toEqual([{ id: "11", label: "Workshop" }]);
  });

  it("falls back to an empty list when global tags are unavailable", () => {
    useTagsMock.mockReturnValue({});

    render(<TagField value="" onChange={vi.fn()} />);

    const selectorProps = tagsSelectorSpy.mock.calls.at(-1)[0];
    expect(selectorProps.tags).toEqual([]);
    expect(selectorProps.selectedTags).toEqual([]);
  });
});
