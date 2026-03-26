/**
 * Verifies the modal props forwarded by SocietyDetailPage.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import { mergeNested } from "../utils/testBuilderUtils";
import { buildPageData } from "./societyDetailPageTestUtils";

const useSocietyPageDataMock = vi.fn();

vi.mock("../../pages/societies/useSocietyDetailPageState", () => ({
  useSocietyPageData: (...args) => useSocietyPageDataMock(...args),
  useSocietyInit: vi.fn(),
}));

vi.mock("../../components/society/society_detail/SocietyHero", () => ({
  default: () => <div>hero</div>,
}));

vi.mock("../../components/society/society_detail/SocietyInfo", () => ({
  default: () => <div>info</div>,
}));

vi.mock("../../components/society/society_detail/tabs/SocietyTabs", () => ({
  default: () => <div>tabs</div>,
}));

vi.mock("../../components/society/society_detail/SocietySidebar", () => ({
  default: () => <div>sidebar</div>,
}));

vi.mock("../../components/society/society_detail/image_handlers/CoverImageModal", () => ({
  default: ({ images }) => <div data-testid="cover-modal">{images.length}</div>,
}));

vi.mock("../../components/society/society_detail/image_handlers/ImageGalleryModal", () => ({
  default: ({ images, initialIndex }) => (
    <div data-testid="gallery-modal">
      <span>{images.length}</span>
      <span>{initialIndex}</span>
    </div>
  ),
}));

vi.mock("../../components/society/society_detail/SettingsModal", () => ({
  default: ({ members, ratificationStatus, isRatified, isAdmin }) => (
    <div data-testid="settings-modal">
      <span>{members.length}</span>
      <span>{ratificationStatus}</span>
      <span>{String(isRatified)}</span>
      <span>{String(isAdmin)}</span>
    </div>
  ),
}));

vi.mock("../../components/society/society_detail/ReportSocietyModal", () => ({
  default: ({ society }) => <div data-testid="report-modal">{society.name}</div>,
}));

vi.mock("../../components/society/society_detail/MemberDirectoryModal", () => ({
  default: ({ societyName, isAdmin }) => (
    <div data-testid="members-modal">
      <span>{societyName}</span>
      <span>{String(isAdmin)}</span>
    </div>
  ),
}));

vi.mock("../../components/society/society_detail/tabs/announcement_tab/AnnouncementModal", () => ({
  default: ({ societyId, tags = [] }) => (
    <div data-testid="announcement-modal">
      <span>{societyId}</span>
      <span>{tags.join(",")}</span>
    </div>
  ),
}));

vi.mock("../../components/common/back_button/BackButton.jsx", () => ({
  default: ({ label }) => <button type="button">{label}</button>,
}));

import SocietyDetailPage from "../../pages/societies/SocietyDetailPage";

const modalDataDefaults = {
  society: {
    name: "Drama Society",
    role: "editor",
    is_admin: true,
    images: [{ url: "cover-1" }, { url: "cover-2" }],
    tags: ["arts", "events"],
    ratification_status: "pending",
    is_ratified: false,
  },
  members: [{ id: 1 }, { id: 2 }],
  modals: {
    showSettings: true,
    showReportModal: true,
    galleryOpen: { index: 1 },
    showCoverModal: true,
    showMembersModal: true,
    editingAnnouncement: { id: 9 },
  },
};

function buildData(overrides = {}) {
  return buildPageData(mergeNested(modalDataDefaults, overrides, ["society", "modals"]));
}

describe("SocietyDetailPage modal props", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes the expected image, member, and announcement data into open modals", () => {
    useSocietyPageDataMock.mockReturnValue(buildData());
    render(
      <MemoryRouter>
        <SocietyDetailPage societyId={55} onBack={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("settings-modal")).toHaveTextContent("2");
    expect(screen.getByTestId("settings-modal")).toHaveTextContent("pending");
    expect(screen.getByTestId("gallery-modal")).toHaveTextContent("2");
    expect(screen.getByTestId("gallery-modal")).toHaveTextContent("1");
    expect(screen.getByTestId("cover-modal")).toHaveTextContent("2");
    expect(screen.getByTestId("report-modal")).toHaveTextContent("Drama Society");
    expect(screen.getByTestId("members-modal")).toHaveTextContent("Drama Society");
    expect(screen.getByTestId("members-modal")).toHaveTextContent("true");
    expect(screen.getByTestId("announcement-modal")).toHaveTextContent("55");
    expect(screen.getByTestId("announcement-modal")).toHaveTextContent("arts,events");
  });

  it("marks member directory as non-admin when the society role is not elevated", () => {
    useSocietyPageDataMock.mockReturnValue(buildData({
      society: { role: "member", is_admin: false },
    }));

    render(
      <MemoryRouter>
        <SocietyDetailPage societyId={3} onBack={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("members-modal")).toHaveTextContent("false");
    fireEvent.click(screen.getByTitle("Report Society"));
    expect(screen.queryByTitle("Settings")).not.toBeInTheDocument();
  });
});
