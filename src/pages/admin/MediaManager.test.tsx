import { beforeEach, describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MediaManager } from "@/pages/admin/MediaManager";
import { renderWithProviders } from "@/test/utils";
import { MAX_ASSET_SOURCE_BYTES } from "@/hooks/useMediaAssets";
import { apiUploadMedia } from "@/lib/api/media";
import { fakeSupabase } from "@/test/fakeSupabaseAuth";

function makeFile(name: string, sizeBytes: number, type = "image/png"): File {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

describe("MediaManager", () => {
  beforeEach(() => {
    fakeSupabase.__reset();
  });

  it("sets the page title", () => {
    renderWithProviders(<MediaManager />);
    expect(document.title).toContain("Media Library");
  });

  it("shows an empty state when nothing's uploaded yet", async () => {
    renderWithProviders(<MediaManager />);
    expect(await screen.findByText("No images yet")).toBeInTheDocument();
  });

  it("lists every uploaded asset with its size", async () => {
    await apiUploadMedia(makeFile("hero.png", 2048));
    renderWithProviders(<MediaManager />);

    expect(await screen.findByText("hero.png")).toBeInTheDocument();
    expect(screen.getByText("2 KB")).toBeInTheDocument();
  });

  it("uploads a new image via the page-level upload button", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MediaManager />);
    await screen.findByText("No images yet");

    await user.upload(screen.getByLabelText("Upload image"), makeFile("swatch.png", 100));

    expect(await screen.findByText("swatch.png")).toBeInTheDocument();
    expect(screen.queryByText("No images yet")).not.toBeInTheDocument();
  });

  it("shows an inline error for an oversized upload and doesn't add it", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MediaManager />);
    await screen.findByText("No images yet");

    await user.upload(screen.getByLabelText("Upload image"), makeFile("huge.png", MAX_ASSET_SOURCE_BYTES + 1));

    expect(await screen.findByRole("alert")).toHaveTextContent(/limit/i);
    expect(screen.getByText("No images yet")).toBeInTheDocument();
  });

  it("deletes an asset after confirming in the delete modal", async () => {
    await apiUploadMedia(makeFile("hero.png", 10));
    const user = userEvent.setup();
    renderWithProviders(<MediaManager />);
    await screen.findByText("hero.png");

    await user.click(screen.getByRole("button", { name: "Delete hero.png" }));
    expect(screen.getByRole("dialog", { name: "Delete image" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByText("No images yet")).toBeInTheDocument();
  });

  it("cancelling the delete modal keeps the asset", async () => {
    await apiUploadMedia(makeFile("hero.png", 10));
    const user = userEvent.setup();
    renderWithProviders(<MediaManager />);
    await screen.findByText("hero.png");

    await user.click(screen.getByRole("button", { name: "Delete hero.png" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("hero.png")).toBeInTheDocument();
  });
});
