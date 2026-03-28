import { fireEvent, screen } from "@testing-library/react";
import { vi } from "vitest";

const stylesProxy = new Proxy({}, {
  get: (_, key) => key,
});

vi.mock("../../../../components/modules/deadlines/DeadlineCard.module.css", () => ({ default: stylesProxy }));
vi.mock("../../../../components/modules/deadlines/DeadlineForm.module.css", () => ({ default: stylesProxy }));
vi.mock("../../../../components/modules/deadlines/DeadlineModal.module.css", () => ({ default: stylesProxy }));

export const moduleFixture = { id: 1, module_code: "5CCS2SEG", module_name: "Software Engineering" };

export const readingFixture = {
  id: 11,
  title: "Module Handbook",
  chapter: "Ch.1",
  start_page: 10,
  end_page: 30,
  page_count: 20,
  duration_minutes: 35,
  deadline: "2026-04-01T09:00:00Z",
};

export function fillBaseReadingForm() {
  fireEvent.change(screen.getByPlaceholderText(/Software Engineering Module Handbook/i), { target: { value: "Test Reading" } });
  fireEvent.change(screen.getAllByRole("spinbutton")[0], { target: { value: "10" } });
  fireEvent.change(screen.getAllByRole("spinbutton")[1], { target: { value: "30" } });
  fireEvent.change(screen.getByPlaceholderText(/Pick due date/i), { target: { value: "2026-04-01T09:00" } });
}

export function setChapterValue(value) {
  fireEvent.change(screen.getByPlaceholderText(/Chapter 13/i), { target: { value } });
}

export function setEstimatedMinutes(value) {
  fireEvent.change(screen.getByPlaceholderText(/Auto-calculated/i), { target: { value } });
}

export function submitReadingForm() {
  fireEvent.click(screen.getByText(/Add Reading|Update/));
}
