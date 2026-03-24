import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import AppPage from "../../../components/common/AppPage/AppPage";

vi.mock("../../../components/common/BackButton/BackButton.jsx", () => ({
  default: ({ onClick, label }) => <button type="button" onClick={onClick}>{label}</button>,
}));

vi.mock("../../../components/common/PageHeader/PageHeader", () => ({
  default: ({ title, subtitle, action, onBack }) => (
    <div data-testid="page-header">
      <div>{title}</div>
      <div>{subtitle}</div>
      <div>{action}</div>
      <button type="button" onClick={onBack}>header-back</button>
    </div>
  ),
}));

describe("AppPage", () => {
  it("renders inline back controls through the header with toolbar and width classes", () => {
    const onBack = vi.fn();
    render(
      <AppPage
        title="Dashboard"
        subtitle="Summary"
        action={<span>Action</span>}
        onBack={onBack}
        toolbar={<span>Toolbar</span>}
        width="sm"
        className="page-x"
        contentClassName="content-x"
        data-testid="page"
      >
        <div>Body</div>
      </AppPage>,
    );

    const page = screen.getByTestId("page");
    expect(page.className).toContain("page-x");
    expect(page.className.split(" ").filter(Boolean).length).toBeGreaterThan(1);
    expect(screen.getByText("Toolbar")).toBeInTheDocument();
    fireEvent.click(screen.getByText("header-back"));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Body").parentElement.className).toContain("content-x");
  });

  it("renders the back button above the header when requested", () => {
    const onBack = vi.fn();
    render(
      <AppPage title="Modules" onBack={onBack} backLabel="Return" backPlacement="above">
        <div>Child</div>
      </AppPage>,
    );

    fireEvent.click(screen.getByText("Return"));
    expect(onBack).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText("header-back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders content without a header when no header props are provided", () => {
    render(<AppPage><div>No header body</div></AppPage>);
    expect(screen.queryByTestId("page-header")).not.toBeInTheDocument();
    expect(screen.getByText("No header body")).toBeInTheDocument();
  });
});
