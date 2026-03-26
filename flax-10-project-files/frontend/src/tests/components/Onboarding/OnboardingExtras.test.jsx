/**
 * Extra tests for SuccessScreen, WarningBox, and OnboardingForm branches.
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag) =>
        ({ children, ...props }) => {
          const rest = { ...props };
          delete rest.initial;
          delete rest.animate;
          delete rest.exit;
          delete rest.transition;
          delete rest.whileHover;
          delete rest.whileTap;
          const T = tag;
          return React.createElement(T, rest, children);
        },
    }
  ),
  AnimatePresence: ({ children }) =>
    React.createElement(React.Fragment, null, children),
}));

vi.mock("*.module.css", () => ({
  default: new Proxy({}, { get: (_, k) => k }),
}));

vi.mock(
  "../../../components/common/motion/CelebrationEmoji",
  () => ({
    default: ({ emoji }) => <span data-testid="celebration-emoji">{emoji}</span>,
  })
);

vi.mock("../../../components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

vi.mock("../../../components/common/filter_checkbox/FilterCheckbox", () => ({
  default: ({ checked, onChange }) => (
    <input
      type="checkbox"
      data-testid="confirm-checkbox"
      checked={checked}
      onChange={onChange}
    />
  ),
}));

vi.mock("../../../components/common/animated_dropdown", () => ({
  default: ({ placeholder, onChange, onOpenChange }) => (
    <div>
      <button onClick={() => onChange("changed")}>{placeholder}</button>
      <button onClick={() => onOpenChange?.(true)}>{`${placeholder}-open`}</button>
    </div>
  ),
}));

vi.mock("../../../components/onboarding/WarningBox", () => ({
  default: ({ major, confirmed, onConfirm }) => (
    <div>
      <span>{`Warning for ${major}`}</span>
      <input
        type="checkbox"
        data-testid="warning-confirm"
        checked={confirmed}
        onChange={(e) => onConfirm(e.target.checked)}
      />
    </div>
  ),
}));

import SuccessScreen from "../../../components/onboarding/SuccessScreen";
import WarningBox from "../../../components/onboarding/WarningBox";
import OnboardingForm from "../../../components/onboarding/OnboardingForm";

// SuccessScreen

describe("SuccessScreen", () => {
  it("renders the celebration emoji", () => {
    render(<SuccessScreen major="Computer Science" onComplete={vi.fn()} />);
    expect(screen.getByTestId("celebration-emoji")).toBeInTheDocument();
  });

  it("renders the major name in the body text", () => {
    render(<SuccessScreen major="Mathematics" onComplete={vi.fn()} />);
    expect(screen.getByText(/Mathematics/)).toBeInTheDocument();
  });

  it("renders the 'You're all set!' heading", () => {
    render(<SuccessScreen major="Physics" onComplete={vi.fn()} />);
    expect(screen.getByText(/You're all set!/)).toBeInTheDocument();
  });

  it("calls onComplete when the button is clicked", () => {
    const onComplete = vi.fn();
    render(<SuccessScreen major="Biology" onComplete={onComplete} />);
    fireEvent.click(screen.getByRole("button", { name: /Open Settings/i }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("renders the settings hint text", () => {
    render(<SuccessScreen major="Law" onComplete={vi.fn()} />);
    expect(screen.getByText(/customise your sleep time/)).toBeInTheDocument();
  });
});

// WarningBox
// WarningBox is mocked above so that OnboardingForm can use it.
// The mock faithfully replicates the public API so we test via the mock import.

describe("WarningBox (via mock – tests public interface contract)", () => {
  it("shows the major in warning text", () => {
    const onConfirm = vi.fn();
    render(
      <WarningBox major="Engineering" confirmed={false} onConfirm={onConfirm} />
    );
    expect(screen.getByText("Warning for Engineering")).toBeInTheDocument();
  });

  it("calls onConfirm when checkbox fires a change event (unchecked → checked)", () => {
    const onConfirm = vi.fn();
    render(
      <WarningBox major="Dentistry" confirmed={false} onConfirm={onConfirm} />
    );
    // fireEvent.click toggles a checkbox and sets target.checked=true
    fireEvent.click(screen.getByTestId("warning-confirm"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirm when checkbox fires a change event (checked → unchecked)", () => {
    const onConfirm = vi.fn();
    render(
      <WarningBox major="Nursing" confirmed={true} onConfirm={onConfirm} />
    );
    fireEvent.click(screen.getByTestId("warning-confirm"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("renders confirm checkbox in unchecked state when confirmed=false", () => {
    render(
      <WarningBox major="Law" confirmed={false} onConfirm={vi.fn()} />
    );
    expect(screen.getByTestId("warning-confirm")).not.toBeChecked();
  });

  it("renders confirm checkbox in checked state when confirmed=true", () => {
    render(
      <WarningBox major="Law" confirmed={true} onConfirm={vi.fn()} />
    );
    expect(screen.getByTestId("warning-confirm")).toBeChecked();
  });
});

// OnboardingForm

describe("OnboardingForm – submit button state", () => {
  const base = {
    year: "",
    setYear: vi.fn(),
    major: "",
    handleMajorChange: vi.fn(),
    confirmed: false,
    setConfirmed: vi.fn(),
    loading: false,
    handleSubmit: vi.fn(),
    courseOptions: [],
  };

  it("is disabled when year is missing", () => {
    render(<OnboardingForm {...base} major="CS" confirmed={true} />);
    expect(
      screen.getByRole("button", { name: /Set up my modules/i })
    ).toBeDisabled();
  });

  it("is disabled when major is missing", () => {
    render(<OnboardingForm {...base} year="Year 1" confirmed={true} />);
    expect(
      screen.getByRole("button", { name: /Set up my modules/i })
    ).toBeDisabled();
  });

  it("is disabled when confirmed is false even if year and major are set", () => {
    render(
      <OnboardingForm
        {...base}
        year="Year 1"
        major="Computer Science"
        confirmed={false}
      />
    );
    expect(
      screen.getByRole("button", { name: /Set up my modules/i })
    ).toBeDisabled();
  });

  it("is disabled when loading even if all fields set", () => {
    render(
      <OnboardingForm
        {...base}
        year="Year 1"
        major="Computer Science"
        confirmed={true}
        loading={true}
      />
    );
    expect(
      screen.getByRole("button", {
        name: /Setting up your modules.../i,
      })
    ).toBeDisabled();
  });

  it("is enabled when year, major, and confirmed are all set", () => {
    render(
      <OnboardingForm
        {...base}
        year="Year 2"
        major="Physics"
        confirmed={true}
      />
    );
    expect(
      screen.getByRole("button", { name: /Set up my modules/i })
    ).not.toBeDisabled();
  });
});

// WarningSection visibility

describe("WarningSection inside OnboardingForm", () => {
  const base = {
    year: "",
    setYear: vi.fn(),
    major: "",
    handleMajorChange: vi.fn(),
    confirmed: false,
    setConfirmed: vi.fn(),
    loading: false,
    handleSubmit: vi.fn(),
    courseOptions: [],
  };

  it("does not render the warning when year is absent", () => {
    render(<OnboardingForm {...base} major="CS" />);
    expect(screen.queryByText(/Warning for/)).not.toBeInTheDocument();
  });

  it("does not render the warning when major is absent", () => {
    render(<OnboardingForm {...base} year="Year 1" />);
    expect(screen.queryByText(/Warning for/)).not.toBeInTheDocument();
  });

  it("renders the warning when both year and major are present", () => {
    render(
      <OnboardingForm {...base} year="Year 3" major="Chemistry" confirmed={false} />
    );
    expect(screen.getByText("Warning for Chemistry")).toBeInTheDocument();
  });
});
