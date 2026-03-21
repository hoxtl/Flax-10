import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get:
        (_, tag) =>
        ({ children, ...p }) => {
          const { initial, animate, exit, transition, ...rest } = p;
          const Tag = ["h1", "p", "div"].includes(tag) ? tag : "div";
          return <Tag {...rest}>{children}</Tag>;
        },
    },
  ),
}));

vi.mock("../../pages/Banned/BannedPage.module.css", () => ({
  default: {
    page: "page",
    icon: "icon",
    heading: "heading",
    reason: "reason",
    reasonEmphasis: "reasonEmphasis",
    backBtn: "backBtn",
  },
}));

import BannedPage from "../../pages/Banned/BannedPage";

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("BannedPage", () => {
  it("renders the suspended heading", () => {
    render(<BannedPage />);
    expect(
      screen.getByRole("heading", { name: /your account has been suspended/i }),
    ).toBeTruthy();
  });

  it("renders the 🚫 icon", () => {
    render(<BannedPage />);
    expect(screen.getByText("🚫")).toBeTruthy();
  });

  it("renders generic message when no reason provided", () => {
    render(<BannedPage />);
    expect(screen.getByText(/suspended by an administrator/i)).toBeTruthy();
  });

  it("renders generic message when reason is empty string", () => {
    render(<BannedPage reason="" />);
    expect(screen.getByText(/suspended by an administrator/i)).toBeTruthy();
  });

  it("renders ban reason when provided", () => {
    render(<BannedPage reason="Spam" />);
    expect(screen.getByText("Spam")).toBeTruthy();
  });

  it("renders Back to Sign In button", () => {
    render(<BannedPage />);
    expect(
      screen.getByRole("button", { name: /back to sign in/i }),
    ).toBeTruthy();
  });

  it("clicking back button removes banned flag from localStorage", () => {
    localStorage.setItem("banned", "1");
    render(<BannedPage />);
    fireEvent.click(screen.getByRole("button", { name: /back to sign in/i }));
    expect(localStorage.getItem("banned")).toBeNull();
  });

  it("clicking back button removes ban_reason from localStorage", () => {
    localStorage.setItem("ban_reason", "Spam");
    render(<BannedPage />);
    fireEvent.click(screen.getByRole("button", { name: /back to sign in/i }));
    expect(localStorage.getItem("ban_reason")).toBeNull();
  });

  it("clicking back button removes token from localStorage", () => {
    localStorage.setItem("token", "abc123");
    render(<BannedPage />);
    fireEvent.click(screen.getByRole("button", { name: /back to sign in/i }));
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("clicking back button removes user from localStorage", () => {
    localStorage.setItem("user", JSON.stringify({ id: 1 }));
    render(<BannedPage />);
    fireEvent.click(screen.getByRole("button", { name: /back to sign in/i }));
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("clicking back button fires auth-changed event", () => {
    const handler = vi.fn();
    window.addEventListener("auth-changed", handler);
    render(<BannedPage />);
    fireEvent.click(screen.getByRole("button", { name: /back to sign in/i }));
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener("auth-changed", handler);
  });

  it("clicking back works even when localStorage is empty", () => {
    expect(() => {
      render(<BannedPage />);
      fireEvent.click(screen.getByRole("button", { name: /back to sign in/i }));
    }).not.toThrow();
  });
});
