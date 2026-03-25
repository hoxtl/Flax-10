import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useSyncNavFromUrl } from "../../app/hooks/useSyncNavFromUrl";

function Harness({ pathname, setActiveNav }) {
  useSyncNavFromUrl(pathname, setActiveNav);
  return null;
}

describe("useSyncNavFromUrl", () => {
  it("syncs profile, settings, route ids, and leaves unknown routes untouched", () => {
    const setActiveNav = vi.fn();
    const { rerender } = render(<Harness pathname="/profile" setActiveNav={setActiveNav} />);

    expect(setActiveNav).toHaveBeenLastCalledWith("profile");

    rerender(<Harness pathname="/profile/42" setActiveNav={setActiveNav} />);
    expect(setActiveNav).toHaveBeenLastCalledWith("profile_42");

    rerender(<Harness pathname="/settings" setActiveNav={setActiveNav} />);
    expect(setActiveNav).toHaveBeenLastCalledWith("settings");

    rerender(<Harness pathname="/tasks" setActiveNav={setActiveNav} />);
    expect(setActiveNav).toHaveBeenLastCalledWith("tasks");

    const callsBeforeUnknown = setActiveNav.mock.calls.length;
    rerender(<Harness pathname="/unknown" setActiveNav={setActiveNav} />);
    expect(setActiveNav).toHaveBeenCalledTimes(callsBeforeUnknown);

    rerender(<Harness pathname={undefined} setActiveNav={setActiveNav} />);
    expect(setActiveNav).toHaveBeenLastCalledWith("home");
  });
});
