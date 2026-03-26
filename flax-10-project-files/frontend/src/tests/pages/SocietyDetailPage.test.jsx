import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSocietyDetailPageData, renderSocietyDetailPage } from "./societyDetailPageTestUtils.jsx";

const useSocietyPageDataMock = vi.fn();
const useSocietyInitMock = vi.fn();

vi.mock("../../pages/Societies/useSocietyDetailPageState", () => ({
  useSocietyPageData: (...args) => useSocietyPageDataMock(...args),
  useSocietyInit: (...args) => useSocietyInitMock(...args),
}));

import SocietyDetailPage from "../../pages/Societies/SocietyDetailPage";

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
    useSocietyPageDataMock.mockReturnValue(data);

    renderSocietyDetailPage(
      <SocietyDetailPage societyId={1} initialTab="about" onMembershipChange={vi.fn()} />,
      { routeState: { activeTab: "members" } },
    );

    expect(useSocietyPageDataMock).toHaveBeenCalledWith(1, "about", expect.any(Function));
    expect(useSocietyInitMock).toHaveBeenCalledWith("members");
    expect(screen.getByTestId("hero")).toHaveTextContent("Robotics Society");
    expect(screen.getByTestId("info")).toBeInTheDocument();
    expect(screen.getByTestId("tabs")).toHaveTextContent("42");
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
  });

  it("renders loading and not-found states", () => {
    useSocietyPageDataMock.mockReturnValueOnce(createSocietyDetailPageData({ loading: true }));
    const { unmount } = renderSocietyDetailPage(<SocietyDetailPage societyId={1} onBack={vi.fn()} />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    const onBack = vi.fn();
    unmount();
    const notFoundData = createSocietyDetailPageData();
    notFoundData.society = null;
    useSocietyPageDataMock.mockReturnValue(notFoundData);
    renderSocietyDetailPage(<SocietyDetailPage societyId={1} onBack={onBack} />);

    expect(screen.getByText("Society not found.")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Back to Societies"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("opens the report and settings flows for admins", () => {
    const adminData = createSocietyDetailPageData();
    useSocietyPageDataMock.mockReturnValue(adminData);
    renderSocietyDetailPage(<SocietyDetailPage societyId={1} onBack={vi.fn()} />);

    fireEvent.click(screen.getByTitle("Report Society"));
    fireEvent.click(screen.getByTitle("Settings"));
    expect(adminData.modals.setShowReportModal).toHaveBeenCalledWith(true);
    expect(adminData.modals.setShowSettings).toHaveBeenCalledWith(true);
  });

  it("hides settings for non-admins and uses the unreport handler", () => {
    const memberData = createSocietyDetailPageData({
      society: { role: "member", is_admin: false, has_reported: true },
    });
    useSocietyPageDataMock.mockReturnValue(memberData);
    renderSocietyDetailPage(<SocietyDetailPage societyId={1} onBack={vi.fn()} />);

    expect(screen.queryByTitle("Settings")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTitle("You have reported this society. Click to unreport."));
    expect(memberData.handleUnreport).toHaveBeenCalledWith(memberData.society);
  });
});
