import { describe, expect, it } from "vitest";
import {
  getItemClassName,
  getMenuClassName,
  getOptionLabel,
  getOptionState,
  getSelectedValues,
  getTriggerLabel,
  normalizeOption,
  toggleSelectedValue,
} from "../../../../components/ui/multi_select_dropdown/multiSelectDropdownUtils";

describe("multiSelectDropdownUtils", () => {
  it("normalizes string options into value/label objects", () => {
    expect(normalizeOption("A")).toEqual({ value: "A", label: "A" });
    expect(normalizeOption({ value: "v", label: "L" })).toEqual({ value: "v", label: "L" });
  });

  it("coerces selection values to arrays", () => {
    expect(getSelectedValues(["a"])).toEqual(["a"]);
    expect(getSelectedValues(undefined)).toEqual([]);
    expect(getSelectedValues(null)).toEqual([]);
  });

  it("resolves option labels with a fallback", () => {
    const options = [{ value: "x", label: "X" }];
    expect(getOptionLabel(options, "x", "fb")).toBe("X");
    expect(getOptionLabel(options, "missing", "fb")).toBe("fb");
  });

  it("formats trigger labels for empty, single, and multi selections", () => {
    const options = [{ value: "a", label: "Alpha" }];
    expect(getTriggerLabel([], options, "Pick", "items")).toBe("Pick");
    expect(getTriggerLabel(["a"], options, "Pick", "items")).toBe("Alpha");
    expect(getTriggerLabel(["a", "b"], options, "Pick", "items")).toBe("2 items");
  });

  it("toggles membership and clears when the sentinel value is used", () => {
    const set = new Set(["a"]);
    expect(toggleSelectedValue(["a"], set, "")).toEqual([]);
    expect(toggleSelectedValue(["a"], set, "a")).toEqual([]);
    expect(toggleSelectedValue(["a"], set, "b")).toEqual(["a", "b"]);
  });

  it("builds menu class names for alignment, pills, modules, and extras", () => {
    const base = getMenuClassName("left", "", false, "default");
    expect(base.length).toBeGreaterThan(0);
    const right = getMenuClassName("right", "extra", true, "modules");
    expect(right).toContain("extra");
  });

  it("derives per-option checkbox and active state", () => {
    const hide = ["x"];
    expect(getOptionState("x", [], new Set(), hide).hideCheckbox).toBe(true);
    expect(getOptionState("", [], new Set(), []).isActive).toBe(true);
    expect(getOptionState("", ["a"], new Set(["a"]), []).isActive).toBe(false);
    expect(getOptionState("a", ["a"], new Set(["a"]), []).isActive).toBe(true);
  });

  it("composes item classes for inactive rows", () => {
    const cls = getItemClassName({
      activeItemClassName: "act",
      hideCheckbox: false,
      isActive: false,
      isModuleVariant: false,
      itemClassName: "item",
      optionsAsPills: false,
    });
    expect(cls).toContain("item");
    expect(cls).not.toContain("act");
  });

  it("adds pill active styling when pills are active", () => {
    const cls = getItemClassName({
      activeItemClassName: "act",
      hideCheckbox: false,
      isActive: true,
      isModuleVariant: false,
      itemClassName: "",
      optionsAsPills: true,
    });
    expect(cls).toContain("act");
  });

  it("adds module active and manage classes for module rows", () => {
    const active = getItemClassName({
      activeItemClassName: "act",
      hideCheckbox: false,
      isActive: true,
      isModuleVariant: true,
      itemClassName: "",
      optionsAsPills: false,
    });
    expect(active).toContain("act");
    const manage = getItemClassName({
      activeItemClassName: "",
      hideCheckbox: true,
      isActive: true,
      isModuleVariant: true,
      itemClassName: "",
      optionsAsPills: false,
    });
    expect(manage.length).toBeGreaterThan(0);
  });

  it("uses default item active styling outside pill and module modes", () => {
    const cls = getItemClassName({
      activeItemClassName: "act",
      hideCheckbox: false,
      isActive: true,
      isModuleVariant: false,
      itemClassName: "",
      optionsAsPills: false,
    });
    expect(cls).toContain("act");
  });
});
