import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  CalendarProvider,
  useCalendar,
  useCalendarData,
  useCalendarDispatch,
  useEventDelete,
  useEventModal,
  useEventPopup,
} from "../../context/CalendarContext";

vi.mock("../../components/Notifications/hooks/useReminderNotifications", () => ({
  useReminderNotifications: () => {},
}));

function ContextSnapshot() {
  const calendar = useCalendar();
  const data = useCalendarData();
  const modal = useEventModal();
  const popup = useEventPopup();
  const deletion = useEventDelete();

  return (
    <div>
      <span data-testid="events">{calendar.events.map((event) => event.title).join(",")}</span>
      <span data-testid="all-events">{calendar.allEvents.map((event) => event.title).join(",")}</span>
      <span data-testid="selected-date-type">{Object.prototype.toString.call(data.selectedDate)}</span>
      <span data-testid="view-mode">{data.viewMode}</span>
      <span data-testid="display-mode">{data.displayMode}</span>
      <span data-testid="modal-open">{String(modal.isModalOpen)}</span>
      <span data-testid="popup-open">{String(Boolean(popup.popupEvent))}</span>
      <span data-testid="popup-read-only">{String(popup.readOnly)}</span>
      <span data-testid="delete-open">{String(deletion.isDeleteOpen)}</span>
      <button onClick={() => modal.openModal(null, "create", "2026-03-24")}>open modal</button>
      <button onClick={() => popup.openPopup({ id: 9 }, { top: 1 }, null, "day")}>open popup</button>
      <button onClick={() => deletion.openDelete({ id: 4 }, "occurrence")}>open delete</button>
      <button onClick={modal.closeModal}>close modal</button>
      <button onClick={popup.closePopup}>close popup</button>
      <button onClick={deletion.closeDelete}>close delete</button>
    </div>
  );
}

function ProviderHarness() {
  return (
    <CalendarProvider>
      <ProviderScenario />
    </CalendarProvider>
  );
}

function ProviderScenario() {
  const calendar = useCalendar();
  const data = useCalendarData({
    selectedDate: "override-date",
    events: [{ id: "override", title: "Override Event" }],
    viewMode: "day",
    displayMode: "list",
  });
  const modal = useEventModal();
  const popup = useEventPopup();
  const deletion = useEventDelete();

  return (
    <div>
      <span data-testid="provider-events">{calendar.events.map((event) => event.title).join(",")}</span>
      <span data-testid="provider-all-events">{calendar.allEvents.map((event) => event.title).join(",")}</span>
      <span data-testid="provider-data-events">{data.events.map((event) => event.title).join(",")}</span>
      <span data-testid="provider-data-selected-date">{data.selectedDate}</span>
      <span data-testid="provider-data-view-mode">{data.viewMode}</span>
      <span data-testid="provider-data-display-mode">{data.displayMode}</span>
      <span data-testid="provider-modal-type">{modal.modalType ?? ""}</span>
      <span data-testid="provider-popup-view-mode">{popup.viewMode ?? ""}</span>
      <span data-testid="provider-popup-read-only">{String(popup.readOnly)}</span>
      <span data-testid="provider-delete-type">{deletion.deleteType ?? ""}</span>
      <button onClick={() => modal.openModal({ id: 2 }, "edit", "2026-04-01")}>provider modal</button>
      <button onClick={() => popup.openPopup({ id: 3 }, { left: 2 }, true, "list")}>provider popup explicit</button>
      <button onClick={() => deletion.openDelete({ id: 7 }, "all")}>provider delete</button>
    </div>
  );
}

function ProviderWithState() {
  const calendar = useCalendar();
  const dispatch = useCalendarDispatch();
  const popup = useEventPopup();

  return (
    <div>
      <span data-testid="filtered-events">{calendar.events.map((event) => event.title).join(",")}</span>
      <span data-testid="all-provider-events">{calendar.allEvents.map((event) => event.title).join(",")}</span>
      <span data-testid="provider-state-popup-read-only">{String(popup.readOnly)}</span>
      <button
        onClick={() =>
          dispatch({
            type: "SET_EVENTS",
            payload: [
              { id: 1, title: "Essay Draft", description: "Library session", location: "Guy's", tag_name: "study" },
              { id: 2, title: "Gym", description: "Leg day", location: "Campus", tag_name: "health" },
            ],
          })
        }
      >
        set events
      </button>
      <button onClick={() => dispatch({ type: "SET_FILTER", payload: [["study"], "__manage__", " "] })}>filter nested</button>
      <button onClick={() => dispatch({ type: "SET_SEARCH_QUERY", payload: "library" })}>search description</button>
      <button onClick={() => dispatch({ type: "SET_SEARCH_QUERY", payload: "guy" })}>search location</button>
      <button onClick={() => dispatch({ type: "SET_SEARCH_QUERY", payload: "   " })}>clear search</button>
      <button onClick={() => dispatch({ type: "SET_READ_ONLY", payload: true })}>read only</button>
      <button onClick={() => dispatch({ type: "OPEN_POPUP", payload: { event: { id: 5 }, anchorRect: { x: 1 }, readOnly: false, viewModeOverride: null } })}>popup from state</button>
    </div>
  );
}

describe("CalendarContext extras", () => {
  it("returns safe defaults outside the provider", () => {
    render(<ContextSnapshot />);

    expect(screen.getByTestId("events")).toHaveTextContent("");
    expect(screen.getByTestId("all-events")).toHaveTextContent("");
    expect(screen.getByTestId("selected-date-type")).toHaveTextContent("[object Date]");
    expect(screen.getByTestId("view-mode")).toHaveTextContent("month");
    expect(screen.getByTestId("display-mode")).toHaveTextContent("grid");

    act(() => {
      screen.getByText("open modal").click();
      screen.getByText("open popup").click();
      screen.getByText("open delete").click();
      screen.getByText("close modal").click();
      screen.getByText("close popup").click();
      screen.getByText("close delete").click();
    });

    expect(screen.getByTestId("modal-open")).toHaveTextContent("false");
    expect(screen.getByTestId("popup-open")).toHaveTextContent("false");
    expect(screen.getByTestId("popup-read-only")).toHaveTextContent("false");
    expect(screen.getByTestId("delete-open")).toHaveTextContent("false");
  });

  it("filters by nested tag values and search query while keeping allEvents intact", () => {
    render(
      <CalendarProvider>
        <ProviderWithState />
      </CalendarProvider>,
    );

    act(() => {
      screen.getByText("set events").click();
    });
    expect(screen.getByTestId("filtered-events")).toHaveTextContent("Essay Draft,Gym");
    expect(screen.getByTestId("all-provider-events")).toHaveTextContent("Essay Draft,Gym");

    act(() => {
      screen.getByText("filter nested").click();
    });
    expect(screen.getByTestId("filtered-events")).toHaveTextContent("Essay Draft");
    expect(screen.getByTestId("all-provider-events")).toHaveTextContent("Essay Draft,Gym");

    act(() => {
      screen.getByText("search description").click();
    });
    expect(screen.getByTestId("filtered-events")).toHaveTextContent("Essay Draft");

    act(() => {
      screen.getByText("search location").click();
    });
    expect(screen.getByTestId("filtered-events")).toHaveTextContent("Essay Draft");

    act(() => {
      screen.getByText("clear search").click();
    });
    expect(screen.getByTestId("filtered-events")).toHaveTextContent("Essay Draft");
  });

  it("supports override props plus popup, modal, and delete actions inside the provider", () => {
    render(<ProviderHarness />);

    expect(screen.getByTestId("provider-data-events")).toHaveTextContent("Override Event");
    expect(screen.getByTestId("provider-data-selected-date")).toHaveTextContent("override-date");
    expect(screen.getByTestId("provider-data-view-mode")).toHaveTextContent("day");
    expect(screen.getByTestId("provider-data-display-mode")).toHaveTextContent("list");

    act(() => {
      screen.getByText("provider modal").click();
      screen.getByText("provider popup explicit").click();
      screen.getByText("provider delete").click();
    });

    expect(screen.getByTestId("provider-modal-type")).toHaveTextContent("edit");
    expect(screen.getByTestId("provider-popup-view-mode")).toHaveTextContent("list");
    expect(screen.getByTestId("provider-popup-read-only")).toHaveTextContent("true");
    expect(screen.getByTestId("provider-delete-type")).toHaveTextContent("all");
  });

  it("inherits readOnly for popup state when no override is passed", () => {
    render(
      <CalendarProvider>
        <ProviderWithState />
      </CalendarProvider>,
    );

    act(() => {
      screen.getByText("read only").click();
      screen.getByText("popup from state").click();
    });

    expect(screen.getByTestId("provider-state-popup-read-only")).toHaveTextContent("true");
  });
});
