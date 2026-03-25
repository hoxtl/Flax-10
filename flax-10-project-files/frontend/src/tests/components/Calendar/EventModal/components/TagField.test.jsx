import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const useTagsMock = vi.fn();
const tagsSelectorSpy = vi.fn();

vi.mock("../../../../../context/TagContext", () => ({
  useTags: () => useTagsMock(),
}));

vi.mock("../../../../../components/common/TagsSelector/TagsSelector", () => ({
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

vi.mock("../../../../../components/Tags/TagManagerModal", () => ({
  default: ({ onClose }) => (
    <button type="button" onClick={onClose}>
      close-manager
    </button>
  ),
}));

import { TagField } from "../../../../../components/Calendar/EventModal/components/TagField";

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

  it("deduplicates custom tags, maps selection changes, and toggles the manager modal", () => {
    const onChange = vi.fn();

    render(
      <TagField
        value="2"
        onChange={onChange}
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

    fireEvent.click(screen.getByText("choose-study"));
    expect(onChange).toHaveBeenCalledWith({ target: { value: "2" } });

    fireEvent.click(screen.getByText("clear-tags"));
    expect(onChange).toHaveBeenCalledWith({ target: { value: "" } });

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
