/**
 * Tests for Tasks createTaskModalUtils: buildCreateTaskPayload, runCreateTaskSave.
 */

import { describe, it, expect, vi } from "vitest";
import { buildCreateTaskPayload, runCreateTaskSave } from "../../../pages/Tasks/utils/createTaskModalUtils";

describe("createTaskModalUtils", () => {
  describe("buildCreateTaskPayload", () => {
    it("builds payload from form with all fields", () => {
      const form = {
        title: "  Read chapter 3  ",
        description: "Notes",
        priority: "high",
        due_date: "2026-03-15T10:00:00",
        task_list: "5",
        estimated_blocks: 2,
        module: "12",
      };
      const out = buildCreateTaskPayload(form);
      expect(out.title).toBe("Read chapter 3");
      expect(out.description).toBe("Notes");
      expect(out.priority).toBe("high");
      expect(out.due_date).toBe("2026-03-15T10:00:00");
      expect(out.task_list).toBe(5);
      expect(out.estimated_blocks).toBe(2);
      expect(out.module).toBe(12);
    });

    it("defaults priority to medium when empty", () => {
      const form = { title: "T", description: "", priority: "", due_date: "2026-03-15", task_list: null, estimated_blocks: 1, module: null };
      const out = buildCreateTaskPayload(form);
      expect(out.priority).toBe("medium");
    });

    it("ensures estimated_blocks at least 1", () => {
      const form = { title: "T", description: "", priority: "medium", due_date: "2026-03-15", task_list: null, estimated_blocks: 0, module: null };
      const out = buildCreateTaskPayload(form);
      expect(out.estimated_blocks).toBe(1);
    });

    it("converts task_list and module to number or null", () => {
      expect(buildCreateTaskPayload({ title: "T", description: "", priority: "m", due_date: "x", task_list: null, estimated_blocks: 1, module: null }).task_list).toBeNull();
      expect(buildCreateTaskPayload({ title: "T", description: "", priority: "m", due_date: "x", task_list: "7", estimated_blocks: 1, module: null }).task_list).toBe(7);
    });
  });

  describe("runCreateTaskSave", () => {
    it("calls onSave then onClose on success", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const onClose = vi.fn();
      const setSaveError = vi.fn();
      const form = { title: "T", description: "", priority: "medium", due_date: "2026-03-15", task_list: null, estimated_blocks: 1, module: null };
      await runCreateTaskSave(form, false, "create", false, onSave, onClose, setSaveError);
      expect(setSaveError).toHaveBeenCalledWith("");
      expect(onSave).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });

    it("sets error and does not close on save failure", async () => {
      const onSave = vi.fn().mockRejectedValue(new Error("Network error"));
      const onClose = vi.fn();
      const setSaveError = vi.fn();
      const form = { title: "T", description: "", priority: "medium", due_date: "2026-03-15", task_list: null, estimated_blocks: 1, module: null };
      await runCreateTaskSave(form, false, "create", false, onSave, onClose, setSaveError);
      expect(setSaveError).toHaveBeenCalledWith("Network error");
      expect(onClose).not.toHaveBeenCalled();
    });

    it("passes addToSchedule meta when create mode and showAddToScheduleToggle", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const onClose = vi.fn();
      const form = { title: "T", description: "", priority: "medium", due_date: "2026-03-15", task_list: null, estimated_blocks: 1, module: null };
      await runCreateTaskSave(form, true, "create", true, onSave, onClose, vi.fn());
      expect(onSave).toHaveBeenCalledWith(expect.any(Object), { addToSchedule: true });
    });
  });
});
