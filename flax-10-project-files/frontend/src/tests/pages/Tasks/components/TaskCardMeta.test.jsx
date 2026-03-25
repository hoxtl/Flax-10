import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import TaskCardMeta from "../../../../pages/Tasks/components/TaskCardMeta";

function renderMeta(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("TaskCardMeta", () => {
  it("renders basic list and module pills", () => {
    renderMeta(<TaskCardMeta listName="Inbox" task={{ module_code: "CS101", module_id: 7 }} />);
    expect(screen.getByText("Inbox")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /CS101/ })).toHaveAttribute("href", "/modules?moduleId=7");
  });

  it("renders society, people, and project pills", () => {
    renderMeta(<TaskCardMeta task={{ society_name: "Chess", society_id: 9, assignees_count: 2, group_project_name: "TP" }} />);
    expect(screen.getByRole("link", { name: /Chess/ })).toHaveAttribute("href", "/societies?id=9");
    expect(screen.getByText("2 people")).toBeInTheDocument();
    expect(screen.getByText("TP")).toBeInTheDocument();
  });

  it("stops click propagation to parent when clicking pills", () => {
    const onParentClick = vi.fn();
    renderMeta(
      <div onClick={onParentClick}>
        <TaskCardMeta task={{ module_code: "CS101" }} />
      </div>
    );
    fireEvent.click(screen.getByRole("link"));
    expect(onParentClick).not.toHaveBeenCalled();
  });

  it("uses fallback routes and hidden branches when optional data is missing", () => {
    renderMeta(
      <TaskCardMeta
        hideListBadge
        task={{
          module_code: "MA202",
          society: { name: "Maths Society" },
          assignees: [{ id: 1 }, { id: 2 }],
        }}
        listName="Hidden"
      />,
    );

    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open MA202 module/i })).toHaveAttribute("href", "/modules?code=MA202");
    expect(screen.getByRole("link", { name: /Open Maths Society/i })).toHaveAttribute("href", "/societies?search=Maths%20Society");
    expect(screen.getByRole("link", { name: /Open users/i })).toHaveTextContent("2 people");
  });

  it("omits people and society pills when counts or names are not usable", () => {
    renderMeta(
      <TaskCardMeta
        task={{
          module_code: "BI303",
          people_count: 0,
          society_name: "",
        }}
      />,
    );

    expect(screen.queryByRole("link", { name: /Open users/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Open .* society/i })).not.toBeInTheDocument();
  });
});
