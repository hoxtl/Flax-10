import { beforeEach, describe, expect, it, vi } from "vitest";
const { gAUP, gUP, gE, fT } = vi.hoisted(() => ({ gAUP: vi.fn(), gUP: vi.fn(), gE: vi.fn(), fT: vi.fn() }));
vi.mock("../../../../api/userApi", () => ({ getAnotherUserProfile: gAUP, getUserProfile: gUP }));
vi.mock("../../../../api/eventApi", () => ({ getEvents: gE }));
vi.mock("../../../../api/taskApi", () => ({ fetchTasks: fT }));
vi.mock("../../../../context/AuthContext", () => ({ useAuth: () => ({ profile: { id: 5 } }) }));
import { loadProfile, loadTaskCount, tryLoadEvents, tryLoadProfile } from "../../../../pages/profile/hooks/profileDataLoaders";
describe("profileDataLoaders", () => {
  beforeEach(() => vi.clearAllMocks());
  it("loads self and remote profiles", async () => {
    gUP.mockResolvedValueOnce({ id: 5 });
    await expect(loadProfile()).resolves.toEqual({ id: 5 });
    gAUP.mockResolvedValueOnce({ id: 7 });
    await expect(loadProfile(7)).resolves.toEqual({ id: 7 });
  });

  it("clears loading when tryLoadProfile fails", async () => {
    const sL = vi.fn();
    gAUP.mockRejectedValueOnce(new Error("x"));
    await tryLoadProfile(vi.fn(), sL, 9);
    expect(sL).toHaveBeenCalledWith(false);
  });

  it("normalizes events on failure", async () => {
    const sAE = vi.fn();
    gE.mockResolvedValueOnce(null);
    await tryLoadEvents(sAE);
    expect(sAE).toHaveBeenCalledWith([]);
    gE.mockRejectedValueOnce(new Error("x"));
    await tryLoadEvents(sAE, 2);
  });

  it("counts incomplete tasks", async () => {
    const sTC = vi.fn();
    fT.mockResolvedValueOnce({ results: [{ completed: false }, { completed: true }] });
    await loadTaskCount(sTC);
    expect(sTC).toHaveBeenCalledWith(1);
    fT.mockRejectedValueOnce(new Error("x"));
    await loadTaskCount(sTC);
    expect(sTC).toHaveBeenLastCalledWith(0);
  });

  it("falls back to empty count when task results missing", async () => {
    const sTC = vi.fn();
    fT.mockResolvedValueOnce({});
    await loadTaskCount(sTC);
    expect(sTC).toHaveBeenCalledWith(0);
    fT.mockResolvedValueOnce(null);
    await loadTaskCount(sTC);
    expect(sTC).toHaveBeenLastCalledWith(0);
  });
});
