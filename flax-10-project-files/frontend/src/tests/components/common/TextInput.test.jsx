import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import TextInput from "../../../components/common/TextInput/TextInput";

describe("TextInput", () => {
  it("renders a plain input by default", () => {
    const ref = React.createRef();
    render(<TextInput ref={ref} aria-label="Plain input" className="outer" inputClassName="inner" />);

    expect(screen.getByLabelText("Plain input").tagName).toBe("INPUT");
    expect(ref.current).toBe(screen.getByLabelText("Plain input"));
  });

  it("renders textarea mode with leading and trailing adornments", () => {
    render(
      <TextInput
        multiline
        aria-label="Detailed input"
        leading={<span>Lead</span>}
        trailing={<span>Trail</span>}
      />
    );

    expect(screen.getByLabelText("Detailed input").tagName).toBe("TEXTAREA");
    expect(screen.getByText("Lead")).toBeInTheDocument();
    expect(screen.getByText("Trail")).toBeInTheDocument();
  });
});
