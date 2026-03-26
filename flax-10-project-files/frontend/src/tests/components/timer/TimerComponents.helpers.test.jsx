import { describe, it, expect, vi } from "vitest";
import { commitInput, formatTime, handleInput, handleKey } from "../../../components/timer/TimerComponents";

describe("TimerComponents helpers", () => {
  it("formats positive and negative values", () => {
    expect(formatTime(65)).toBe("01:05");
    expect(formatTime(-65)).toBe("+01:05");
  });

  it("clamps input values and reports errors", () => {
    const setLocal = vi.fn();
    const onError = vi.fn();

    handleInput({ target: { value: "0" } }, 1, setLocal, onError);
    handleInput({ target: { value: "12" } }, 1, setLocal, onError);

    expect(setLocal).toHaveBeenNthCalledWith(1, 1);
    expect(setLocal).toHaveBeenNthCalledWith(2, "12");
    expect(onError).toHaveBeenNthCalledWith(1, true);
    expect(onError).toHaveBeenNthCalledWith(2, false);
  });

  it("commits changed values and keeps matching values quiet", () => {
    const setLocal = vi.fn();
    const onUpdate = vi.fn();
    const onError = vi.fn();

    commitInput("0", 0, 1, setLocal, onUpdate, onError);
    commitInput("5", 5, 1, setLocal, onUpdate, onError);

    expect(setLocal).toHaveBeenNthCalledWith(1, 1);
    expect(setLocal).toHaveBeenNthCalledWith(2, 5);
    expect(onUpdate).toHaveBeenCalledWith(1);
    expect(onUpdate).not.toHaveBeenCalledWith(5);
    expect(onError).toHaveBeenLastCalledWith(false);
  });

  it("covers key handling branches", () => {
    const onError = vi.fn();
    const blur = vi.fn();
    const preventDefault = vi.fn();

    handleKey({ key: "Enter", target: { blur } }, "1", 1, onError);
    handleKey({ key: "Tab", target: { blur } }, "1", 1, onError);
    handleKey({ key: "ArrowDown", target: { blur }, preventDefault }, "3", 1, onError);
    handleKey({ key: "ArrowDown", target: { blur }, preventDefault }, "", 1, onError);

    expect(blur).toHaveBeenCalledTimes(1);
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(true);
  });
});
