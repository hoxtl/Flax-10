import { vi } from "vitest";

export const motionDivMock = vi.fn(({ children, ...props }) => {
  const { initial, animate, transition, ...rest } = props;
  return <div {...rest}>{children}</div>;
});

export const animatePresenceMock = vi.fn(({ children }) => <>{children}</>);

vi.mock("framer-motion", () => ({
  motion: {
    div: (props) => motionDivMock(props),
  },
  AnimatePresence: (props) => animatePresenceMock(props),
}));

export const tooltipRenderMock = vi.fn(({ children, content, wrapperClassName }) => (
  <div data-tooltip={content} className={wrapperClassName}>
    {children}
  </div>
));

vi.mock("@/components/common/tooltip/Tooltip", () => ({
  default: (props) => tooltipRenderMock(props),
}));
