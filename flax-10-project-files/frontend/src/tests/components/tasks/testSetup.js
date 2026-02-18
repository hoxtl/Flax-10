import { vi } from "vitest";

export function mockInlinePortal() {
  vi.mock("react-dom", async () => {
    const actual = await vi.importActual("react-dom");
    return { ...actual, createPortal: (node) => node };
  });
}

export function mockFramerMotion() {
  vi.mock("framer-motion", () => ({
    Reorder: {
      Group: ({ children, ...props }) => (
        <div data-testid="reorder-group" {...props}>
          {children}
        </div>
      ),
      Item: ({ children, ...props }) => (
        <div data-testid="reorder-item" {...props}>
          {children}
        </div>
      ),
    },
    AnimatePresence: ({ children }) => <>{children}</>,
  }));
}
