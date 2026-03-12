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

