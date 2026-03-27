import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import AttendancePage from "../../../pages/attendance/AttendancePage";

const useAttendancePageModelMock = vi.fn();

vi.mock("../../../pages/attendance/hooks/useAttendancePageModel", () => ({
  useAttendancePageModel: () => useAttendancePageModelMock(),
}));

vi.mock("../../../components/common/app_page/AppPage", () => ({
  default: ({ title, subtitle, children }) => (
    <div>
      <h1>{title}</h1>
      <div>{subtitle}</div>
      {children}
    </div>
  ),
}));

vi.mock("../../../components/pagination/Pagination", () => ({
  BackToTop: () => <div>Back to top</div>,
}));

vi.mock("../../../pages/attendance/components/AttendancePageStatus", () => ({
  default: ({ loading, error }) => <div>Status: {String(loading)} / {String(error)}</div>,
}));

vi.mock("../../../pages/attendance/components/AttendancePageBody", () => ({
  default: ({ model }) => <div>Body: {model.summary?.pct}</div>,
}));

describe("AttendancePage", () => {
  it("shows the loading status view when data is loading", () => {
    useAttendancePageModelMock.mockReturnValue({ loading: true, error: null });
    render(<AttendancePage />);
    expect(screen.getByText("Status: true / null")).toBeInTheDocument();
    expect(screen.getByText("Back to top")).toBeInTheDocument();
  });

  it("shows the error status view when loading finishes with an error", () => {
    useAttendancePageModelMock.mockReturnValue({ loading: false, error: "Failed" });
    render(<AttendancePage />);
    expect(screen.getByText("Status: false / Failed")).toBeInTheDocument();
  });

  it("renders the page body when the model is ready", () => {
    useAttendancePageModelMock.mockReturnValue({ loading: false, error: null, summary: { pct: 91 } });
    render(<AttendancePage />);
    expect(screen.getByText("Body: 91")).toBeInTheDocument();
    expect(screen.getByText("My Venio Details")).toBeInTheDocument();
  });
});
