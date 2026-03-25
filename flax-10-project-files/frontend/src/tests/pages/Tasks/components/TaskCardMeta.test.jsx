import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import TaskCardMeta from "../../../../pages/Tasks/components/TaskCardMeta";

function renderMeta(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("TaskCardMeta", () => {
  it("renders list, module, society, people, and project pills", () => {
    const onParentClick = vi.fn();

    renderMeta(
      <div onClick={onParentClick}>
        <TaskCardMeta
          listName="Inbox"
          listColour="#ff5500"
          isCompleted
          task={{
            module_code: "CS101",
            module_id: 7,
            society_name: "Chess Club",
            society_id: 9,
            assignees_count: 3,
            group_project_name: "Final Presentation",
          }}
        />
      </div>,
    );

    expect(screen.getByText("Inbox")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open CS101 module/i })).toHaveAttribute("href", "/modules?moduleId=7");
    expect(screen.getByRole("link", { name: /Open Chess Club/i })).toHaveAttribute("href", "/societies?id=9");
    expect(screen.getByRole("link", { name: /Open users/i })).toHaveTextContent("3 people");
    expect(screen.getByText("Final Presentation")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: /Open CS101 module/i }));
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
