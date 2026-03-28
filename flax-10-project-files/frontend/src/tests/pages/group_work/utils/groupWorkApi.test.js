import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  getAuthHeaders,
  getJsonHeaders,
  fetchJSON,
  fetchGroupProjects,
  fetchProjectMembers,
  patchGroupProject,
  deleteGroupProject,
  deleteProjectMember,
  createGroupProject,
  addProjectMember,
} from "../../../../pages/group_work/api/groupWorkApi";

const createLocalStorageMock = () => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

describe("groupWorkApi", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("localStorage", createLocalStorageMock());
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds auth and json headers from local storage", () => {
    expect(getAuthHeaders()).toEqual({});
    localStorage.setItem("token", "abc123");
    expect(getAuthHeaders()).toEqual({ Authorization: "Token abc123" });
    expect(getJsonHeaders()).toEqual({
      "Content-Type": "application/json",
      Authorization: "Token abc123",
    });
  });

  it("returns parsed JSON arrays and objects from fetchJSON", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue([{ id: 1 }]) });
    fetch.mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({ id: 2 }) });
    fetch.mockResolvedValueOnce({ ok: false });

    await expect(fetchJSON("/groups")).resolves.toEqual([{ id: 1 }]);
    await expect(fetchJSON("/group")).resolves.toEqual({ id: 2 });
    await expect(fetchJSON("/missing")).resolves.toBeNull();
  });

  it("calls the collection fetch helpers with the expected URLs", async () => {
    fetch.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue([]) });

    await fetchGroupProjects();
    await fetchProjectMembers(7);

    expect(fetch).toHaveBeenNthCalledWith(1, "/api/group-work/projects/", expect.any(Object));
    expect(fetch).toHaveBeenNthCalledWith(2, "/api/group-work/projects/7/members/", expect.any(Object));
  });

  it("sends patch and delete project requests", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({ id: 1 }) }).mockResolvedValueOnce({ ok: true });
    await patchGroupProject(1, { title: "U" });
    await deleteGroupProject(1);
    expect(fetch).toHaveBeenCalledWith("/api/group-work/projects/1/", expect.objectContaining({ method: "PATCH" }));
    expect(fetch).toHaveBeenCalledWith("/api/group-work/projects/1/", expect.objectContaining({ method: "DELETE" }));
  });

  it("deletes project members with auth headers only", async () => {
    localStorage.setItem("token", "member-token");
    fetch.mockResolvedValueOnce({ ok: true });

    await deleteProjectMember(5, 9);

    expect(fetch).toHaveBeenCalledWith(
      "/api/group-work/projects/5/members/9/",
      expect.objectContaining({
        method: "DELETE",
        headers: { Authorization: "Token member-token" },
      }),
    );
  });

  it("sends create project and member management requests", async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({ id: 2 }) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({ id: 99 }) });
    await createGroupProject({ title: "N" });
    await addProjectMember(1, 22);
    expect(fetch).toHaveBeenCalledWith("/api/group-work/projects/", expect.objectContaining({ method: "POST" }));
    expect(fetch).toHaveBeenCalledWith("/api/group-work/projects/1/members/", expect.objectContaining({ method: "POST" }));
  });

  describe("createGroupProject error handling", () => {
    it("throws with detail from error response", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({ detail: "Project limit reached." }),
      });
      await expect(createGroupProject({ title: "X" })).rejects.toThrow("Project limit reached.");
    });

    it("throws with message from error response", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({ message: "Invalid title." }),
      });
      await expect(createGroupProject({ title: "X" })).rejects.toThrow("Invalid title.");
    });

    it("throws with first flat value from other error keys", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({ title: ["Title is required."] }),
      });
      await expect(createGroupProject({})).rejects.toThrow("Title is required.");
    });

    it("throws fallback message when json() rejects", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockRejectedValue(new Error("parse error")),
      });
      await expect(createGroupProject({ title: "X" })).rejects.toThrow("We couldn't create that project.");
    });

    it("throws fallback message when error body is empty", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({}),
      });
      await expect(createGroupProject({ title: "X" })).rejects.toThrow("We couldn't create that project.");
    });
  });

  describe("addProjectMember error handling", () => {
    it("throws with detail from error response", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({ detail: "Already a member." }),
      });
      await expect(addProjectMember(1, 2)).rejects.toThrow("Already a member.");
    });

    it("throws with message from error response", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({ message: "User not found." }),
      });
      await expect(addProjectMember(1, 2)).rejects.toThrow("User not found.");
    });

    it("throws with first flat value from other error keys", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({ user: ["This field is required."] }),
      });
      await expect(addProjectMember(1, 2)).rejects.toThrow("This field is required.");
    });

    it("throws fallback message when json() rejects", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockRejectedValue(new Error("parse error")),
      });
      await expect(addProjectMember(1, 2)).rejects.toThrow("We couldn't add that teammate.");
    });

    it("throws fallback message when error body is empty", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({}),
      });
      await expect(addProjectMember(1, 2)).rejects.toThrow("We couldn't add that teammate.");
    });
  });

  it("patchGroupProject returns null when response is not ok", async () => {
    fetch.mockResolvedValueOnce({ ok: false });
    const result = await patchGroupProject(1, { title: "Fail" });
    expect(result).toBeNull();
  });

  it("fetchJSON returns null when json() resolves to a falsy value", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue(null) });
    const result = await fetchJSON("/empty");
    expect(result).toBeNull();
  });
});
