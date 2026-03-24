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

  it("sends patch, delete, create, and member requests with the right payloads", async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({ id: 1, title: "Updated" }) })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({ id: 2 }) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({ id: 3 }) });

    await expect(patchGroupProject(1, { title: "Updated" })).resolves.toEqual({ id: 1, title: "Updated" });
    await deleteGroupProject(1);
    await deleteProjectMember(1, 9);
    await expect(createGroupProject({ title: "New" })).resolves.toEqual({ id: 2 });
    await expect(addProjectMember(1, 22)).resolves.toEqual({ id: 3 });

    expect(fetch).toHaveBeenNthCalledWith(1, "/api/group-work/projects/1/", expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({ title: "Updated" }),
    }));
    expect(fetch).toHaveBeenNthCalledWith(2, "/api/group-work/projects/1/", expect.objectContaining({ method: "DELETE" }));
    expect(fetch).toHaveBeenNthCalledWith(3, "/api/group-work/projects/1/members/9/", expect.objectContaining({ method: "DELETE" }));
    expect(fetch).toHaveBeenNthCalledWith(4, "/api/group-work/projects/", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ title: "New" }),
    }));
    expect(fetch).toHaveBeenNthCalledWith(5, "/api/group-work/projects/1/members/", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ user: 22, role: "member" }),
    }));
  });
});
