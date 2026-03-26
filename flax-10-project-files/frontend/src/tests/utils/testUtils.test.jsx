import React from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { act } from "@testing-library/react";

import { render, renderHook, screen } from "../../utils/testUtils";
import { useAuth } from "../../context/AuthContext";

function ExtraWrapper({ children }) {
  return <section data-testid="extra-wrapper">{children}</section>;
}

function AuthProbe() {
  const { authenticated, user } = useAuth();
  return <div>{authenticated ? user?.first_name : "anonymous"}</div>;
}

describe("test-utils", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("wraps rendered components with auth context and an extra wrapper", () => {
    localStorage.setItem("token", "token");
    localStorage.setItem("user", JSON.stringify({ first_name: "Ava" }));

    render(<AuthProbe />, { wrapper: ExtraWrapper });

    expect(screen.getByTestId("extra-wrapper")).toBeInTheDocument();
    expect(screen.getByText("Ava")).toBeInTheDocument();
  });

  it("wraps hooks and falls back to null when stored user JSON is invalid", async () => {
    localStorage.setItem("user", "{bad-json");

    const { result } = renderHook(() => useAuth(), { wrapper: ExtraWrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(result.current.authenticated).toBe(false);

    act(() => {
      result.current.setAuthenticated(true);
    });

    await expect(result.current.refreshProfile()).resolves.toBeNull();
  });
});
