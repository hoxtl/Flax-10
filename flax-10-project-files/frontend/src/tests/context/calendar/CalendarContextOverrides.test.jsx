/**
 * Covers CalendarContext fallback and override branches.
 */

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
} from "../../../context/CalendarContext";

vi.mock("../../../components/notifications/hooks/useReminderNotifications", () => ({
  useReminderNotifications: () => {},
}));

const providerOverrides = {
  selectedDate: "override-date",
  events: [{ id: "override", title: "Override Event" }],
  viewMode: "day",
  displayMode: "list",
};

const providerEvents = [
  { id: 1, title: "Essay Draft", description: "Library session", location: "Guy's", tag_name: "study" },
  { id: 2, title: "Gym", description: "Leg day", location: "Campus", tag_name: "health" },
];

const sparseProviderEvents = [{ id: 3, title: null, description: null, location: null, tag_name: "study" }];

const joinTitles = (events) => events.map((event) => event.title).join(",");

const renderEntries = (entries) =>
  entries.map(({ testId, value }) => <span key={testId} data-testid={testId}>{value}</span>);

const renderButtons = (buttons) =>
  buttons.map(({ label, onClick }) => <button key={label} onClick={onClick}>{label}</button>);

function snapshotEntries(calendar, data, modal, popup, deletion) {
  return [
    { testId: "events", value: joinTitles(calendar.events) },
    { testId: "all-events", value: joinTitles(calendar.allEvents) },
    { testId: "selected-date-type", value: Object.prototype.toString.call(data.selectedDate) },
    { testId: "view-mode", value: data.viewMode },
    { testId: "display-mode", value: data.displayMode },
    { testId: "modal-open", value: String(modal.isModalOpen) },
    { testId: "popup-open", value: String(Boolean(popup.popupEvent)) },
    { testId: "popup-read-only", value: String(popup.readOnly) },
    { testId: "delete-open", value: String(deletion.isDeleteOpen) },
  ];
}

function snapshotButtons(modal, popup, deletion) {
  return [
    { label: "open modal", onClick: () => modal.openModal(null, "create", "2026-03-24") },
    { label: "open popup", onClick: () => popup.openPopup({ id: 9 }, { top: 1 }, null, "day") },
    { label: "open delete", onClick: () => deletion.openDelete({ id: 4 }, "occurrence") },
    { label: "close modal", onClick: modal.closeModal },
    { label: "close popup", onClick: popup.closePopup },
    { label: "close delete", onClick: deletion.closeDelete },
  ];
}

function ContextSnapshot() {
  const calendar = useCalendar();
  const data = useCalendarData();
  const modal = useEventModal();
  const popup = useEventPopup();
  const deletion = useEventDelete();
  return <div>{renderEntries(snapshotEntries(calendar, data, modal, popup, deletion))}{renderButtons(snapshotButtons(modal, popup, deletion))}</div>;
}

function ProviderHarness() {
  return (
    <CalendarProvider>
      <ProviderScenario />
    </CalendarProvider>
  );
}

function providerEntries(calendar, data, modal, popup, deletion) {
  return [
    { testId: "provider-events", value: joinTitles(calendar.events) },
    { testId: "provider-all-events", value: joinTitles(calendar.allEvents) },
    { testId: "provider-data-events", value: joinTitles(data.events) },
    { testId: "provider-data-selected-date", value: data.selectedDate },
    { testId: "provider-data-view-mode", value: data.viewMode },
    { testId: "provider-data-display-mode", value: data.displayMode },
    { testId: "provider-modal-type", value: modal.modalType ?? "" },
    { testId: "provider-popup-view-mode", value: popup.viewMode ?? "" },
    { testId: "provider-popup-read-only", value: String(popup.readOnly) },
    { testId: "provider-delete-type", value: deletion.deleteType ?? "" },
  ];
}

function providerButtons(modal, popup, deletion) {
  return [
    { label: "provider modal", onClick: () => modal.openModal({ id: 2 }, "edit", "2026-04-01") },
    { label: "provider modal defaults", onClick: () => modal.openModal() },
    { label: "provider popup explicit", onClick: () => popup.openPopup({ id: 3 }, { left: 2 }, true, "list") },
    { label: "provider popup defaults", onClick: () => popup.openPopup({ id: 6 }, { left: 4 }) },
    { label: "provider delete", onClick: () => deletion.openDelete({ id: 7 }, "all") },
    { label: "provider delete default", onClick: () => deletion.openDelete({ id: 8 }) },
    { label: "provider popup close", onClick: popup.closePopup },
    { label: "provider delete close", onClick: deletion.closeDelete },
  ];
}

function ProviderScenario() {
  const calendar = useCalendar();
  const data = useCalendarData(providerOverrides);
  const modal = useEventModal();
  const popup = useEventPopup();
  const deletion = useEventDelete();
  return <div>{renderEntries(providerEntries(calendar, data, modal, popup, deletion))}{renderButtons(providerButtons(modal, popup, deletion))}</div>;
}

function providerStateEntries(calendar, popup) {
  return [
    { testId: "filtered-events", value: joinTitles(calendar.events) },
    { testId: "all-provider-events", value: joinTitles(calendar.allEvents) },
    { testId: "provider-state-popup-read-only", value: String(popup.readOnly) },
  ];
}

function providerStateButtons(dispatch) {
  return [
    { label: "set events", onClick: () => dispatch({ type: "SET_EVENTS", payload: providerEvents }) },
    { label: "set sparse events", onClick: () => dispatch({ type: "SET_EVENTS", payload: sparseProviderEvents }) },
    { label: "filter nested", onClick: () => dispatch({ type: "SET_FILTER", payload: [["study"], "__manage__", " "] }) },
    { label: "search description", onClick: () => dispatch({ type: "SET_SEARCH_QUERY", payload: "library" }) },
    { label: "search location", onClick: () => dispatch({ type: "SET_SEARCH_QUERY", payload: "guy" }) },
    { label: "search title", onClick: () => dispatch({ type: "SET_SEARCH_QUERY", payload: "essay" }) },
    { label: "search sparse", onClick: () => dispatch({ type: "SET_SEARCH_QUERY", payload: "missing" }) },
    { label: "clear search", onClick: () => dispatch({ type: "SET_SEARCH_QUERY", payload: "   " }) },
    { label: "read only", onClick: () => dispatch({ type: "SET_READ_ONLY", payload: true }) },
    { label: "popup from state", onClick: () => dispatch({ type: "OPEN_POPUP", payload: { event: { id: 5 }, anchorRect: { x: 1 }, readOnly: false, viewModeOverride: null } }) },
  ];
}

function ProviderWithState() {
  const calendar = useCalendar();
  const dispatch = useCalendarDispatch();
  const popup = useEventPopup();
  return <div>{renderEntries(providerStateEntries(calendar, popup))}{renderButtons(providerStateButtons(dispatch))}</div>;
}

function ProviderWithFallbackData() {
  const dispatch = useCalendarDispatch();
  const data = useCalendarData({ selectedDate: null, events: null, viewMode: null, displayMode: null });
  return (
    <div>
      <span data-testid="fallback-selected-date-type">{Object.prototype.toString.call(data.selectedDate)}</span>
      <span data-testid="fallback-events-count">{data.events.length}</span>
      <span data-testid="fallback-view-mode">{data.viewMode}</span>
      <span data-testid="fallback-display-mode">{data.displayMode}</span>
      <button onClick={() => dispatch({ type: "SET_VIEW_MODE", payload: "week" })}>set week</button>
      <button onClick={() => dispatch({ type: "SET_DISPLAY_MODE", payload: "list" })}>set list</button>
      <button onClick={() => dispatch({ type: "SET_EVENTS", payload: [{ id: 77, title: "Fallback Event" }] })}>set fallback events</button>
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
    render(<CalendarProvider><ProviderWithState /></CalendarProvider>);
    const verify = (btn, expFilt, expAll = "Essay Draft,Gym") => { act(() => { screen.getByText(btn).click(); }); expect(screen.getByTestId("filtered-events")).toHaveTextContent(expFilt); expect(screen.getByTestId("all-provider-events")).toHaveTextContent(expAll); };
    verify("set events", "Essay Draft,Gym");
    verify("filter nested", "Essay Draft");
    verify("search description", "Essay Draft");
    verify("search location", "Essay Draft");
    verify("search title", "Essay Draft");
    verify("clear search", "Essay Draft");
    act(() => { screen.getByText("set sparse events").click(); screen.getByText("search sparse").click(); });
    expect(screen.getByTestId("filtered-events")).toHaveTextContent("");
  });

  it("supports override props plus popup, modal, and delete actions inside the provider", () => {
    render(<ProviderHarness />);
    const verify = (evts, date, view, disp) => { expect(screen.getByTestId("provider-data-events")).toHaveTextContent(evts); expect(screen.getByTestId("provider-data-selected-date")).toHaveTextContent(date); expect(screen.getByTestId("provider-data-view-mode")).toHaveTextContent(view); expect(screen.getByTestId("provider-data-display-mode")).toHaveTextContent(disp); };
    const verifyState = (mType, pView, pRead, dType) => { expect(screen.getByTestId("provider-modal-type")).toHaveTextContent(mType); expect(screen.getByTestId("provider-popup-view-mode")).toHaveTextContent(pView); expect(screen.getByTestId("provider-popup-read-only")).toHaveTextContent(pRead); expect(screen.getByTestId("provider-delete-type")).toHaveTextContent(dType); };
    verify("Override Event", "override-date", "day", "list");
    act(() => { screen.getByText("provider modal").click(); screen.getByText("provider popup explicit").click(); screen.getByText("provider delete").click(); });
    verifyState("edit", "list", "true", "all");
    act(() => { screen.getByText("provider popup close").click(); screen.getByText("provider delete close").click(); screen.getByText("provider modal defaults").click(); screen.getByText("provider popup defaults").click(); screen.getByText("provider delete default").click(); });
    verifyState("", "week", "false", "");
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

  it("falls back to calendar state when nullable overrides are passed to useCalendarData", () => {
    render(
      <CalendarProvider>
        <ProviderWithFallbackData />
      </CalendarProvider>,
    );

    act(() => {
      screen.getByText("set week").click();
      screen.getByText("set list").click();
      screen.getByText("set fallback events").click();
    });

    expect(screen.getByTestId("fallback-selected-date-type")).toHaveTextContent("[object Date]");
    expect(screen.getByTestId("fallback-events-count")).toHaveTextContent("1");
    expect(screen.getByTestId("fallback-view-mode")).toHaveTextContent("week");
    expect(screen.getByTestId("fallback-display-mode")).toHaveTextContent("list");
  });
});
