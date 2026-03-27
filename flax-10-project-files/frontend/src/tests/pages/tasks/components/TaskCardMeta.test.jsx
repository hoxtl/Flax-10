import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import TaskCardMeta from "../../../../pages/tasks/components/TaskCardMeta";

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
    expect(screen.getByTitle("Open users")).toHaveTextContent("2 people");
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
    expect(screen.getByTitle("Open MA202 module")).toHaveAttribute("href", "/modules?code=MA202");
    expect(screen.getByTitle("Open Maths Society")).toHaveAttribute("href", "/societies?search=Maths%20Society");
    expect(screen.getByTitle("Open users")).toHaveTextContent("2 people");
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

  it("uses group-member counts and search routes for society names without ids", () => {
    renderMeta(
      <TaskCardMeta
        task={{
          module_code: "CS404",
          society_name: "Debate Club",
          group_member_count: 4,
        }}
      />,
    );

    expect(screen.getByTitle("Open Debate Club")).toHaveAttribute("href", "/societies?search=Debate%20Club");
    expect(screen.getByTitle("Open users")).toHaveTextContent("4 people");
  });

  it("stops propagation from society link", () => {
    const onParentClick = vi.fn();
    renderMeta(
      <div onClick={onParentClick}>
        <TaskCardMeta task={{ society_name: "Robotics Club" }} />
      </div>,
    );
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    const stopPropagation = vi.fn();
    Object.defineProperty(event, "stopPropagation", { value: stopPropagation });
    screen.getByTitle("Open Robotics Club").dispatchEvent(event);
    expect(stopPropagation).toHaveBeenCalled();
    expect(onParentClick).not.toHaveBeenCalled();
  });

  it("stops propagation from people link", () => {
    const onParentClick = vi.fn();
    renderMeta(
      <div onClick={onParentClick}>
        <TaskCardMeta task={{ people_count: 2 }} />
      </div>,
    );
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    const stopPropagation = vi.fn();
    Object.defineProperty(event, "stopPropagation", { value: stopPropagation });
    screen.getByTitle("Open users").dispatchEvent(event);
    expect(stopPropagation).toHaveBeenCalled();
    expect(onParentClick).not.toHaveBeenCalled();
  });
});
