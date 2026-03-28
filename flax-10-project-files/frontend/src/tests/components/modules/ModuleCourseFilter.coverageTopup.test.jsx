import { describe, it, expect, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import ModuleCourseFilter from "../../../components/modules/modules/ModuleCourseFilter";

const useClickOutsideMock = vi.fn();

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => {
      const rest = { ...props };
      delete rest.initial;
      delete rest.animate;
      delete rest.exit;
      delete rest.transition;
      return <div {...rest}>{children}</div>;
    },
  },
}));

vi.mock("../../../components/common/search_bar/SearchBar", () => ({
  default: ({ value, onChange, placeholder }) => (
    <input
      aria-label={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

vi.mock("../../../components/common/search_empty_state/SearchEmptyState", () => ({
  default: ({ query, itemLabel }) => <div>{`No ${itemLabel} match "${query}"`}</div>,
}));

vi.mock("../../../components/common/hooks/useClickOutside", () => ({
  useClickOutside: (...args) => useClickOutsideMock(...args),
}));

vi.mock("../../../lib/kclCourses", () => ({
  KCL_DEPARTMENTS: {
    Engineering: [
      "Mechanical Engineering",
      "Electrical Engineering",
      "Civil Engineering",
      "Chemical Engineering",
      "Aerospace Engineering",
      "Biomedical Engineering",
    ],
    Arts: ["Fine Art"],
  },
}));

describe("ModuleCourseFilter coverage top-up", () => {
  it("keeps every course in a department when the query matches the department name", async () => {
    useClickOutsideMock.mockClear();
    render(<ModuleCourseFilter selectedCourses={[]} onToggleCourse={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /filter/i }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "engineering" } });

    await waitFor(() => {
      expect(screen.getByText("Mechanical Engineering")).toBeInTheDocument();
    });

    expect(screen.getByText("Biomedical Engineering")).toBeInTheDocument();
    expect(screen.queryByText("Fine Art")).not.toBeInTheDocument();
  });

  it("registers a click-outside handler that closes the dropdown", async () => {
    useClickOutsideMock.mockClear();
    render(<ModuleCourseFilter selectedCourses={[]} onToggleCourse={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /filter/i }));
    expect(screen.getByRole("textbox")).toBeInTheDocument();

    const outsideHandler = useClickOutsideMock.mock.calls[0][1];
    act(() => {
      outsideHandler();
    });

    await waitFor(() => {
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });
  });
});
