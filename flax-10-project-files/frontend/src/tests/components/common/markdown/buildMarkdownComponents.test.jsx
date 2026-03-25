import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { buildMarkdownComponents } from "../../../../components/common/markdown/buildMarkdownComponents";

describe("buildMarkdownComponents", () => {
  it("builds heading renderers with the supplied classes", () => {
    const styles = { mdH1: "h1", mdH2: "h2", mdH3: "h3" };
    const Components = buildMarkdownComponents(styles);
    render(
      <>
        <Components.h1>Heading 1</Components.h1>
        <Components.h2>Heading 2</Components.h2>
        <Components.h3>Heading 3</Components.h3>
      </>
    );
    expect(screen.getByText("Heading 1")).toHaveClass("h1");
    expect(screen.getByText("Heading 2")).toHaveClass("h2");
    expect(screen.getByText("Heading 3")).toHaveClass("h3");
  });

  it("builds text and list renderers with the supplied classes", () => {
    const styles = {
      mdP: "p", mdLi: "li", mdUl: "ul", mdOl: "ol", mdStrong: "strong",
    };
    const Components = buildMarkdownComponents(styles);
    render(
      <>
        <Components.p>Paragraph</Components.p>
        <Components.ul><Components.li>Bullet</Components.li></Components.ul>
        <Components.ol><Components.li>Numbered</Components.li></Components.ol>
        <Components.strong>Strong</Components.strong>
      </>
    );
    expect(screen.getByText("Paragraph")).toHaveClass("p");
    expect(screen.getAllByRole("listitem")[0]).toHaveClass("li");
    expect(screen.getAllByRole("list")[0]).toHaveClass("ul");
    expect(screen.getAllByRole("list")[1]).toHaveClass("ol");
    expect(screen.getByText("Strong")).toHaveClass("strong");
  });
});
