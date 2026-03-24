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

import { MultiSelectDropdownTrigger } from "../../../components/UI/multi-select-dropdown/MultiSelectDropdownTrigger";
import { MultiSelectDropdownMenu } from "../../../components/UI/multi-select-dropdown/MultiSelectDropdownMenu";
import {
  createHoverHandlers,
  useCloseOnOutsideClick,
  useDropdownHoverTimeout,
  useDropdownRootRef,
} from "../../../components/UI/multi-select-dropdown/useDropdownInteractions";

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

  it("renders custom, default, and pills triggers with their interaction branches", () => {
    const updateOpen = vi.fn();
    const onRemovePill = vi.fn();

    const { rerender } = render(
      <MultiSelectDropdownTrigger
        customTrigger={<span>Custom trigger</span>}
        isOpen={false}
        onRemovePill={onRemovePill}
        options={[]}
        placeholder="Pick"
        selected={[]}
        triggerLabel="Pick"
        updateOpen={updateOpen}
      />,
    );

    fireEvent.click(screen.getByText("Custom trigger"));
    expect(updateOpen).toHaveBeenCalledWith(expect.any(Function));

    rerender(
      <MultiSelectDropdownTrigger
        isOpen={false}
        onRemovePill={onRemovePill}
        options={[]}
        placeholder="Pick"
        selected={[]}
        triggerLabel="Pick"
        updateOpen={updateOpen}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /pick/i }));
    expect(updateOpen).toHaveBeenCalledTimes(2);

    rerender(
      <MultiSelectDropdownTrigger
        displayAsPills
        isOpen={false}
        onRemovePill={onRemovePill}
        options={[{ label: "Alpha", value: "alpha" }]}
        placeholder="Pick"
        selected={["alpha"]}
        triggerLabel="Pick"
        updateOpen={updateOpen}
      />,
    );

    fireEvent.keyDown(document.querySelector('[aria-haspopup="listbox"]'), { key: "Escape", preventDefault: vi.fn() });
    expect(updateOpen).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByText("Alpha"));
    expect(updateOpen).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByLabelText("Remove Alpha"));
    expect(onRemovePill).toHaveBeenCalledWith("alpha");
  });

  it("renders leading and trailing selection icons in the menu", () => {
    const onToggle = vi.fn();
    const option = { label: "Alpha", value: "alpha" };
    const { rerender } = render(
      <MultiSelectDropdownMenu
        activeItemClassName=""
        align="left"
        hideCheckboxForValues={[]}
        isModuleVariant={false}
        isOpen
        itemClassName=""
        menuClassName=""
        onToggle={onToggle}
        options={[option]}
        optionsAsPills={false}
        selected={["alpha"]}
        selectedSet={new Set(["alpha"])}
        showCheckboxes
        variant="default"
      />,
    );

    fireEvent.click(screen.getByText("Alpha"));
    expect(onToggle).toHaveBeenCalledWith("alpha");
    expect(document.querySelector('input[type="checkbox"]')).toBeTruthy();

    rerender(
      <MultiSelectDropdownMenu
        activeItemClassName=""
        align="left"
        hideCheckboxForValues={[]}
        isModuleVariant={false}
        isOpen
        itemClassName=""
        menuClassName=""
        onToggle={onToggle}
        options={[option]}
        optionsAsPills={false}
        selected={["alpha"]}
        selectedSet={new Set(["alpha"])}
        showCheckboxes={false}
        variant="default"
      />,
    );

    expect(document.querySelector('svg.lucide-check')).toBeTruthy();
  });
});
