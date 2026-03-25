import React from "react";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockTags = vi.hoisted(() => ({
  useTags: vi.fn(() => ({
    tags: [
      { id: 1, label: "Lecture" },
      { id: 2, label: "Seminar" },
    ],
  })),
}));

vi.mock("../../../../context/TagContext", () => ({
  useTags: (...args) => mockTags.useTags(...args),
}));

vi.mock("lucide-react", () => ({
  Search: () => <span>search-icon</span>,
  X: () => <span>x-icon</span>,
}));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

vi.mock("../../../../components/common/SearchBar/SearchBar", () => ({
  default: ({ value, onChange, onBlur, placeholder }) => (
    <input
      aria-label={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
    />
  ),
}));

import { SearchButton } from "../../../../components/Calendar/header/SearchButton";
import { useFilterDropdownState } from "../../../../components/Calendar/header/useFilterDropdownState";
import styles from "../../../../components/Calendar/header/CalendarHeaderUtils.module.css";

describe("SearchButton and filter state extras", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("requestAnimationFrame", (callback) => {
      callback();
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("keeps search open on blur when a value exists and focuses the input after expansion", () => {
    const onChange = vi.fn();
    render(<SearchButton value="seminar" onChange={onChange} />);

    fireEvent.click(screen.getByLabelText("Search events"));
    act(() => {
      vi.advanceTimersByTime(130);
    });

    const input = screen.getByLabelText("Search events...");
    expect(document.activeElement).toBe(input);

    fireEvent.blur(input);
    expect(screen.getByLabelText("Search events...")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Close search"));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("closes search without clearing when the current value is empty", () => {
    const onChange = vi.fn();
    render(<SearchButton value="" onChange={onChange} />);

    fireEvent.click(screen.getByLabelText("Search events"));
    expect(screen.getByLabelText("Search events...")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Close search"));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Search events")).toBeInTheDocument();
  });

  it("normalizes active values, computes popup shift, supports mobile mode, and closes outside", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useFilterDropdownState([[" Lecture ", "all"], ["Seminar"]], true, true, onChange),
    );

    expect(result.current.activeCount).toBe(0);
    expect(result.current.onMouseEnter).toBeUndefined();
    expect(result.current.onMouseLeave).toBeUndefined();

    const wrap = document.createElement("div");
    const popup = document.createElement("div");
    popup.className = styles.filterPopup;
    popup.getBoundingClientRect = () => ({ left: -16, right: 80 });
    wrap.appendChild(popup);
    result.current.wrapRef.current = wrap;

    act(() => {
      result.current.onToggle();
    });

    expect(result.current.popupProps.shift).toBe(24);

    act(() => {
      result.current.popupProps.onSelectionChange([{ id: "seminar" }]);
    });
    expect(onChange).toHaveBeenCalledWith(["seminar"]);

    act(() => {
      document.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });
    expect(result.current.isOpen).toBe(false);
  });

  it("deduplicates tags, handles viewport overflow, hover delays, and manage-tags selection mapping", () => {
    mockTags.useTags.mockReturnValueOnce({
      tags: [
        { id: 1, label: "Lecture" },
        { id: 2, label: "Lecture" },
        { id: 3, label: "Workshop" },
      ],
    });

    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useFilterDropdownState("workshop", true, false, onChange),
    );

    expect(result.current.activeCount).toBe(1);
    expect(result.current.popupProps.selectedTags).toEqual([{ id: "workshop", label: "Workshop" }]);
    expect(result.current.popupProps.tags).toEqual([
      { id: "lecture", label: "Lecture" },
      { id: "workshop", label: "Workshop" },
    ]);

    const wrap = document.createElement("div");
    const popup = document.createElement("div");
    popup.className = styles.filterPopup;
    popup.getBoundingClientRect = () => ({ left: 20, right: window.innerWidth + 20 });
    wrap.appendChild(popup);
    result.current.wrapRef.current = wrap;

    act(() => {
      result.current.onMouseEnter();
    });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.popupProps.shift).toBe(-28);

    act(() => {
      result.current.onMouseLeave();
      vi.advanceTimersByTime(160);
    });
    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.onToggle();
      result.current.popupProps.onManageTags();
    });
    expect(result.current.showManager).toBe(true);

    act(() => {
      result.current.popupProps.onSelectionChange([]);
    });
    expect(onChange).toHaveBeenCalledWith("all");

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
  });

  it("covers null-tag and zero-shift fallbacks, plus manager close handling", () => {
    mockTags.useTags.mockReturnValueOnce({ tags: null });

    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useFilterDropdownState("all", false, false, onChange),
    );

    expect(result.current.activeCount).toBe(0);
    expect(result.current.popupProps.tags).toEqual([]);

    act(() => {
      result.current.onToggle();
    });

    expect(result.current.popupProps.shift).toBe(0);

    const wrap = document.createElement("div");
    const popup = document.createElement("div");
    popup.className = styles.filterPopup;
    popup.getBoundingClientRect = () => ({ left: 20, right: 120 });
    wrap.appendChild(popup);
    result.current.wrapRef.current = wrap;

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(result.current.popupProps.shift).toBe(0);

    act(() => {
      result.current.popupProps.onManageTags();
    });
    expect(result.current.showManager).toBe(true);

    act(() => {
      result.current.onCloseManager();
    });
    expect(result.current.showManager).toBe(false);
  });
});
