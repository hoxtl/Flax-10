import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import WidgetHeader from "../../../../components/common/widget_header/WidgetHeader";

function TestIcon(props) {
  return <svg data-testid="widget-icon" {...props} />;
}

describe("WidgetHeader", () => {
  it("renders title, icon, meta, actions, and count", () => {
    render(
      <WidgetHeader
        icon={TestIcon}
        title="Upcoming"
        meta="Today"
        actions={<button type="button">Action</button>}
        count={3}
      />,
    );

    expect(screen.getByText("Upcoming")).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByTestId("widget-icon")).toBeInTheDocument();
  });

  it("omits optional parts when icon, meta, actions, and count are not provided", () => {
    render(<WidgetHeader title="Plain Header" divider={false} />);

    expect(screen.getByText("Plain Header")).toBeInTheDocument();
    expect(screen.queryByTestId("widget-icon")).not.toBeInTheDocument();
    expect(screen.queryByText("Today")).not.toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("still renders a zero count because zero is a valid count", () => {
    render(<WidgetHeader title="Zero Count" count={0} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
