import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const fileReaderReadMock = vi.fn();

vi.mock("lucide-react", () => ({
  ImageIcon: () => <svg aria-hidden="true" />,
  Upload: () => <svg aria-hidden="true" />,
}));

vi.mock("../../../../components/common/widget_header/WidgetHeader", () => ({
  default: ({ title }) => <div>{title}</div>,
}));

import PhotoWidget from "../../../../pages/homepage/components/PhotoWidget";

describe("PhotoWidget", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    localStorage.clear();

    vi.stubGlobal("FileReader", class {
      readAsDataURL(file) {
        fileReaderReadMock(file);
        this.onload?.({ target: { result: "data:image/png;base64,abc" } });
      }
    });
  });

  it("renders the default non-edit empty state and does not open the uploader on click", () => {
    const inputClickSpy = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});
    const { container } = render(<PhotoWidget />);

    expect(screen.getByText("No photo yet")).toBeInTheDocument();
    expect(screen.queryByText("Upload photo")).toBeNull();

    fireEvent.click(container.firstChild);
    expect(inputClickSpy).not.toHaveBeenCalled();
  });

  it("opens the uploader from the empty edit state and from the upload prompt", () => {
    const inputClickSpy = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});
    const { container } = render(<PhotoWidget editMode />);

    fireEvent.click(container.firstChild);
    fireEvent.click(screen.getByText("Upload photo"));

    expect(inputClickSpy).toHaveBeenCalledTimes(2);
  });

  it("ignores empty file selections and loads a chosen file preview", async () => {
    const { container } = render(<PhotoWidget editMode />);
    const input = container.querySelector('input[type="file"]');

    fireEvent.change(input, { target: { files: [] } });
    expect(fileReaderReadMock).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { files: [new File(["x"], "photo.png", { type: "image/png" })] } });

    await waitFor(() => expect(screen.getByAltText("Your photo")).toHaveAttribute("src", "data:image/png;base64,abc"));
    expect(fileReaderReadMock).toHaveBeenCalledTimes(1);
  });

  it("clears the photo source when the reader finishes without a result", async () => {
    vi.stubGlobal("FileReader", class {
      readAsDataURL() {
        this.onload?.({ target: { result: undefined } });
      }
    });

    const { container } = render(<PhotoWidget editMode />);
    const input = container.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [new File(["x"], "empty.png", { type: "image/png" })] } });

    await waitFor(() => expect(screen.queryByAltText("Your photo")).toBeNull());
    expect(localStorage.getItem("homepage_photo_src")).toBeNull();
  });

  it("does not enter caption editing when captions are clicked outside edit mode", () => {
    localStorage.setItem("homepage_photo_src", "data:abc");
    localStorage.setItem("homepage_photo_caption", "Sunny day");

    render(<PhotoWidget />);
    fireEvent.click(screen.getByText("Sunny day"));

    expect(screen.queryByPlaceholderText("Add a caption…")).toBeNull();
    expect(screen.queryByText("Change")).toBeNull();
    expect(screen.queryByText("Remove")).toBeNull();
  });

  it("opens caption editing for existing captions in edit mode and closes on Enter", async () => {
    localStorage.setItem("homepage_photo_src", "data:abc");
    localStorage.setItem("homepage_photo_caption", "Sunny day");

    render(<PhotoWidget editMode />);
    fireEvent.click(screen.getByText("Sunny day"));
    fireEvent.click(screen.getByPlaceholderText("Add a caption…"));
    fireEvent.change(screen.getByPlaceholderText("Add a caption…"), { target: { value: "Golden hour" } });
    fireEvent.keyDown(screen.getByPlaceholderText("Add a caption…"), { key: "Enter" });

    await waitFor(() => expect(screen.queryByPlaceholderText("Add a caption…")).toBeNull());
    expect(localStorage.getItem("homepage_photo_caption")).toBe("Golden hour");
  });

  it("uses the change button to reopen the file picker when a photo already exists", () => {
    const inputClickSpy = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});
    localStorage.setItem("homepage_photo_src", "data:abc");

    render(<PhotoWidget editMode />);
    fireEvent.click(screen.getByText(/Change/));

    expect(inputClickSpy).toHaveBeenCalledTimes(1);
  });
});
