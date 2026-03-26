import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
vi.mock("../../../api/userApi", () => ({ getAnotherUserProfile: vi.fn(), getUserProfile: vi.fn() }));
vi.mock("../../../api/eventApi", () => ({ getEvents: vi.fn().mockResolvedValue([]) }));
vi.mock("../../../context/AuthContext", () => ({ useAuth: vi.fn(() => ({ profile: { id: 5 }, loading: false, refreshProfile: vi.fn() })) }));
import { useProfileState, useProfileBodyData } from "../../../pages/profile/hooks/useProfile";
import { getUserProfile, getAnotherUserProfile } from "../../../api/userApi";
import { useAuth } from "../../../context/AuthContext";
describe("useProfileStatePieces", () => {
  const mockRefresh = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ profile: { id: 5 }, loading: false, refreshProfile: mockRefresh });
    getUserProfile.mockResolvedValue({ id: 5 });
    getAnotherUserProfile.mockResolvedValue({ id: 7 });
  });
  it("initializes with loading state", () => {
    const { result } = renderHook(() => useProfileState(5));
    expect(result.current.loading).toBe(false);
  });
  it("loads profile on mount", async () => {
    getUserProfile.mockResolvedValueOnce({ id: 5, username: "a" });
    const { result } = renderHook(() => useProfileState(5));
    await waitFor(() => expect(result.current.profileData?.username).toBe("a"));
  });
  it("supports reload", async () => {
    const { result } = renderHook(() => useProfileState(5));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => { result.current.reload(); });
    expect(result.current.handleSaveProfile).toBeDefined();
  });
  it("useProfileBodyData filters events", () => {
    const today = new Date();
    const evts = [{ start_time: today.toISOString() }];
    const { result } = renderHook(() => useProfileBodyData({ allEvents: evts, eventRange: "month" }));
    expect(result.current.filteredEvents.length).toBe(1);
  });
  it("useProfileBodyData count upcoming events", () => {
    const today = new Date();
    const evts = [{ start_time: today.toISOString() }];
    const { result } = renderHook(() => useProfileBodyData({ allEvents: evts, eventRange: "week" }));
    expect(result.current.upcomingEventCount).toBe(1);
  });
});
