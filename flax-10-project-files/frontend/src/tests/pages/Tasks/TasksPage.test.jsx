/*
 * Tests for TasksPage: loading state, main layout, toasts, modals.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TasksPage from "../../../pages/Tasks/TasksPage";

vi.mock("../../../pages/Tasks/hooks/useTasksPage", () => ({
  default: vi.fn(),
}));

vi.mock("../../../pages/Tasks/components/TaskFeed", () => ({ default: () => <div data-testid="task-feed" /> }));
vi.mock("../../../pages/Tasks/components/ListSidebar", () => ({ default: () => <div data-testid="list-sidebar" /> }));
vi.mock("../../../pages/Tasks/components/CreateTaskModal", () => ({ default: () => <div data-testid="create-task-modal" /> }));
vi.mock("../../../pages/Tasks/components/CreateListModal", () => ({ default: () => <div data-testid="create-list-modal" /> }));
vi.mock("../../../components/Pagination/Pagination", () => ({ BackToTop: () => <div data-testid="back-to-top" /> }));

import useTasksPage from "../../../pages/Tasks/hooks/useTasksPage";

describe("TasksPage", () => {
  const defaultPageProps = {
    loading: false,
    sidebarProps: {},
    feedProps: {},
    showTaskModal: false,
    taskModalProps: {},
    toastUndo: null,
    toastDelete: false,
    toastInfo: null,
    handleUndoAddTask: vi.fn(),
    setToastUndo: vi.fn(),
    setToastDelete: vi.fn(),
    setToastInfo: vi.fn(),
    showListModal: false,
    listModalProps: {},
    showCreateListFromTask: false,
    createListFromTaskProps: {},
  };

  beforeEach(() => {
    useTasksPage.mockReturnValue(defaultPageProps);
  });

  it("shows loading when loading is true", () => {
    useTasksPage.mockReturnValue({ ...defaultPageProps, loading: true });
    render(<MemoryRouter><TasksPage /></MemoryRouter>);
    expect(screen.getByTestId('tasks-skeleton')).toBeInTheDocument();
  });

  it("renders ListSidebar and TaskFeed when not loading", () => {
    render(<MemoryRouter><TasksPage /></MemoryRouter>);
    expect(screen.getByTestId("list-sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("task-feed")).toBeInTheDocument();
  });

  it("renders CreateTaskModal when showTaskModal is true", () => {
    useTasksPage.mockReturnValue({ ...defaultPageProps, showTaskModal: true });
    render(<MemoryRouter><TasksPage /></MemoryRouter>);
    expect(screen.getByTestId("create-task-modal")).toBeInTheDocument();
  });

  it("renders CreateListModal when showListModal is true", () => {
    useTasksPage.mockReturnValue({ ...defaultPageProps, showListModal: true });
    render(<MemoryRouter><TasksPage /></MemoryRouter>);
    expect(screen.getAllByTestId("create-list-modal").length).toBeGreaterThanOrEqual(1);
  });

  it("shows ToastUndo when toastUndo is set", () => {
    useTasksPage.mockReturnValue({ ...defaultPageProps, toastUndo: { taskId: 1, title: "T" } });
    render(<MemoryRouter><TasksPage /></MemoryRouter>);
    expect(screen.getByText(/Task added/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Undo/i })).toBeInTheDocument();
  });

  it("shows ToastDelete when toastDelete is true", () => {
    useTasksPage.mockReturnValue({ ...defaultPageProps, toastDelete: true });
    render(<MemoryRouter><TasksPage /></MemoryRouter>);
    expect(screen.getByText(/Task deleted/i)).toBeInTheDocument();
  });

  it("shows ToastInfo when toastInfo is set", () => {
    useTasksPage.mockReturnValue({ ...defaultPageProps, toastInfo: "Task moved." });
    render(<MemoryRouter><TasksPage /></MemoryRouter>);
    expect(screen.getByText("Task moved.")).toBeInTheDocument();
  });

  it("renders BackToTop", () => {
    render(<MemoryRouter><TasksPage /></MemoryRouter>);
    expect(screen.getByTestId("back-to-top")).toBeInTheDocument();
  });
});
