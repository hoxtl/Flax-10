import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import {
  filterScheduleEvents,
  toggleSelectedEventId,
  getManualScheduleError,
} from "../../../components/schedules/manual/manualScheduleUtils";
import { loadScheduleTaggedEvents } from "../../../components/schedules/manual/loadScheduleTaggedEvents";
import { submitManualSchedule } from "../../../components/schedules/manual/submitManualSchedule";
import { useManualScheduleForm } from "../../../components/schedules/manual/useManualScheduleForm";
import { ManualScheduleFields } from "../../../components/schedules/manual/ManualScheduleFields";
import { ManualScheduleEventList } from "../../../components/schedules/manual/ManualScheduleEventList";
import { ManualScheduleForm } from "../../../components/schedules/manual/ManualScheduleForm";

const getEventsMock = vi.fn();
const createScheduleMock = vi.fn();
const useToastMock = vi.fn();

vi.mock("../../../api/eventApi", () => ({
  getEvents: (...args) => getEventsMock(...args),
}));

vi.mock("../../../api/scheduleApi", () => ({
  createSchedule: (...args) => createScheduleMock(...args),
}));

vi.mock("../../../context/ToastContext", () => ({
  useToast: () => useToastMock,
}));

function HookHarness() {
  const form = useManualScheduleForm();
  return (
    <div>
      <div data-testid="filtered">{form.filteredEvents.map((event) => event.title).join(",")}</div>
      <div data-testid="selected">{form.selected.join(",")}</div>
      <button onClick={() => form.setEventSearch("lab")}>search</button>
      <button onClick={() => form.toggle(2)}>toggle</button>
    </div>
  );
}

describe("Manual schedule", () => {
  beforeEach(() => {
    getEventsMock.mockReset();
    createScheduleMock.mockReset();
    useToastMock.mockReset();
    getEventsMock.mockResolvedValue([
      { id: 1, title: "Schedule Lecture", tag_name: "schedule" },
      { id: 2, title: "Lab", tag_name: "schedule" },
      { id: 3, title: "Todo", tag_name: "task" },
    ]);
  });

  it("covers manual schedule utilities", () => {
    const events = [{ id: 1, title: "Lecture" }, { id: 2, title: "Lab" }];
    expect(filterScheduleEvents(events, " lab ")).toEqual([events[1]]);
    expect(toggleSelectedEventId([1, 2], 2)).toEqual([1]);
    expect(toggleSelectedEventId([1], 2)).toEqual([1, 2]);
    expect(getManualScheduleError("", [])).toBe("Please enter a schedule name.");
    expect(getManualScheduleError("Name", [])).toBe("Select at least one event tagged as schedule.");
    expect(getManualScheduleError("Name", [1])).toBeNull();
  });

  it("loads schedule-tagged events and handles load failures", async () => {
    const setEvents = vi.fn();
    const setSelected = vi.fn();
    const showToast = vi.fn();

    await loadScheduleTaggedEvents(setEvents, setSelected, showToast);
    expect(setEvents).toHaveBeenCalledWith([
      { id: 1, title: "Schedule Lecture", tag_name: "schedule" },
      { id: 2, title: "Lab", tag_name: "schedule" },
    ]);
    expect(setSelected).toHaveBeenCalledWith([1, 2]);

    getEventsMock.mockRejectedValueOnce(new Error("failed"));
    await loadScheduleTaggedEvents(setEvents, setSelected, showToast);
    expect(showToast).toHaveBeenCalledWith("Unable to load schedule-tagged events.", { variant: "error" });
  });

  it("submits schedules and reports validation, overwrite, and success states", async () => {
    const showToast = vi.fn();
    const onDone = vi.fn();

    await submitManualSchedule({ title: "", selected: [], showToast, onDone });
    expect(showToast).toHaveBeenCalledWith("Please enter a schedule name.", { variant: "error" });

    createScheduleMock.mockResolvedValueOnce({ overwritten: true });
    await submitManualSchedule({ title: "  Revision  ", selected: [1, 2], showToast, onDone });
    expect(createScheduleMock).toHaveBeenCalledWith({ mode: "manual", title: "Revision", event_ids: [1, 2] });
    expect(showToast).toHaveBeenCalledWith("A schedule with this name existed and was replaced.", { variant: "info" });
    expect(showToast).toHaveBeenCalledWith('Saved 2 events to "Revision".', { variant: "success" });
    expect(onDone).toHaveBeenCalled();
  });

  it("loads form state, filters events, and toggles selection", async () => {
    render(<HookHarness />);
    await waitFor(() => expect(screen.getByTestId("filtered").textContent).toContain("Schedule Lecture"));
    fireEvent.click(screen.getByText("search"));
    expect(screen.getByTestId("filtered").textContent).toBe("Lab");
    fireEvent.click(screen.getByText("toggle"));
    expect(screen.getByTestId("selected").textContent).toBe("1");
  });

  it("renders fields, event list states, and form submission", async () => {
    const onDone = vi.fn();
    createScheduleMock.mockResolvedValue({ overwritten: false });

    render(
      <>
        <ManualScheduleFields title="Plan" setTitle={vi.fn()} eventSearch="" setEventSearch={vi.fn()} />
        <ManualScheduleEventList events={[]} filteredEvents={[]} selected={[]} toggle={vi.fn()} />
        <ManualScheduleEventList events={[{ id: 1, title: "Lecture" }]} filteredEvents={[]} selected={[]} toggle={vi.fn()} />
        <ManualScheduleEventList events={[{ id: 1, title: "Lecture" }]} filteredEvents={[{ id: 1, title: "Lecture" }]} selected={[1]} toggle={vi.fn()} />
      </>
    );

    expect(screen.getAllByPlaceholderText("My study schedule")[0]).toBeInTheDocument();
    expect(screen.getByText('No events tagged "schedule" were found.')).toBeInTheDocument();
    expect(screen.getByText("No events match your search.")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeChecked();

    render(<ManualScheduleForm onDone={onDone} />);
    await waitFor(() => expect(screen.getByText("Create Schedule")).toBeInTheDocument());
    fireEvent.change(screen.getAllByPlaceholderText("My study schedule")[1], { target: { value: "Study" } });
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    fireEvent.click(screen.getByText("Create Schedule"));
    await waitFor(() => expect(createScheduleMock).toHaveBeenCalled());
  });
});
