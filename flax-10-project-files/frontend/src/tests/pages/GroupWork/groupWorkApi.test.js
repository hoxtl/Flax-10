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
} from "../../../pages/GroupWork/api/groupWorkApi";

describe("groupWorkApi", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
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

  it("sends create project and member management requests", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({ id: 2 }) }).mockResolvedValueOnce({ ok: true });
    await createGroupProject({ title: "N" });
    await addProjectMember(1, 22);
    expect(fetch).toHaveBeenCalledWith("/api/group-work/projects/", expect.objectContaining({ method: "POST" }));
    expect(fetch).toHaveBeenCalledWith("/api/group-work/projects/1/members/", expect.objectContaining({ method: "POST" }));
  });
});
