import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EventContextMenu } from "@/pages/homepage/components/mini_timeline/EventContextMenu";

vi.mock("lucide-react", () => ({
  Pencil: () => <span>Pencil</span>,
  Trash2: () => <span>Trash2</span>,
}));

const styles = {
  contextMenu: "menu",
  contextItem: "item",
  contextIcon: "icon",
  contextDivider: "divider",
  contextDelete: "delete",
};

const pos = { x: 100, y: 200 };
const eventItem = { id: "evt-1", title: "Test Event" };

describe("EventContextMenu", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders Edit and Delete buttons via portal", () => {
    render(<EventContextMenu eventItem={eventItem} pos={pos} styles={styles} onClose={vi.fn()} />);
    expect(screen.getByText("Edit")).toBeTruthy();
    expect(screen.getByText("Delete")).toBeTruthy();
  });

  it("calls onEdit and onClose when Edit is clicked", () => {
    const onEdit = vi.fn();
    const onClose = vi.fn();
    render(<EventContextMenu eventItem={eventItem} pos={pos} styles={styles} onEdit={onEdit} onClose={onClose} />);
    fireEvent.click(screen.getByText("Edit"));
    expect(onEdit).toHaveBeenCalledWith(eventItem);
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onDelete and onClose when Delete is clicked", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<EventContextMenu eventItem={eventItem} pos={pos} styles={styles} onDelete={onDelete} onClose={onClose} />);
    fireEvent.click(screen.getByText("Delete"));
    await vi.waitFor(() => expect(onDelete).toHaveBeenCalledWith(eventItem));
    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("dismissed on outside mousedown", () => {
    const onClose = vi.fn();
    render(<EventContextMenu eventItem={eventItem} pos={pos} styles={styles} onClose={onClose} />);
    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalled();
  });

  it("stops propagation on menu mousedown", () => {
    render(<EventContextMenu eventItem={eventItem} pos={pos} styles={styles} onClose={vi.fn()} />);
    const menu = document.querySelector(`.${styles.contextMenu}`);
    const stopProp = vi.fn();
    fireEvent.mouseDown(menu, { stopPropagation: stopProp });
  });

  it("prevents the native context menu on the wrapper", () => {
    render(<EventContextMenu eventItem={eventItem} pos={pos} styles={styles} onClose={vi.fn()} />);
    const menu = document.querySelector(`.${styles.contextMenu}`);
    const ctx = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    menu.dispatchEvent(ctx);
    expect(ctx.defaultPrevented).toBe(true);
  });

  it("renders at the given position via CSS variables", () => {
    render(<EventContextMenu eventItem={eventItem} pos={{ x: 50, y: 75 }} styles={styles} onClose={vi.fn()} />);
    const menu = document.body.querySelector(`.${styles.contextMenu}`);
    expect(menu.style.getPropertyValue("--ctx-top")).toBe("75px");
    expect(menu.style.getPropertyValue("--ctx-left")).toBe("50px");
  });

  it("does not call onClose when clicking inside the menu", () => {
    const onClose = vi.fn();
    render(<EventContextMenu eventItem={eventItem} pos={pos} styles={styles} onClose={onClose} />);
    fireEvent.mouseDown(screen.getByText("Edit"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not throw when handlers are undefined", () => {
    render(<EventContextMenu eventItem={eventItem} pos={pos} styles={styles} />);
    fireEvent.click(screen.getByText("Edit"));
    fireEvent.click(screen.getByText("Delete"));
    fireEvent.mouseDown(document.body);
  });
});
