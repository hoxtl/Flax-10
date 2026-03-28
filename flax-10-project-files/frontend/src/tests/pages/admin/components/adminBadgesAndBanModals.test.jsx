/*
 * Tests for AdminBadges, BanUserModal, BanReportedSocietyModal, and adminTabs.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("../../../../pages/admin/styles/styles", () => ({
  default: {
    badge: "badge", badgeAdmin: "badgeAdmin", badgeStudent: "badgeStudent",
    badgeTeacher: "badgeTeacher", roleTag: "roleTag", roleAdmin: "roleAdmin",
    roleStudent: "roleStudent", roleTeacher: "roleTeacher",
    badgeActive: "badgeActive", badgeBanned: "badgeBanned",
    banModal: "banModal", banModalContent: "banModalContent", banForm: "banForm",
    banModalIconWrap: "banModalIconWrap", reasonLabel: "reasonLabel",
    requiredMark: "requiredMark", reasonInput: "reasonInput",
    modalActions: "modalActions", cancelActionBtn: "cancelActionBtn",
    confirmActionBtn: "confirmActionBtn", banBtn: "banBtn", dismissBtn: "dismissBtn",
  },
}));

vi.mock("../../../../components/common/standard_modal/StandardModal", () => ({
  default: ({ children, title, onClose }) => (
    <div>
      <span>{title}</span>
      <button type="button" onClick={onClose}>close-modal</button>
      {children}
    </div>
  ),
}));

vi.mock("../../../../components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, onClick, disabled, type }) => (
    <button type={type || "button"} onClick={onClick} disabled={disabled}>{children}</button>
  ),
}));

vi.mock("lucide-react", () => ({
  Ban: () => <svg data-testid="ban-icon" />,
}));

vi.mock("../../../../pages/admin/components/UsersTab", () => ({ default: () => <div>UsersTab</div> }));
vi.mock("../../../../pages/admin/components/RatificationsTab", () => ({ default: () => <div>RatificationsTab</div> }));
vi.mock("../../../../pages/admin/components/ReportedSocietiesTab", () => ({ default: () => <div>ReportedSocietiesTab</div> }));
vi.mock("../../../../pages/admin/components/CourseChangeRequestsTab", () => ({ default: () => <div>CourseChangeRequestsTab</div> }));

import { RoleBadge, MobileRoleBadge, StatusBadge } from "../../../../pages/admin/components/AdminBadges";
import BanUserModal from "../../../../pages/admin/components/BanUserModal";
import BanReportedSocietyModal from "../../../../pages/admin/components/BanReportedSocietyModal";
import { buildAdminTabs } from "../../../../pages/admin/components/adminTabs";

describe("RoleBadge", () => {
  it("renders Admin for admin role", () => {
    render(<RoleBadge role="admin" />);
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("renders Teacher for teacher role", () => {
    render(<RoleBadge role="teacher" />);
    expect(screen.getByText("Teacher")).toBeInTheDocument();
  });

  it("renders Student for student role", () => {
    render(<RoleBadge role="student" />);
    expect(screen.getByText("Student")).toBeInTheDocument();
  });

  it("renders formatted text and uses fallback style for an unknown role", () => {
    render(<RoleBadge role="super_admin" />);
    expect(screen.getByText("super admin")).toBeInTheDocument();
  });
});

describe("MobileRoleBadge", () => {
  it("renders Admin for admin role", () => {
    render(<MobileRoleBadge role="admin" />);
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("renders formatted text and uses fallback style for an unknown role", () => {
    render(<MobileRoleBadge role="guest_user" />);
    expect(screen.getByText("guest user")).toBeInTheDocument();
  });
});

describe("StatusBadge", () => {
  it("renders Active when active is true", () => {
    render(<StatusBadge active={true} />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders Banned when active is false", () => {
    render(<StatusBadge active={false} />);
    expect(screen.getByText("Banned")).toBeInTheDocument();
  });
});

describe("BanUserModal", () => {
  const user = { id: 7, username: "jsmith" };

  it("shows the username in the modal title", () => {
    render(<BanUserModal user={user} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText("Ban jsmith?")).toBeInTheDocument();
  });

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = vi.fn();
    render(<BanUserModal user={user} onConfirm={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("disables Ban User button when reason is empty", () => {
    render(<BanUserModal user={user} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText("Ban User")).toBeDisabled();
  });

  it("enables Ban User button when a reason is typed", () => {
    render(<BanUserModal user={user} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Spamming" } });
    expect(screen.getByText("Ban User")).not.toBeDisabled();
  });

  it("does not call onConfirm when submitted with blank/whitespace reason", () => {
    const onConfirm = vi.fn();
    render(<BanUserModal user={user} onConfirm={onConfirm} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "   " } });
    fireEvent.submit(screen.getByRole("textbox").closest("form"));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("calls onConfirm with trimmed reason on valid submission", () => {
    const onConfirm = vi.fn();
    render(<BanUserModal user={user} onConfirm={onConfirm} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "  Violating rules  " } });
    fireEvent.submit(screen.getByRole("textbox").closest("form"));
    expect(onConfirm).toHaveBeenCalledWith("Violating rules");
  });
});

describe("BanReportedSocietyModal", () => {
  const report = { id: 3, society_name: "Chess Club" };

  it("shows the society name in the modal title", () => {
    render(<BanReportedSocietyModal report={report} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText("Ban Chess Club?")).toBeInTheDocument();
  });

  it("falls back to 'this society' when society_name is missing", () => {
    render(<BanReportedSocietyModal report={{ id: 1 }} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText("Ban this society?")).toBeInTheDocument();
  });

  it("calls onConfirm with trimmed reason on submit", () => {
    const onConfirm = vi.fn();
    render(<BanReportedSocietyModal report={report} onConfirm={onConfirm} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "  Policy breach  " } });
    fireEvent.submit(screen.getByRole("textbox").closest("form"));
    expect(onConfirm).toHaveBeenCalledWith("Policy breach");
  });

  it("calls onCancel when Cancel is clicked and not busy", () => {
    const onCancel = vi.fn();
    render(<BanReportedSocietyModal report={report} onConfirm={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("does not call onCancel when busy=true and Cancel is clicked", () => {
    const onCancel = vi.fn();
    render(<BanReportedSocietyModal report={report} onConfirm={vi.fn()} onCancel={onCancel} busy={true} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("disables textarea and buttons when busy", () => {
    render(<BanReportedSocietyModal report={report} onConfirm={vi.fn()} onCancel={vi.fn()} busy={true} />);
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByText("Ban Society")).toBeDisabled();
    expect(screen.getByText("Cancel")).toBeDisabled();
  });

  it("does not call onCancel when close-modal is clicked while busy", () => {
    const onCancel = vi.fn();
    render(<BanReportedSocietyModal report={report} onConfirm={vi.fn()} onCancel={onCancel} busy={true} />);
    fireEvent.click(screen.getByText("close-modal"));
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("calls onCancel when close-modal is clicked while not busy", () => {
    const onCancel = vi.fn();
    render(<BanReportedSocietyModal report={report} onConfirm={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("close-modal"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("uses pending as the input id suffix when report has no id", () => {
    render(<BanReportedSocietyModal report={{}} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(document.getElementById("ban-society-reason-pending")).toBeInTheDocument();
  });
});

describe("buildAdminTabs", () => {
  it("returns 4 tabs with correct ids, icons, and labels", () => {
    const tabs = buildAdminTabs(vi.fn());
    expect(tabs).toHaveLength(4);
    expect(tabs[0]).toMatchObject({ id: "users", label: "Users Overview" });
    expect(tabs[1]).toMatchObject({ id: "ratifications", label: "Society Ratifications" });
    expect(tabs[2]).toMatchObject({ id: "reports", label: "Reported Societies" });
    expect(tabs[3]).toMatchObject({ id: "course-changes", label: "Course Switch Requests" });
  });

  it("each tab has a renderable content element", () => {
    const tabs = buildAdminTabs(vi.fn());
    tabs.forEach(({ content }) => {
      expect(() => render(<div>{content}</div>)).not.toThrow();
    });
  });
});
