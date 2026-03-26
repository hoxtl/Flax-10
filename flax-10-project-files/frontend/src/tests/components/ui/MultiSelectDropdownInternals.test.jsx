/**
 * Covers internal dropdown trigger, menu, and interaction hooks.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, renderHook, screen } from "@testing-library/react";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: new Proxy(
    {},
    {
      get: (_, tag) => {
        const Tag = typeof tag === "string" ? tag : "div";
        return ({ children, ...props }) => {
          const { animate: _animate, exit: _exit, initial: _initial, transition: _transition, whileTap: _whileTap, ...rest } = props;
          return <Tag {...rest}>{children}</Tag>;
        };
      },
    },
  ),
}));

import { MultiSelectDropdownTrigger } from "../../../components/ui/multi_select_dropdown/MultiSelectDropdownTrigger";
import { MultiSelectDropdownMenu } from "../../../components/ui/multi_select_dropdown/MultiSelectDropdownMenu";
import {
  createHoverHandlers,
  useCloseOnOutsideClick,
  useDropdownHoverTimeout,
  useDropdownRootRef,
} from "../../../components/ui/multi_select_dropdown/useDropdownInteractions";

const buildTriggerProps = (overrides = {}) => ({
  customTrigger: null,
  displayAsPills: false,
  isOpen: false,
  onRemovePill: vi.fn(),
  options: [],
  placeholder: "Pick",
  selected: [],
  triggerLabel: "Pick",
  updateOpen: vi.fn(),
  ...overrides,
});

const renderTrigger = (overrides = {}) => {
  const props = buildTriggerProps(overrides);
  const utils = render(<MultiSelectDropdownTrigger {...props} />);
  const rerenderTrigger = (next) => {
    Object.assign(props, next);
    utils.rerender(<MultiSelectDropdownTrigger {...props} />);
  };
  return { ...utils, props, rerenderTrigger };
};

const menuBaseProps = {
  activeItemClassName: "",
  align: "left",
  hideCheckboxForValues: [],
  isModuleVariant: false,
  isOpen: true,
  itemClassName: "",
  menuClassName: "",
  options: [{ label: "Alpha", value: "alpha" }],
  optionsAsPills: false,
  selected: ["alpha"],
  selectedSet: new Set(["alpha"]),
  showCheckboxes: true,
  variant: "default",
};

const buildMenuProps = (overrides = {}) => ({
  ...menuBaseProps,
  onToggle: vi.fn(),
  ...overrides,
});

const renderMenu = (overrides = {}) => {
  const props = buildMenuProps(overrides);
  const utils = render(<MultiSelectDropdownMenu {...props} />);
  const rerenderMenu = (next) => {
    Object.assign(props, next);
    utils.rerender(<MultiSelectDropdownMenu {...props} />);
  };
  return { ...utils, props, rerenderMenu };
};

function OutsideClickHarness({ isOpen, updateOpen }) {
  const rootRef = useDropdownRootRef();
  useCloseOnOutsideClick(isOpen, rootRef, updateOpen);

  return (
    <div>
      <div ref={rootRef} data-testid="inside">
        inside
      </div>
      <div data-testid="outside">outside</div>
    </div>
  );
}

describe("MultiSelectDropdown internals", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates stable refs for the dropdown root and hover timeout", () => {
    const { result } = renderHook(() => ({
      hoverTimeoutRef: useDropdownHoverTimeout(),
      rootRef: useDropdownRootRef(),
    }));

    expect(result.current.rootRef.current).toBe(null);
    expect(result.current.hoverTimeoutRef.current).toBe(null);
  });

  it("opens and closes on hover only when hover mode is enabled", () => {
    vi.useFakeTimers();
    const updateOpen = vi.fn();
    const hoverTimeoutRef = { current: null };

    const disabledHandlers = createHoverHandlers(false, hoverTimeoutRef, updateOpen);
    disabledHandlers.onMouseEnter();
    disabledHandlers.onMouseLeave();
    expect(updateOpen).not.toHaveBeenCalled();

    const enabledHandlers = createHoverHandlers(true, hoverTimeoutRef, updateOpen);
    enabledHandlers.onMouseEnter();
    expect(updateOpen).toHaveBeenCalledWith(true);

    enabledHandlers.onMouseLeave();
    vi.advanceTimersByTime(140);
    expect(updateOpen).toHaveBeenLastCalledWith(false);
  });

  it("closes on outside clicks only while open", () => {
    const closedSpy = vi.fn();
    const { rerender } = render(<OutsideClickHarness isOpen={false} updateOpen={closedSpy} />);

    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(closedSpy).not.toHaveBeenCalled();

    const openSpy = vi.fn();
    rerender(<OutsideClickHarness isOpen updateOpen={openSpy} />);

    fireEvent.mouseDown(screen.getByTestId("inside"));
    expect(openSpy).not.toHaveBeenCalled();

    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(openSpy).toHaveBeenCalledWith(false);
  });

  it("opens a custom trigger when clicked", () => {
    const { props } = renderTrigger({ customTrigger: <span>Custom trigger</span> });
    fireEvent.click(screen.getByText("Custom trigger"));
    expect(props.updateOpen).toHaveBeenCalledWith(expect.any(Function));
  });

  it("toggles the default trigger button", () => {
    const { props } = renderTrigger();
    fireEvent.click(screen.getByRole("button", { name: /pick/i }));
    expect(props.updateOpen).toHaveBeenCalledTimes(1);
  });

  it("handles pill trigger keyboard and removal interactions", () => {
    const { props, rerenderTrigger } = renderTrigger({
      displayAsPills: true,
      options: [{ label: "Alpha", value: "alpha" }],
      selected: ["alpha"],
    });
    rerenderTrigger({ displayAsPills: true });
    fireEvent.keyDown(document.querySelector('[aria-haspopup="listbox"]'), { key: "Escape", preventDefault: vi.fn() });
    fireEvent.click(screen.getByText("Alpha"));
    fireEvent.click(screen.getByLabelText("Remove Alpha"));
    expect(props.updateOpen).not.toHaveBeenCalled();
    expect(props.onRemovePill).toHaveBeenCalledWith("alpha");
  });

  it("toggles checkbox selections inside the menu", () => {
    const { props } = renderMenu();
    fireEvent.click(screen.getByText("Alpha"));
    expect(props.onToggle).toHaveBeenCalledWith("alpha");
    expect(document.querySelector('input[type="checkbox"]')).toBeTruthy();
  });

  it("shows the trailing check icon when checkboxes are hidden", () => {
    const { rerenderMenu } = renderMenu();
    rerenderMenu({ showCheckboxes: false });
    expect(document.querySelector("svg.lucide-check")).toBeTruthy();
  });
});
