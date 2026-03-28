import { vi } from "vitest";

export const useToastMock = vi.fn(() => vi.fn());
export const getCurrentMemberMock = vi.fn(() => null);

vi.mock("@/context/ToastContext", () => ({
  useToast: () => useToastMock(),
}));

vi.mock("@/pages/group_work/utils/memberAvatarUtils", () => ({
  getCurrentMember: (...args) => getCurrentMemberMock(...args),
}));

vi.mock("@/components/common/hold_confirm_modal/HoldConfirmModal", () => ({
  default: ({ title, cancelLabel, holdLabel, onCancel, onConfirm }) => (
    <div data-testid="hold-confirm-modal">
      <span>{title}</span>
      <button type="button" onClick={onCancel}>{cancelLabel}</button>
      <button type="button" onClick={onConfirm}>{holdLabel}</button>
    </div>
  ),
}));

vi.mock("@/pages/group_work/components/EditProjectModal", () => ({
  default: ({ onClose }) => (
    <div data-testid="edit-project-modal">
      <button type="button" onClick={onClose}>Close edit</button>
    </div>
  ),
}));

vi.mock("@/components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, onClick, type = "button", disabled, pill, ...rest }) => (
    <button type={type} onClick={onClick} disabled={disabled} {...rest}>{children}</button>
  ),
}));

vi.mock("lucide-react", () => ({
  Trash2: () => <svg data-testid="icon-trash" />,
  LogOut: () => <svg data-testid="icon-logout" />,
  Settings: () => <svg data-testid="icon-settings" />,
}));

export function resetProjectHeaderSubHarness() {
  useToastMock.mockReset();
  useToastMock.mockImplementation(() => vi.fn());
  getCurrentMemberMock.mockReset();
  getCurrentMemberMock.mockImplementation(() => null);
}
