import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const shareCalendarMock = vi.fn(() => new Promise(() => {}));
const unshareCalendarMock = vi.fn(() => Promise.resolve({}));

vi.mock("../../../../api/socialApi", () => ({
  shareCalendar: (...args) => shareCalendarMock(...args),
  unshareCalendar: (...args) => unshareCalendarMock(...args),
}));

vi.mock("../../../../components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, onClick }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

import ShareButton from "../../../../components/social/components/ShareButton";

describe("ShareButton loading guard", () => {
  it("ignores follow-up clicks while the internal loading flag is true", () => {
    render(<ShareButton userId={44} initialIsSharing={false} />);

    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("...")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button"));
    expect(shareCalendarMock).toHaveBeenCalledTimes(1);
    expect(unshareCalendarMock).not.toHaveBeenCalled();
  });
});
