import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../../../components/Auth/components/AuthHeroGeometric", () => ({ default: () => <div /> }));
vi.mock("../../../../components/Auth/components/AuthBranding", () => ({
  AuthBrand: () => <div />,
  AuthFooter: () => <div />,
}));

describe("PasswordResetRequest env fallback", () => {
  let fetchMock;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VITE_API_BASE_URL", "");
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Check your inbox." }),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("posts to the /api fallback when no API base URL is configured", async () => {
    const { default: PasswordResetRequest } = await import("../../../../pages/auth/PasswordResetRequest");

    render(
      <MemoryRouter>
        <PasswordResetRequest />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Email Address"), {
      target: { value: "fallback@example.com" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Send Reset Link" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/auth/password-reset/request/",
        expect.objectContaining({ method: "POST" }),
      ),
    );
    await waitFor(() => expect(screen.getByText("Check your inbox.")).toBeInTheDocument());
  });
});
