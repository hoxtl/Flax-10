/*
 * Tests for the multi-select dropdown view shell.
 */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: new Proxy(
    {},
    {
      get: (_, tag) => {
        const Tag = typeof tag === "string" ? tag : "div";
        return ({ children, ...rest }) => <Tag {...rest}>{children}</Tag>;
      },
    },
  ),
}));

vi.mock("../../../components/ui/multi_select_dropdown/MultiSelectDropdownTrigger", () => ({
  MultiSelectDropdownTrigger: () => <div data-testid="mst-trigger" />,
}));

vi.mock("../../../components/ui/multi_select_dropdown/MultiSelectDropdownMenu", () => ({
  MultiSelectDropdownMenu: () => <div data-testid="mst-menu" />,
}));

import { MultiSelectDropdownView } from "../../../components/ui/multi_select_dropdown/MultiSelectDropdownView";

const baseDropdownProps = {
  activeItemClassName: "",
  align: "left",
  className: "wrap",
  customTrigger: null,
  displayAsPills: false,
  hideCheckboxForValues: [],
  isModuleVariant: false,
  itemClassName: "",
  menuClassName: "",
  menuOpen: false,
  optionsAsPills: false,
  optionsList: [],
  placeholder: "Pick",
  selected: [],
  selectedSet: new Set(),
  showCheckboxes: true,
  triggerLabel: "Pick",
  variant: "default",
};

const baseProps = () => ({
  ...baseDropdownProps,
  hoverHandlers: { onMouseEnter: vi.fn(), onMouseLeave: vi.fn() },
  onRemovePill: vi.fn(),
  onToggle: vi.fn(),
  rootRef: vi.fn(),
  updateOpen: vi.fn(),
});

describe("MultiSelectDropdownView", () => {
  it("mounts trigger and menu regions with hover wiring", () => {
    const props = baseProps();
    const refCb = vi.fn();
    render(<MultiSelectDropdownView {...props} rootRef={refCb} />);
    expect(screen.getByTestId("mst-trigger")).toBeInTheDocument();
    expect(screen.getByTestId("mst-menu")).toBeInTheDocument();
    const root = document.querySelector(".wrap");
    fireEvent.mouseEnter(root);
    fireEvent.mouseLeave(root);
    expect(props.hoverHandlers.onMouseEnter).toHaveBeenCalled();
    expect(props.hoverHandlers.onMouseLeave).toHaveBeenCalled();
    expect(refCb).toHaveBeenCalled();
  });
});
