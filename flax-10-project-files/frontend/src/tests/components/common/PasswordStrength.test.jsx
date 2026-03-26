import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import PasswordStrength from "../../../components/common/password_strength/PasswordStrength";

describe("PasswordStrength", () => {
  it("stays hidden until typing by default", () => {
    const { container } = render(<PasswordStrength password="" />);
    expect(container.firstChild).toBeNull();
  });

  it("covers weak, fair, good, and strong states plus the safe empty-password fallback", () => {
    const { rerender } = render(<PasswordStrength password={undefined} showOnlyWhenTyping={false} title="Strength" />);

    expect(screen.getByText("Strength")).toBeInTheDocument();
    expect(screen.getByText("Weak")).toBeInTheDocument();

    rerender(<PasswordStrength password="ab12" showOnlyWhenTyping={false} />);
    expect(screen.getByText("Fair")).toBeInTheDocument();

    rerender(<PasswordStrength password="ab12!" showOnlyWhenTyping={false} />);
    expect(screen.getByText("Good")).toBeInTheDocument();

    rerender(<PasswordStrength password="abcdefgh1!" showOnlyWhenTyping={false} />);
    expect(screen.getByText("Strong")).toBeInTheDocument();
  });
});
