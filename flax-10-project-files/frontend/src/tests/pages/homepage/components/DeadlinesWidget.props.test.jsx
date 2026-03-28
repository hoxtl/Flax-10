import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

const upcomingWidgetProps = vi.fn();
const emptyStateCardProps = vi.fn();

vi.mock("lucide-react", () => ({
  AlarmClock: () => <svg data-testid="alarm-clock" />,
}));

vi.mock("react-router-dom", () => ({
  Link: ({ children, to, className }) => <a href={to} className={className}>{children}</a>,
}));

vi.mock("../../../../components/modules/deadlines/UpcomingDeadlinesWidget", () => ({
  UpcomingDeadlinesWidget: (props) => {
    upcomingWidgetProps(props);
    return (
      <div data-testid="upcoming-deadlines-widget">
        <div>{props.title}</div>
        {props.renderEmpty?.()}
      </div>
    );
  },
}));

vi.mock("../../../../pages/homepage/components/EmptyStateCard", () => ({
  default: (props) => {
    emptyStateCardProps(props);
    return (
      <div data-testid="empty-state-card">
        <div>{props.message}</div>
        {props.action}
      </div>
    );
  },
}));

vi.mock("../../../../pages/homepage/styles/TaskWidget.module.css", () => ({
  default: { taskWidgetLink: "task-widget-link" },
}));

import { DeadlinesWidget } from "../../../../pages/homepage/components/DeadlinesWidget";

describe("DeadlinesWidget homepage props", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes the student defaults into the shared deadlines widget", () => {
    render(<DeadlinesWidget />);

    expect(upcomingWidgetProps.mock.calls[0][0]).toEqual(expect.objectContaining({
      deadlines: [],
      embedded: true,
      emptyMessage: "No deadlines need attention.",
      emptySub: "Upcoming coursework and exams will show up here.",
      initialShown: 3,
      interactiveRows: true,
      onModuleCodeClick: null,
      title: "Upcoming Deadlines",
    }));

    expect(emptyStateCardProps.mock.calls[0][0]).toEqual(expect.objectContaining({
      message: "No deadlines need attention.",
      sub: null,
    }));
  });

  it("switches to the teacher copy and remaps module clicks", () => {
    const onSelectModule = vi.fn();

    render(
      <DeadlinesWidget
        deadlines={[{ id: 1, module_code: "CS101" }]}
        isTeacher
        onSelectModule={onSelectModule}
      />,
    );

    const props = upcomingWidgetProps.mock.calls[0][0];

    expect(props).toEqual(expect.objectContaining({
      deadlines: [{ id: 1, module_code: "CS101" }],
      emptyMessage: "No teaching deadlines upcoming.",
      emptySub: "Deadlines from modules you teach will show up here.",
      title: "Teaching Deadlines",
    }));

    props.onModuleCodeClick("CS101");
    expect(onSelectModule).toHaveBeenCalledWith({ code: "CS101" });

    expect(emptyStateCardProps.mock.calls[0][0]).toEqual(expect.objectContaining({
      message: "No teaching deadlines upcoming.",
    }));
  });
});
