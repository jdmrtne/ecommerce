import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AssetPicker } from "@/components/admin/AssetPicker";
import { renderWithProviders } from "@/test/utils";
import { MAX_ASSET_SOURCE_BYTES } from "@/hooks/useMediaAssets";
import { apiUploadMedia } from "@/lib/api/media";
import { fakeSupabase } from "@/test/fakeSupabaseAuth";

function makeFile(name: string, sizeBytes: number, type = "image/png"): File {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

describe("AssetPicker", () => {
  beforeEach(() => {
    fakeSupabase.__reset();
  });

  it("renders a trigger button with the given label and no preview when there's no value", () => {
    renderWithProviders(<AssetPicker onSelect={vi.fn()} label="Choose logo" />);
    expect(screen.getByRole("button", { name: "Choose logo" })).toBeInTheDocument();
    expect(screen.queryByAltText("")).not.toBeInTheDocument();
  });

  it("shows a small preview of the current value next to the trigger", () => {
    renderWithProviders(<AssetPicker onSelect={vi.fn()} value="https://example.com/logo.png" label="Choose logo" />);
    expect(screen.getByAltText("")).toBeInTheDocument();
  });

  it("opens the library modal on click, showing an empty state when nothing's uploaded yet", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AssetPicker onSelect={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Choose image" }));
    expect(screen.getByRole("dialog", { name: "Media library" })).toBeInTheDocument();
    expect(await screen.findByText("No images uploaded yet.")).toBeInTheDocument();
  });

  it("uploading a valid image calls onSelect with its public URL and closes the modal", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderWithProviders(<AssetPicker onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: "Choose image" }));
    await waitFor(() => expect(screen.getByText("No images uploaded yet.")).toBeInTheDocument());
    await user.upload(screen.getByLabelText("Upload image"), makeFile("swatch.png", 100));

    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
    expect(onSelect.mock.calls[0][0]).toContain("swatch.png");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("uploading an oversized image shows an inline error and keeps the modal open", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderWithProviders(<AssetPicker onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: "Choose image" }));
    await waitFor(() => expect(screen.getByText("No images uploaded yet.")).toBeInTheDocument());
    await user.upload(screen.getByLabelText("Upload image"), makeFile("huge.png", MAX_ASSET_SOURCE_BYTES + 1));

    expect(await screen.findByRole("alert")).toHaveTextContent(/limit/i);
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("selecting an existing library asset calls onSelect with its public URL and closes the modal", async () => {
    const seeded = await apiUploadMedia(makeFile("hero.png", 10));

    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderWithProviders(<AssetPicker onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: "Choose image" }));
    await user.click(await screen.findByRole("button", { name: "Use hero.png" }));

    expect(onSelect).toHaveBeenCalledWith(seeded.url);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("deleting a library asset removes it from the grid", async () => {
    await apiUploadMedia(makeFile("hero.png", 10));

    const user = userEvent.setup();
    renderWithProviders(<AssetPicker onSelect={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Choose image" }));
    await user.click(await screen.findByRole("button", { name: "Delete hero.png" }));

    expect(await screen.findByText("No images uploaded yet.")).toBeInTheDocument();
  });
});
