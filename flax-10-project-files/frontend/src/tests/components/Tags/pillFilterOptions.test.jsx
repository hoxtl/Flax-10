import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import {
  getUniqueTags,
  createPillFilterOptions,
  getActiveFilterLabel,
} from "../../../components/Tags/pill_filters/pillFilterOptions";
import {
  FilterTriggerButton,
  ManageTagsButton,
} from "../../../components/Tags/pill_filters/PillFilterControls";
import { usePillFilterOptions } from "../../../components/Tags/pill_filters/usePillFilterOptions";

vi.mock("../../../context/TagContext", () => ({
  useTags: vi.fn(() => ({
    tags: [
      { id: 1, label: "Lecture" },
      { id: 2, label: "lecture" },
      { id: 3, label: "Lab" },
    ],
  })),
}));

vi.mock("../../../components/Tags/utils/pillUtils", () => ({
  countByType: vi.fn(() => ({ all: 5, lecture: 3, lab: 2 })),
}));

vi.mock("lucide-react", () => ({
  Filter: () => <svg aria-hidden="true" />,
}));

function HookHarness(props) {
  const value = usePillFilterOptions(props);
  return <div data-testid="result">{JSON.stringify(value)}</div>;
}

describe("pillFilterOptions", () => {
  it("deduplicates tags by lowercase label", () => {
    expect(getUniqueTags([
      { id: 1, label: "Lecture" },
      { id: 2, label: "lecture" },
      { id: 3, label: "Lab" },
    ])).toEqual([
      { id: 2, label: "lecture" },
      { id: 3, label: "Lab" },
    ]);
  });

  it("builds options and resolves the active label", () => {
    const options = createPillFilterOptions(
      [{ id: 1, label: "Lecture" }, { id: 2, label: "Lab" }],
      { all: 4, lecture: 3, lab: 1 }
    );

    expect(options).toEqual([
      { value: "all", label: "All (4)" },
      { value: "lecture", label: "Lecture (3)" },
      { value: "lab", label: "Lab (1)" },
    ]);
    expect(getActiveFilterLabel("lecture", options)).toBe("Lecture (3)");
    expect(getActiveFilterLabel("missing", options)).toBe("Filter");
  });

  it("uses zero counts and empty tags by default", () => {
    expect(getUniqueTags()).toEqual([]);
    expect(createPillFilterOptions([{ id: 1, label: "Workshop" }], {})).toEqual([
      { value: "all", label: "All (0)" },
      { value: "workshop", label: "Workshop (0)" },
    ]);
  });

  it("renders the pill filter controls", () => {
    const onClick = vi.fn();
    render(
      <>
        <FilterTriggerButton label="Choose filters" />
        <ManageTagsButton onClick={onClick} />
      </>
    );

    expect(screen.getByRole("button", { name: /choose filters/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Manage Tags" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("builds memoized hook output from tags and item counts", () => {
    render(<HookHarness active="lab" items={[{ id: 1 }, { id: 2 }]} />);
    expect(screen.getByTestId("result").textContent).toContain('"activeLabel":"Lab (2)"');
    expect(screen.getByTestId("result").textContent).toContain('"value":"lecture"');
  });
});
