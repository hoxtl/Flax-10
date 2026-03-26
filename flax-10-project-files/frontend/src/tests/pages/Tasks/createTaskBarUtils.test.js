/*
 * Tests for createTaskBarUtils: buildQuickAddPayload, runQuickAdd.
 */

import { describe, it, expect, vi } from "vitest";
import {
  buildQuickAddPayload,
  clampEstimateMinutes,
  normalizeEstimateMinutesInput,
  runQuickAdd,
} from "../../../pages/tasks/utils/createTaskBarUtils";

describe("createTaskBarUtils", () => {
  describe("estimate normalization", () => {
    it("clamps raw minute values into the supported range", () => {
      expect(clampEstimateMinutes("abc")).toBe(25);
      expect(clampEstimateMinutes(1)).toBe(5);
      expect(clampEstimateMinutes(250)).toBe(240);
      expect(clampEstimateMinutes(50)).toBe(50);
    });

    it("normalizes empty and invalid values using the provided fallback", () => {
      expect(normalizeEstimateMinutesInput("", 60)).toBe(60);
      expect(normalizeEstimateMinutesInput(null, 15)).toBe(15);
      expect(normalizeEstimateMinutesInput(undefined, 300)).toBe(240);
      expect(normalizeEstimateMinutesInput("oops", 2)).toBe(5);
      expect(normalizeEstimateMinutesInput(75, 25)).toBe(75);
      expect(normalizeEstimateMinutesInput("", undefined)).toBe(25);
      expect(normalizeEstimateMinutesInput("oops", null)).toBe(25);
    });
  });

  describe("buildQuickAddPayload", () => {
    it("builds payload with taskListId when set", () => {
      const state = { sortedLists: [{ id: 1 }], taskListId: "5", estimatedMinutes: 50, moduleId: null, defaultDueDate: "2026-03-15" };
      const out = buildQuickAddPayload(state, "Read ch 3");
      expect(out.title).toBe("Read ch 3");
      expect(out.task_list).toBe(5);
      expect(out.estimated_blocks).toBe(2);
      expect(out.due_date).toBe("2026-03-15");
    });

    it("uses first list id when taskListId empty", () => {
      const state = { sortedLists: [{ id: 3 }], taskListId: null, estimatedBlocks: 1, moduleId: null, defaultDueDate: null };
      const out = buildQuickAddPayload(state, "T");
      expect(out.task_list).toBe(3);
      expect(out.due_date).toBeNull();
    });

    it("sets module when moduleId provided", () => {
      const state = { sortedLists: [], taskListId: null, estimatedBlocks: 1, moduleId: "10", defaultDueDate: null };
      const out = buildQuickAddPayload(state, "T");
      expect(out.module).toBe(10);
    });

    it("uses reading page counts to derive estimated blocks and page_count", () => {
      const state = {
        sortedLists: [{ id: 4 }],
        taskListId: "",
        estimatedBlocks: 1,
        moduleId: null,
        defaultDueDate: null,
        pageCount: 30,
      };
      const out = buildQuickAddPayload(state, "Read");
      expect(out.task_list).toBe(4);
      expect(out.estimated_blocks).toBe(3);
      expect(out.page_count).toBe(30);
    });
  });

  describe("runQuickAdd", () => {
    it("returns early when saving", async () => {
      const state = { saving: true, setSaving: vi.fn(), title: "T", setTitle: vi.fn(), setModuleId: vi.fn(), sortedLists: [], taskListId: null, estimatedBlocks: 1, moduleId: null, defaultDueDate: null };
      const onAddTask = vi.fn();
      await runQuickAdd(state, onAddTask, "T");
      expect(onAddTask).not.toHaveBeenCalled();
    });

    it("returns early when onAddTask is null", async () => {
      const state = { saving: false, setSaving: vi.fn(), title: "T", setTitle: vi.fn(), setModuleId: vi.fn(), sortedLists: [], taskListId: null, estimatedBlocks: 1, moduleId: null, defaultDueDate: null };
      await runQuickAdd(state, null, "T");
      expect(state.setSaving).not.toHaveBeenCalled();
    });

    it("calls onAddTask and clears state on success", async () => {
      const state = { saving: false, setSaving: vi.fn(), title: "T", setTitle: vi.fn(), setModuleId: vi.fn(), setPageCount: vi.fn(), sortedLists: [], taskListId: null, estimatedBlocks: 1, moduleId: null, defaultDueDate: null };
      const onAddTask = vi.fn().mockResolvedValue(undefined);
      await runQuickAdd(state, onAddTask, "Task");
      expect(onAddTask).toHaveBeenCalledWith(expect.objectContaining({ title: "Task" }));
      expect(state.setTitle).toHaveBeenCalledWith("");
      expect(state.setModuleId).toHaveBeenCalledWith(null);
      expect(state.setPageCount).toHaveBeenCalledWith(null);
      expect(state.setSaving).toHaveBeenCalledWith(true);
      expect(state.setSaving).toHaveBeenCalledWith(false);
    });

    it("runs without setSaving when state has no setSaving", async () => {
      const state = { saving: false, title: "T", setTitle: vi.fn(), setModuleId: vi.fn(), sortedLists: [{ id: 1 }], taskListId: "1", estimatedBlocks: 1, moduleId: null, defaultDueDate: null };
      const onAddTask = vi.fn().mockResolvedValue(undefined);
      await runQuickAdd(state, onAddTask, "Task");
      expect(onAddTask).toHaveBeenCalled();
      expect(state.setTitle).toHaveBeenCalledWith("");
      expect(state.setModuleId).toHaveBeenCalledWith(null);
    });
  });
});
