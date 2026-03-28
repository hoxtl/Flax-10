import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSocietyDetailPageData,
  renderSocietyDetailPage,
  societyDetailPageStateMocks,
} from "./societyDetailPageTestUtils.jsx";

import SocietyDetailPage from "../../../../pages/societies/components/SocietyDetailPage";

function clickByText(text) {
  fireEvent.click(screen.getByText(text));
}

describe("SocietyDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the current society layout and forwards route state into init", () => {
    const data = createSocietyDetailPageData({
      page: { focusAnnouncementId: "42" },
    });
    societyDetailPageStateMocks.useSocietyPageDataMock.mockReturnValue(data);

    renderSocietyDetailPage(
      <SocietyDetailPage societyId={1} initialTab="about" onMembershipChange={vi.fn()} />,
      { routeState: { activeTab: "members" } },
    );

    expect(societyDetailPageStateMocks.useSocietyPageDataMock).toHaveBeenCalledWith(1, "about", expect.any(Function));
    expect(societyDetailPageStateMocks.useSocietyInitMock).toHaveBeenCalledWith("members");
    expect(screen.getByTestId("hero")).toHaveTextContent("Robotics Society");
    expect(screen.getByTestId("info")).toBeInTheDocument();
    expect(screen.getByTestId("tabs")).toHaveTextContent("42");
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
  });

  it("renders loading and not-found states", () => {
    societyDetailPageStateMocks.useSocietyPageDataMock.mockReturnValueOnce(createSocietyDetailPageData({ loading: true }));
    const { unmount } = renderSocietyDetailPage(<SocietyDetailPage societyId={1} onBack={vi.fn()} />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    const onBack = vi.fn();
    unmount();
    const notFoundData = createSocietyDetailPageData();
    notFoundData.society = null;
    societyDetailPageStateMocks.useSocietyPageDataMock.mockReturnValue(notFoundData);
    renderSocietyDetailPage(<SocietyDetailPage societyId={1} onBack={onBack} />);

    expect(screen.getByText("Society not found.")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Back to Societies"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("opens the report and settings flows for admins", () => {
    const adminData = createSocietyDetailPageData();
    societyDetailPageStateMocks.useSocietyPageDataMock.mockReturnValue(adminData);
    renderSocietyDetailPage(<SocietyDetailPage societyId={1} onBack={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Report Society" }));
    fireEvent.click(screen.getByTitle("Settings"));
    expect(adminData.modals.setShowReportModal).toHaveBeenCalledWith(true);
    expect(adminData.modals.setShowSettings).toHaveBeenCalledWith(true);
  });

  it("hides settings for non-admins and uses the unreport handler", () => {
    const memberData = createSocietyDetailPageData({
      society: { role: "member", is_admin: false, has_reported: true },
    });
    societyDetailPageStateMocks.useSocietyPageDataMock.mockReturnValue(memberData);
    renderSocietyDetailPage(<SocietyDetailPage societyId={1} onBack={vi.fn()} />);

    expect(screen.queryByTitle("Settings")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "You have reported this society. Click to unreport." }));
    expect(memberData.handleUnreport).toHaveBeenCalledWith(memberData.society);
  });

  it("falls back to a generic breadcrumb label when the society has no name", () => {
    const data = createSocietyDetailPageData({
      society: { name: "" },
    });
    societyDetailPageStateMocks.useSocietyPageDataMock.mockReturnValue(data);

    renderSocietyDetailPage(<SocietyDetailPage societyId={1} onBack={vi.fn()} />);

    expect(screen.getByText("Society")).toBeInTheDocument();
  });
});
