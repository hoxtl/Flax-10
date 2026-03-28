import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import GroupWorkUserSearchEmptyState from "@/pages/group_work/components/GroupWorkUserSearchEmptyState";

describe("GroupWorkUserSearchEmptyState", () => {
  const onClear = vi.fn();

  it("renders with basic props correctly", () => {
    // Hits lines 10-22
    render(<GroupWorkUserSearchEmptyState query="test-query" clear={onClear} />);
    expect(screen.getByText(/No users match "test-query"/i)).toBeTruthy();
  });

  it("renders directly without a wrapper when wrapperClassName is omitted", () => {
    // Hits line 25: return props.wrapperClassName ? ... : content;
    const { container } = render(<GroupWorkUserSearchEmptyState />);
    // The top-most element should NOT be a wrapper div
    expect(container.firstChild).toHaveClass("_card_1597b4"); // This is SearchEmptyState's root
  });

  it("handles clearing correctly", () => {
    render(<GroupWorkUserSearchEmptyState query="q" clear={onClear} />);
    // SearchEmptyState has a "Clear search" button
    const clearBtn = screen.getByRole("button", { name: /Clear search/i });
    fireEvent.click(clearBtn);
    expect(onClear).toHaveBeenCalled();
  });

  it("applies class names correctly", () => {
    const { container } = render(
      <GroupWorkUserSearchEmptyState 
        className="custom-class"
        titleClassName="title-class"
        hintClassName="hint-class"
      />
    );
    
    // SearchEmptyState: root level card should have custom-class
    // It's the first child usually (or second after wrapper)
    const card = container.querySelector(".custom-class");
    expect(card).toBeTruthy();
    expect(container.querySelector(".title-class")).toBeTruthy();
    expect(container.querySelector(".hint-class")).toBeTruthy();
  });

  it("renders within a wrapper div when wrapperClassName is provided", () => {
    // Hits line 24: props.wrapperClassName ? <div className={props.wrapperClassName}>{content}</div> : content;
    const { container } = render(
      <GroupWorkUserSearchEmptyState wrapperClassName="wrapper-div" />
    );
    
    const wrapper = container.querySelector(".wrapper-div");
    expect(wrapper).toBeTruthy();
  });

  it("renders directly without a wrapper when wrapperClassName is omitted", () => {
    const { container } = render(<GroupWorkUserSearchEmptyState />);
    // The top-most element should NOT be wrapper-div
    // SearchEmptyState's root class is _card_1597b4 (actual)
    // We just check it's not wrapped in something else.
    expect(container.firstChild.getAttribute("class")).not.toContain("wrapper-div");
  });
});
