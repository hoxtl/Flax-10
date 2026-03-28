import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import FormField from "../../../../components/common/form_field/FormField";

describe("FormField", () => {
  it("renders label, hint, and custom classes", () => {
    render(
      <FormField
        label="Email"
        hint="Use your university address"
        htmlFor="email"
        className="field-extra"
        labelClassName="label-extra"
      >
        <input id="email" />
      </FormField>
    );

    const label = screen.getByText("Email");
    expect(label).toBeInTheDocument();
    expect(label.className).toContain("label-extra");
    expect(label.closest("label")).toHaveAttribute("for", "email");
    expect(label.closest("label").className).toContain("field-extra");
    expect(screen.getByText("Use your university address")).toBeInTheDocument();
  });

  it("prefers the error over the hint and supports unlabeled fields", () => {
    const { container } = render(
      <FormField error="This field is required" hint="Hidden by error">
        <input aria-label="Plain input" />
      </FormField>
    );

    expect(screen.queryByText("Hidden by error")).not.toBeInTheDocument();
    expect(screen.getByText("This field is required")).toBeInTheDocument();
    expect(container.querySelector("label span")).toBeInTheDocument();
    expect(screen.queryByText("Email")).not.toBeInTheDocument();
  });

  it("renders the default label path without helper text", () => {
    render(
      <FormField label="Name">
        <input aria-label="Name input" />
      </FormField>
    );

    const label = screen.getByText("Name");
    expect(label).toBeInTheDocument();
    expect(label.className).not.toContain("label-extra");
    expect(label.closest("label").className).not.toContain("field-extra");
    expect(screen.queryByText("This field is required")).not.toBeInTheDocument();
  });
});
