/*
 * Core rendering tests for profile modals.
 */

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getModules } from "../../../api/moduleApi";
import {
  renderProfileModals,
  useTasksModalData,
} from "./ProfileModals.testUtils";

describe("ProfileModals core rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when all modals are closed", () => {
    const { container } = renderProfileModals();
    expect(screen.queryByTestId("edit-profile-modal")).toBeNull();
    expect(container.textContent).toBe("");
  });

  it("renders the edit profile modal when requested", () => {
    renderProfileModals({ state: { showEditProfile: true } });
    expect(screen.getByTestId("edit-profile-modal")).toBeTruthy();
  });

  it("renders the modules modal when requested", () => {
    renderProfileModals({ state: { showModules: true } });
    expect(screen.getByText("Modules")).toBeTruthy();
    expect(screen.getByText("CS101")).toBeTruthy();
    expect(screen.getByText("MA202")).toBeTruthy();
  });

  it("renders mapped module names when they are available", async () => {
    vi.mocked(getModules).mockResolvedValueOnce({ results: [{ module_code: "CS101", module_name: "Intro to CS" }] });
    renderProfileModals({ state: { showModules: true }, modules: ["CS101"] });
    await waitFor(() => expect(screen.getByText("CS101 – Intro to CS")).toBeTruthy());
  });

  it("renders the empty modules message when no modules exist", () => {
    renderProfileModals({ state: { showModules: true }, modules: [] });
    expect(screen.getByText("No modules found")).toBeTruthy();
  });

  it("renders the tasks modal when requested", async () => {
    renderProfileModals({ state: { showTasks: true } });
    expect(screen.getByText("Tasks")).toBeTruthy();
    await waitFor(() => expect(screen.getByText(/No active tasks right now/i)).toBeTruthy());
  });

  it("renders task counts and fallback metadata when tasks are populated", async () => {
    vi.mocked(useTasksModalData).mockReturnValueOnce({
      loading: false,
      tasks: [
        { id: 1, title: "Read", completed: false, task_list_name: "Week 1", due_date: null },
        { id: 2, title: "Draft", completed: false, due_date: null },
      ],
    });
    renderProfileModals({ state: { showTasks: true } });
    await waitFor(() => expect(screen.getByText("Tasks (2)")).toBeTruthy());
    expect(screen.getByText("No due date • Week 1")).toBeTruthy();
    expect(screen.getByText("No due date • Task")).toBeTruthy();
  });

  it("renders the events modal when requested", () => {
    renderProfileModals({ state: { showEvents: true } });
    expect(screen.getByText(/Events/)).toBeTruthy();
    expect(screen.getByText("Meeting")).toBeTruthy();
  });

  it("renders the empty events message when no events exist", () => {
    renderProfileModals({ state: { showEvents: true }, filteredEvents: [] });
    expect(screen.getByText("No events found for this period")).toBeTruthy();
  });

  it("updates the event range when a range button is clicked", () => {
    const setEventRange = vi.fn();
    renderProfileModals({ state: { showEvents: true, setEventRange } });
    fireEvent.click(screen.getByText("Today"));
    expect(setEventRange).toHaveBeenCalledWith("today");
  });

  it("does not render the events modal when event visibility is disabled", () => {
    renderProfileModals({ state: { showEvents: true }, visibility: { canViewEvents: false } });
    expect(screen.queryByText("Meeting")).toBeNull();
  });

  it("closes the events modal when the close button is clicked", () => {
    const setShowEvents = vi.fn();
    renderProfileModals({ state: { showEvents: true, setShowEvents } });
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(setShowEvents).toHaveBeenCalledWith(false);
  });

  it("navigates and closes when a module is clicked", () => {
    const onNavChange = vi.fn();
    const setShowModules = vi.fn();
    renderProfileModals({ state: { showModules: true, setShowModules }, onNavChange });
    fireEvent.click(screen.getByText("CS101"));
    expect(onNavChange).toHaveBeenCalledWith("modules_CS101");
    expect(setShowModules).toHaveBeenCalledWith(false);
  });

  it("still closes the modules modal when navigation is unavailable", () => {
    const setShowModules = vi.fn();
    renderProfileModals({ state: { showModules: true, setShowModules }, onNavChange: undefined });
    fireEvent.click(screen.getByText("CS101"));
    expect(setShowModules).toHaveBeenCalledWith(false);
  });

  it("closes the tasks modal when the close button is clicked", () => {
    const setShowTasks = vi.fn();
    renderProfileModals({ state: { showTasks: true, setShowTasks } });
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(setShowTasks).toHaveBeenCalledWith(false);
  });

  it("renders task subtitles with due dates and fallback list labels", () => {
    vi.mocked(useTasksModalData).mockReturnValueOnce({
      loading: false,
      tasks: [
        { id: 1, title: "Essay draft", due_date: "2026-03-25T10:00:00Z", task_list_name: "Seminar prep" },
        { title: "Reading notes", due_date: null, list_name: "Reading list" },
      ],
    });
    renderProfileModals({ state: { showTasks: true } });
    expect(screen.getByText("Essay draft")).toBeTruthy();
    expect(screen.getByText("Reading notes")).toBeTruthy();
    expect(screen.getAllByText(/Seminar prep/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/No due date/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Reading list/).length).toBeGreaterThan(0);
  });

  it("formats events without locations cleanly", () => {
    renderProfileModals({
      state: { showEvents: true },
      filteredEvents: [{ title: "Remote Call", start_time: "2024-03-08T14:00:00Z" }],
    });
    expect(screen.getByText("Remote Call")).toBeTruthy();
    expect(screen.getByText(/8 Mar 2024 at/)).toBeTruthy();
    expect(screen.queryByText(/•/)).toBeNull();
  });
});
