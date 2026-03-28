import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../../../components/Auth/components/AuthHeroGeometric", () => ({ default: () => <div /> }));
vi.mock("../../../../components/Auth/components/AuthBranding", () => ({
  AuthBrand: () => <div />,
  AuthFooter: () => <div />,
}));

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ token: "fallback-token" }),
  };
});

describe("PasswordResetConfirm env fallback", () => {
  let fetchMock;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VITE_API_BASE_URL", "");
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Password reset successfully." }),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("posts to the /api fallback when no API base URL is configured", async () => {
    const { default: PasswordResetConfirm } = await import("../../../../pages/auth/PasswordResetConfirm");

    render(
      <MemoryRouter>
        <PasswordResetConfirm />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("New Password"), {
      target: { value: "pass1234", name: "new_password" },
    });
    fireEvent.change(screen.getByLabelText("Confirm New Password"), {
      target: { value: "pass1234", name: "confirm_password" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Reset Password" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/auth/password-reset/confirm/",
        expect.objectContaining({ method: "POST" }),
      ),
    );
    await waitFor(() => expect(screen.getByText("Password reset successfully.")).toBeInTheDocument());
  });
});
