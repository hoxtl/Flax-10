/*
 * Sharing and societies tests for profile modals.
 */

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderProfileModals, renderSocietiesModal } from "./ProfileModals.testUtils";

describe("ProfileModals sharing and societies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the shared-with modal when requested", async () => {
    const { getSharingWith } = await import("../../../api/socialApi");
    getSharingWith.mockResolvedValue([{ id: 2, username: "bob" }]);
    renderProfileModals({ state: { showSharedWith: true } });
    await waitFor(() => expect(screen.getByTestId("user-list-modal")).toBeTruthy());
    expect(screen.getByText("1 person can see my calendar events")).toBeTruthy();
  });

  it("renders the shared-by modal when requested", async () => {
    const { getSharedWithMe } = await import("../../../api/socialApi");
    getSharedWithMe.mockResolvedValue([{ id: 3, username: "carol" }]);
    renderProfileModals({ state: { showSharedBy: true } });
    await waitFor(() => expect(screen.getByTestId("user-list-modal")).toBeTruthy());
    expect(screen.getByText("1 person has shared their calendar events with me")).toBeTruthy();
    expect(screen.getByRole("button", { name: /view calendar/i })).toBeTruthy();
  });

  it("renders plural titles for populated shared lists", async () => {
    const { getSharingWith, getSharedWithMe } = await import("../../../api/socialApi");
    getSharingWith.mockResolvedValue([{ id: 2, username: "bob" }, { id: 4, username: "dana" }]);
    getSharedWithMe.mockResolvedValue([{ id: 3, username: "carol" }, { id: 5, username: "eli" }]);
    renderProfileModals({ state: { showSharedWith: true } });
    await waitFor(() => expect(screen.getByText("2 people can see my calendar events")).toBeTruthy());
    renderProfileModals({ state: { showSharedBy: true } });
    await waitFor(() => expect(screen.getByText("2 people have shared their calendar events with me")).toBeTruthy());
  });

  it("renders zero-count titles for empty shared lists", async () => {
    const { getSharingWith, getSharedWithMe } = await import("../../../api/socialApi");
    getSharingWith.mockResolvedValue([]);
    getSharedWithMe.mockResolvedValue([]);
    renderProfileModals({ state: { showSharedWith: true } });
    await waitFor(() => expect(screen.getByText("People who can see my calendar events")).toBeTruthy());
    renderProfileModals({ state: { showSharedBy: true } });
    await waitFor(() => expect(screen.getByText("People who have shared their calendar events with me")).toBeTruthy());
  });

  it("handles fetch errors when loading social data", async () => {
    const { getSharingWith } = await import("../../../api/socialApi");
    getSharingWith.mockRejectedValueOnce(new Error("fetch failed"));
    renderProfileModals({ state: { showSharedWith: true } });
    await waitFor(() => expect(getSharingWith).toHaveBeenCalled());
  });

  it("closes the shared-with modal and navigates when a user is clicked", async () => {
    const onNavChange = vi.fn();
    const setShowSharedWith = vi.fn();
    const { getSharingWith } = await import("../../../api/socialApi");
    getSharingWith.mockResolvedValue([{ id: 2, username: "bob" }]);
    renderProfileModals({ state: { showSharedWith: true, setShowSharedWith }, onNavChange });
    await waitFor(() => expect(screen.getByTestId("user-list-modal")).toBeTruthy());
    fireEvent.click(screen.getByText("bob"));
    expect(setShowSharedWith).toHaveBeenCalledWith(false);
    expect(onNavChange).toHaveBeenCalledWith("profile_2");
  });

  it("closes the shared-with list modal when the close action is clicked", async () => {
    const setShowSharedWith = vi.fn();
    const { getSharingWith } = await import("../../../api/socialApi");
    getSharingWith.mockResolvedValue([{ id: 2, username: "bob" }]);
    renderProfileModals({ state: { showSharedWith: true, setShowSharedWith } });
    await waitFor(() => expect(screen.getByText("Close List")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Close List"));
    expect(setShowSharedWith).toHaveBeenCalledWith(false);
  });

  it("closes the shared-by list modal when the close action is clicked", async () => {
    const setShowSharedBy = vi.fn();
    const { getSharedWithMe } = await import("../../../api/socialApi");
    getSharedWithMe.mockResolvedValue([{ id: 3, username: "carol" }]);
    renderProfileModals({ state: { showSharedBy: true, setShowSharedBy } });
    await waitFor(() => expect(screen.getByText("Close List")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Close List"));
    expect(setShowSharedBy).toHaveBeenCalledWith(false);
  });

  it("opens a shared calendar from the shared-by modal", async () => {
    const onNavChange = vi.fn();
    const setShowSharedBy = vi.fn();
    const { getSharedWithMe } = await import("../../../api/socialApi");
    getSharedWithMe.mockResolvedValue([{ id: 3, username: "carol", first_name: "Carol", last_name: "Stone" }]);
    renderProfileModals({ state: { showSharedBy: true, setShowSharedBy }, onNavChange });
    await waitFor(() => expect(screen.getByRole("button", { name: /view calendar/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /view calendar/i }));
    expect(setShowSharedBy).toHaveBeenCalledWith(false);
    expect(onNavChange).toHaveBeenCalledWith("/calendar?user_id=3&shared_name=Carol+Stone");
  });

  it("falls back to sensible shared calendar labels", async () => {
    const onNavChange = vi.fn();
    const { getSharedWithMe } = await import("../../../api/socialApi");
    getSharedWithMe.mockResolvedValue([{ id: 3 }, { id: 4, username: "anonymous" }, { username: "anon" }]);
    renderProfileModals({ state: { showSharedBy: true }, onNavChange });
    await waitFor(() => expect(screen.getAllByRole("button", { name: /view calendar/i }).length).toBe(3));
    fireEvent.click(screen.getAllByRole("button", { name: /view calendar/i })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: /view calendar/i })[1]);
    fireEvent.click(screen.getAllByRole("button", { name: /view calendar/i })[2]);
    expect(onNavChange).toHaveBeenNthCalledWith(1, "/calendar?user_id=3&shared_name=Shared+user");
    expect(onNavChange).toHaveBeenNthCalledWith(2, "/calendar?user_id=4&shared_name=anonymous");
    expect(onNavChange).toHaveBeenNthCalledWith(3, "/calendar");
  });

  it("uses the current user id when shared lists open without profile data", async () => {
    const onNavChange = vi.fn();
    const { getSharingWith } = await import("../../../api/socialApi");
    getSharingWith.mockResolvedValue([{ id: 2, username: "bob" }]);
    renderProfileModals({ user: { id: 9, username: "alice" }, state: { profileData: null, showSharedWith: true }, onNavChange });
    await waitFor(() => expect(screen.getByTestId("user-list-modal")).toBeTruthy());
    fireEvent.click(screen.getByText("bob"));
    expect(onNavChange).toHaveBeenCalledWith("profile_2");
  });

  it("renders society previews and artwork", () => {
    renderSocietiesModal({
      societies: [
        { id: 11, name: "Chess Club", description: "Weekly matches", cover_image: "https://example.com/cover.png" },
        { name: "Mystery Society" },
      ],
    });
    expect(screen.getByText("Societies")).toBeTruthy();
    expect(screen.getByText("Chess Club")).toBeTruthy();
    expect(screen.getByText("Weekly matches")).toBeTruthy();
    expect(screen.getByAltText("Chess Club").getAttribute("src")).toContain("cover.png");
  });

  it("navigates to society pages when a valid society is clicked", () => {
    const { onClose, onNavigate } = renderSocietiesModal({
      societies: [
        { id: 11, name: "Chess Club" },
        { society_id: 22, name: "Film Club", image: "https://example.com/film.png" },
        { name: "Mystery Society" },
      ],
    });
    fireEvent.click(screen.getByText("Chess Club"));
    fireEvent.click(screen.getByText("Film Club"));
    fireEvent.click(screen.getByText("Mystery Society"));
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(onNavigate).toHaveBeenNthCalledWith(1, "/societies?id=11");
    expect(onNavigate).toHaveBeenNthCalledWith(2, "/societies?id=22");
  });
});
