import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";
import { TaskWidgetRow } from "@/pages/homepage/components/TaskWidgetRow";

describe("TaskWidgetRow Diagnostic", () => {
    it("calls onInlineTaskEdit on blur", async () => {
        const onInlineTaskEdit = vi.fn();
        const task = { id: 1, title: "Old", completed: false };
        render(<TaskWidgetRow task={task} onInlineTaskEdit={onInlineTaskEdit} />);
        
        const title = screen.getByText("Old");
        fireEvent.click(title);
        
        const input = screen.getByRole("textbox");
        fireEvent.change(input, { target: { value: "New" } });
        fireEvent.blur(input);
        
        expect(onInlineTaskEdit).toHaveBeenCalledWith(expect.anything(), { title: "New" });
    });
});
