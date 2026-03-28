/*
 * Tests the modal props wired by the society detail page.
 */

import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSocietyDetailPageModalData,
  renderSocietyDetailPage,
  societyDetailPageStateMocks,
} from "./societyDetailPageTestUtils.jsx";

import SocietyDetailPage from "../../../../pages/societies/components/SocietyDetailPage";

describe("SocietyDetailPage modal props", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes the expected image, member, and announcement data into open modals", () => {
    societyDetailPageStateMocks.useSocietyPageDataMock.mockReturnValue(createSocietyDetailPageModalData());
    renderSocietyDetailPage(<SocietyDetailPage societyId={55} onBack={vi.fn()} />);

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
    societyDetailPageStateMocks.useSocietyPageDataMock.mockReturnValue(
      createSocietyDetailPageModalData({ society: { role: "member", is_admin: false } }),
    );

    renderSocietyDetailPage(<SocietyDetailPage societyId={3} onBack={vi.fn()} />);

    expect(screen.getByTestId("members-modal")).toHaveTextContent("false");
    fireEvent.click(screen.getByTitle("Report Society"));
    expect(screen.queryByTitle("Settings")).not.toBeInTheDocument();
  });
});
