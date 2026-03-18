/**
 * Tests for useTaskListsUtils: mergeListColors, addListImpl, renameListImpl,
 * removeListImpl, restoreListImpl, permanentlyDeleteListImpl.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  mergeListColors,
  addListImpl,
  renameListImpl,
  removeListImpl,
  restoreListImpl,
  permanentlyDeleteListImpl,
} from "../../../pages/Tasks/utils/useTaskListsUtils";

vi.mock("../../../api/taskService", () => ({
  createTaskList: vi.fn(),
  updateTaskList: vi.fn(),
  deleteTaskList: vi.fn(),
}));

import { createTaskList, updateTaskList, deleteTaskList } from "../../../api/taskService";

describe("useTaskListsUtils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(global, "window", { value: {}, writable: true });
    if (typeof global.localStorage === "undefined") {
      global.localStorage = { getItem: vi.fn(), setItem: vi.fn() };
    }
  });

  describe("mergeListColors", () => {
    it("returns empty array for null or non-array", () => {
      expect(mergeListColors(null)).toEqual([]);
      expect(mergeListColors({})).toEqual([]);
    });
    it("merges list color with stored when list has no color", () => {
      global.localStorage.getItem = vi.fn((k) => (k === "listColor:1" ? "#abc" : null));
      const out = mergeListColors([{ id: 1, name: "L" }]);
      expect(out[0].color).toBe("#abc");
    });
    it("keeps list color when set", () => {
      const out = mergeListColors([{ id: 1, name: "L", color: "#fff" }]);
      expect(out[0].color).toBe("#fff");
    });
  });

  describe("addListImpl", () => {
    it("adds list when created has id and data.color", async () => {
      createTaskList.mockResolvedValue({ id: 5, name: "L" });
      const setLists = vi.fn();
      const result = await addListImpl(setLists, { name: "L", color: "#red" });
      expect(result.color).toBe("#red");
      expect(setLists).toHaveBeenCalledWith(expect.any(Function));
    });
    it("adds list without color when data has no color", async () => {
      createTaskList.mockResolvedValue({ id: 5, name: "L" });
      const setLists = vi.fn();
      await addListImpl(setLists, { name: "L" });
      const fn = setLists.mock.calls[0][0];
      const next = fn([]);
      expect(next).toHaveLength(1);
      expect(next[0].id).toBe(5);
    });
  });

  describe("renameListImpl", () => {
    it("updates list by id", async () => {
      updateTaskList.mockResolvedValue({ id: 1, name: "New" });
      const setLists = vi.fn();
      await renameListImpl(setLists, 1, "New");
      expect(updateTaskList).toHaveBeenCalledWith(1, { name: "New" });
      expect(setLists).toHaveBeenCalled();
    });
  });

  describe("removeListImpl", () => {
    it("archives list and calls loadArchived", async () => {
      updateTaskList.mockResolvedValue({});
      const setLists = vi.fn();
      const loadArchived = vi.fn();
      await removeListImpl(setLists, loadArchived, 1);
      expect(updateTaskList).toHaveBeenCalledWith(1, { archived: true });
      expect(setLists).toHaveBeenCalled();
      expect(loadArchived).toHaveBeenCalled();
    });
  });

  describe("restoreListImpl", () => {
    it("unarchives and reloads", async () => {
      updateTaskList.mockResolvedValue({});
      const load = vi.fn();
      const loadArchived = vi.fn();
      await restoreListImpl(load, loadArchived, 1);
      expect(updateTaskList).toHaveBeenCalledWith(1, { archived: false });
      expect(load).toHaveBeenCalled();
      expect(loadArchived).toHaveBeenCalled();
    });
  });

  describe("permanentlyDeleteListImpl", () => {
    it("deletes and removes from archived", async () => {
      deleteTaskList.mockResolvedValue();
      const setArchivedLists = vi.fn();
      await permanentlyDeleteListImpl(setArchivedLists, 1);
      expect(deleteTaskList).toHaveBeenCalledWith(1);
      const fn = setArchivedLists.mock.calls[0][0];
      expect(fn([{ id: 1 }])).toEqual([]);
    });
  });
});
