import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  TabButton,
  SettingsTabs,
  SuccessBanner,
  ErrorMessage,
  SectionHeader,
  SubmitButton,
  FormInput,
  FormSelect,
  ThemeSelector,
} from "../../../components/settings/SettingsUI";

vi.mock("../../../components/common/animated_dropdown", () => ({
  default: ({ value, onChange, options, placeholder, grouped }) => {
    const opts = grouped
      ? (options || []).flatMap((g) => g.options || [])
      : options || [];
    return (
      <select
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select your course</option>
        {opts.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  },
}));

describe("TabButton", () => {
  it("renders label", () => {
    render(
      <TabButton
        id="account"
        label="Account"
        isActive={false}
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByText("Account")).toBeTruthy();
  });

  it("calls onClick with id when clicked", () => {
    const onClick = vi.fn();
    render(
      <TabButton
        id="security"
        label="Security"
        isActive={false}
        onClick={onClick}
      />,
    );
    fireEvent.click(screen.getByText("Security"));
    expect(onClick).toHaveBeenCalledWith("security");
  });
});

describe("SettingsTabs", () => {
  it("renders preference tabs with updated labels", () => {
    render(<SettingsTabs activeTab="account" onChange={vi.fn()} />);
    expect(screen.getByText("Account")).toBeTruthy();
    expect(screen.getByText("Security")).toBeTruthy();
    expect(screen.getByText("Appearance")).toBeTruthy();
    expect(screen.getByText("Sleep Schedule")).toBeTruthy();
    expect(screen.getByText("Scheduling")).toBeTruthy();
    expect(screen.getByText("Location")).toBeTruthy();
  });

  it("calls onChange when a tab is clicked", () => {
    const onChange = vi.fn();
    render(<SettingsTabs activeTab="account" onChange={onChange} />);
    fireEvent.click(screen.getByText("Security"));
    expect(onChange).toHaveBeenCalledWith("security");
  });
});

describe("SuccessBanner", () => {
  it("returns null when no message", () => {
    const { container } = render(<SuccessBanner message="" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders message when provided", () => {
    render(<SuccessBanner message="Saved!" />);
    expect(screen.getByText("Saved!")).toBeTruthy();
    expect(screen.getByText("✓")).toBeTruthy();
  });
});

describe("ErrorMessage", () => {
  it("returns null when no message", () => {
    const { container } = render(<ErrorMessage message="" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders error message when provided", () => {
    render(<ErrorMessage message="Something went wrong" />);
    expect(screen.getByText("Something went wrong")).toBeTruthy();
    expect(screen.getByText("✕")).toBeTruthy();
  });
});

describe("SectionHeader", () => {
  it("renders title", () => {
    render(<SectionHeader title="Account Settings" />);
    expect(screen.getByText("Account Settings")).toBeTruthy();
  });

  it("renders description when provided", () => {
    render(<SectionHeader title="Settings" description="Update your info" />);
    expect(screen.getByText("Update your info")).toBeTruthy();
  });

  it("does not render description when not provided", () => {
    render(<SectionHeader title="Settings" />);
    expect(screen.queryByText("Update your info")).toBeNull();
  });
});

describe("SubmitButton", () => {
  it("renders label when not saving", () => {
    render(
      <SubmitButton isSaving={false} label="Save" savingLabel="Saving..." />,
    );
    expect(screen.getByText("Save")).toBeTruthy();
  });

  it("renders savingLabel when saving", () => {
    render(
      <SubmitButton isSaving={true} label="Save" savingLabel="Saving..." />,
    );
    expect(screen.getByText("Saving...")).toBeTruthy();
  });

  it("is disabled when saving", () => {
    render(
      <SubmitButton isSaving={true} label="Save" savingLabel="Saving..." />,
    );
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("is enabled when not saving", () => {
    render(
      <SubmitButton isSaving={false} label="Save" savingLabel="Saving..." />,
    );
    expect(screen.getByRole("button")).not.toBeDisabled();
  });
});

describe("FormInput", () => {
  it("renders label and input", () => {
    render(
      <FormInput id="name" label="Name" value="Alice" onChange={vi.fn()} />,
    );
    expect(screen.getByLabelText("Name")).toBeTruthy();
  });

  it("calls onChange when value changes", () => {
    const onChange = vi.fn();
    render(<FormInput id="name" label="Name" value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Bob" } });
    expect(onChange).toHaveBeenCalled();
  });

  it("shows remaining characters when maxLength is set", () => {
    render(
      <FormInput
        id="bio"
        label="Bio"
        value="Hello"
        onChange={vi.fn()}
        maxLength={20}
      />,
    );
    expect(screen.getByText("(15 characters remaining)")).toBeTruthy();
  });
});

describe("FormSelect", () => {
  const options = [
    { value: "opt1", label: "Option 1" },
    { value: "opt2", label: "Option 2" },
  ];

  it("renders label and select", () => {
    render(
      <FormSelect
        id="select"
        label="Choose"
        value="opt1"
        onChange={vi.fn()}
        options={options}
      />,
    );
    // AnimatedDropdown is mocked in this test suite and doesn't wire the label via htmlFor.
    expect(screen.getByText("Choose")).toBeTruthy();
    expect(screen.getByRole("combobox")).toBeTruthy();
  });

  it("renders flat options", () => {
    render(
      <FormSelect
        id="select"
        label="Choose"
        value=""
        onChange={vi.fn()}
        options={options}
      />,
    );
    expect(screen.getByText("Option 1")).toBeTruthy();
    expect(screen.getByText("Option 2")).toBeTruthy();
  });

  it("renders grouped options when grouped is true", () => {
    const grouped = [
      { label: "Group A", options: [{ value: "a1", label: "A1" }] },
    ];

    render(
      <FormSelect
        id="select"
        label="Choose"
        value=""
        onChange={vi.fn()}
        options={grouped}
        grouped
      />,
    );
    expect(screen.getByText("Select your course")).toBeTruthy();
    expect(screen.getByText("A1")).toBeTruthy();
  });
});

describe("ThemeSelector", () => {
  it("renders light and dark buttons", () => {
    render(<ThemeSelector value="light" onChange={vi.fn()} />);
    expect(screen.getByText("Light")).toBeTruthy();
    expect(screen.getByText("Dark")).toBeTruthy();
  });

  it('calls onChange with "light" when light is clicked', () => {
    const onChange = vi.fn();
    render(<ThemeSelector value="dark" onChange={onChange} />);
    fireEvent.click(screen.getByText("Light").closest("button"));
    expect(onChange).toHaveBeenCalledWith("light");
  });

  it('calls onChange with "dark" when dark is clicked', () => {
    const onChange = vi.fn();
    render(<ThemeSelector value="light" onChange={onChange} />);
    fireEvent.click(screen.getByText("Dark").closest("button"));
    expect(onChange).toHaveBeenCalledWith("dark");
  });
});
