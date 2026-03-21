/*
 * Tests for createTaskBarUtils: buildQuickAddPayload, runQuickAdd.
 */

import { describe, it, expect, vi } from "vitest";
import { buildQuickAddPayload, runQuickAdd } from "../../../pages/Tasks/utils/createTaskBarUtils";

describe("createTaskBarUtils", () => {
  describe("buildQuickAddPayload", () => {
    it("builds payload with taskListId when set", () => {
      const state = { sortedLists: [{ id: 1 }], taskListId: "5", estimatedBlocks: 2, moduleId: null, defaultDueDate: "2026-03-15" };
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
      const state = { saving: false, setSaving: vi.fn(), title: "T", setTitle: vi.fn(), setModuleId: vi.fn(), sortedLists: [], taskListId: null, estimatedBlocks: 1, moduleId: null, defaultDueDate: null };
      const onAddTask = vi.fn().mockResolvedValue(undefined);
      await runQuickAdd(state, onAddTask, "Task");
      expect(onAddTask).toHaveBeenCalledWith(expect.objectContaining({ title: "Task" }));
      expect(state.setTitle).toHaveBeenCalledWith("");
      expect(state.setModuleId).toHaveBeenCalledWith(null);
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
