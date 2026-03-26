import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

vi.mock("lucide-react", () => ({
  Tag: () => <span>tag-icon</span>,
}));

vi.mock("../../../../components/common/tags_selector/TagsSelector", () => ({
  TagsSelector: () => <div data-testid="tags-selector" />,
}));

vi.mock("../../../../components/Tags/TagManagerModal", () => ({
  default: () => <div data-testid="tag-manager-modal" />,
}));

vi.mock("../../../../components/Calendar/header/useFilterDropdownState", () => ({
  useFilterDropdownState: () => ({
    activeCount: 2,
    allowManageTags: true,
    isOpen: true,
    onCloseManager: vi.fn(),
    onMouseEnter: vi.fn(),
    onMouseLeave: vi.fn(),
    onToggle: vi.fn(),
    popupProps: {
      allowManageTags: true,
      onManageTags: vi.fn(),
      onSelectionChange: vi.fn(),
      selectedTags: [],
      shift: 12,
      tags: [{ id: "lecture", label: "Lecture" }],
    },
    showManager: false,
    wrapRef: { current: null },
  }),
}));

import { FilterDropdownButton } from "../../../../components/Calendar/header/FilterDropdownButton";

describe("FilterDropdownButton popup positioning", () => {
  it("applies a right offset when the popup shift is non-zero", () => {
    const { container } = render(<FilterDropdownButton active={["lecture"]} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Filter events").textContent).toContain("2");
    expect(screen.getByText("Filter by tag")).toBeInTheDocument();
    expect(container.querySelector('[style*="right: -12px"]')).toBeTruthy();
  });
});
