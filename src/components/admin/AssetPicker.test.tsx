import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AssetPicker } from "@/components/admin/AssetPicker";
import { renderWithProviders } from "@/test/utils";
import { MAX_ASSET_SOURCE_BYTES, addAsset } from "@/lib/mediaStore";

function makeFile(name: string, sizeBytes: number, type = "image/png"): File {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

describe("AssetPicker", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders a trigger button with the given label and no preview when there's no value", () => {
    renderWithProviders(<AssetPicker onSelect={vi.fn()} label="Choose logo" />);
    expect(screen.getByRole("button", { name: "Choose logo" })).toBeInTheDocument();
    expect(screen.queryByAltText("")).not.toBeInTheDocument();
  });

  it("shows a small preview of the current value next to the trigger", () => {
    renderWithProviders(<AssetPicker onSelect={vi.fn()} value="data:image/png;base64,AAAA" label="Choose logo" />);
    expect(screen.getByAltText("")).toBeInTheDocument();
  });

  it("opens the library modal on click, showing an empty state when nothing's uploaded yet", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AssetPicker onSelect={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Choose image" }));
    expect(screen.getByRole("dialog", { name: "Media library" })).toBeInTheDocument();
    expect(screen.getByText("No images uploaded yet.")).toBeInTheDocument();
  });

  it("uploading a valid image calls onSelect with its data URL and closes the modal", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderWithProviders(<AssetPicker onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: "Choose image" }));
    await user.upload(screen.getByLabelText("Upload image"), makeFile("swatch.png", 100));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0]).toMatch(/^data:image\/png;base64,/);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("uploading an oversized image shows an inline error and keeps the modal open", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderWithProviders(<AssetPicker onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: "Choose image" }));
    await user.upload(screen.getByLabelText("Upload image"), makeFile("huge.png", MAX_ASSET_SOURCE_BYTES + 1));

    expect(await screen.findByRole("alert")).toHaveTextContent(/limit/i);
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("selecting an existing library asset calls onSelect with its data URL and closes the modal", async () => {
    const seeded = addAsset({ name: "hero.png", type: "image/png", dataUrl: "data:image/png;base64,ZZZZ", size: 10 });
    if (!seeded.ok) throw new Error("seed failed");

    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderWithProviders(<AssetPicker onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: "Choose image" }));
    await user.click(screen.getByRole("button", { name: "Use hero.png" }));

    expect(onSelect).toHaveBeenCalledWith("data:image/png;base64,ZZZZ");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("deleting a library asset removes it from the grid", async () => {
    const seeded = addAsset({ name: "hero.png", type: "image/png", dataUrl: "data:image/png;base64,ZZZZ", size: 10 });
    if (!seeded.ok) throw new Error("seed failed");

    const user = userEvent.setup();
    renderWithProviders(<AssetPicker onSelect={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Choose image" }));
    await user.click(screen.getByRole("button", { name: "Delete hero.png" }));

    expect(screen.getByText("No images uploaded yet.")).toBeInTheDocument();
  });
});
