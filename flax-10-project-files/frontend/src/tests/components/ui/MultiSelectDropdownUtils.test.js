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
} from "../../../components/ui/multi_select_dropdown/multiSelectDropdownUtils";

describe("multiSelectDropdownUtils", () => {
  it("normalizes string options and preserves object options", () => {
    expect(normalizeOption("Alpha")).toEqual({ value: "Alpha", label: "Alpha" });
    expect(normalizeOption({ value: "a", label: "Alpha" })).toEqual({ value: "a", label: "Alpha" });
  });

  it("returns selected values only for arrays", () => {
    expect(getSelectedValues(["a"])).toEqual(["a"]);
    expect(getSelectedValues("a")).toEqual([]);
    expect(getSelectedValues(null)).toEqual([]);
  });

  it("resolves option labels and falls back when missing", () => {
    const options = [{ value: "a", label: "Alpha" }];
    expect(getOptionLabel(options, "a", "Fallback")).toBe("Alpha");
    expect(getOptionLabel(options, "b", "Fallback")).toBe("Fallback");
  });

  it("builds trigger labels for empty, single, and multiple selections", () => {
    const options = [{ value: "a", label: "Alpha" }, { value: "b", label: "Beta" }];
    expect(getTriggerLabel([], options, "Pick", "items")).toBe("Pick");
    expect(getTriggerLabel(["a"], options, "Pick", "items")).toBe("Alpha");
    expect(getTriggerLabel(["a", "b"], options, "Pick", "items")).toBe("2 items");
  });

  it("toggles selected values and clears all when the empty option is chosen", () => {
    expect(toggleSelectedValue(["a"], new Set(["a"]), "")).toEqual([]);
    expect(toggleSelectedValue(["a"], new Set(["a"]), "a")).toEqual([]);
    expect(toggleSelectedValue(["a"], new Set(["a"]), "b")).toEqual(["a", "b"]);
  });

  it("builds menu classes for alignment and variants", () => {
    const className = getMenuClassName("right", "custom-menu", true, "modules");
    expect(className).toContain("alignRight");
    expect(className).toContain("menuPillsGrid");
    expect(className).toContain("modulesMenu");
    expect(className).toContain("custom-menu");
  });

  it("reports option active and checkbox-hidden state", () => {
    expect(getOptionState("", [], new Set(), [])).toEqual({ hideCheckbox: false, isActive: true });
    expect(getOptionState("a", ["a"], new Set(["a"]), ["a"])).toEqual({ hideCheckbox: true, isActive: true });
    expect(getOptionState("b", ["a"], new Set(["a"]), [])).toEqual({ hideCheckbox: false, isActive: false });
  });

  it("builds item classes for pill, module, and active states", () => {
    const pillClass = getItemClassName({
      isActive: true,
      isModuleVariant: false,
      optionsAsPills: true,
      hideCheckbox: false,
      itemClassName: "custom",
      activeItemClassName: "active-custom",
    });
    expect(pillClass).toContain("itemPill");
    expect(pillClass).toContain("itemPillActive");
    expect(pillClass).toContain("active-custom");

    const moduleClass = getItemClassName({
      isActive: true,
      isModuleVariant: true,
      optionsAsPills: false,
      hideCheckbox: true,
      itemClassName: "",
      activeItemClassName: "",
    });
    expect(moduleClass).toContain("modulesItem");
    expect(moduleClass).toContain("modulesItemManage");
    expect(moduleClass).toContain("modulesItemActive");

    const plainClass = getItemClassName({
      isActive: false,
      isModuleVariant: false,
      optionsAsPills: false,
      hideCheckbox: false,
      itemClassName: "",
      activeItemClassName: "",
    });
    expect(plainClass).toContain("dropdownItem");
    expect(plainClass).not.toContain("dropdownItemActive");
  });
});
