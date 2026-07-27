import { describe, expect, it } from "vitest";
import { Collections } from "@/components/home/Collections";
import { COLLECTIONS } from "@/data/collections";
import { COLLECTIONS_SECTION } from "@/content/homepage";
import { renderWithProviders } from "@/test/utils";

describe("Collections", () => {
  it("renders the section heading and one card per collection, linking to /shop", () => {
    const { container, getByText } = renderWithProviders(<Collections />);

    expect(getByText(COLLECTIONS_SECTION.title)).toBeInTheDocument();
    expect(container.querySelectorAll("section").length).toBe(1);

    for (const collection of COLLECTIONS) {
      expect(getByText(collection.title)).toBeInTheDocument();
    }

    const links = container.querySelectorAll("a[href='/shop']");
    expect(links.length).toBe(COLLECTIONS.length);
  });

  it("prefers a title/subtitle override when provided", () => {
    const { getByText } = renderWithProviders(
      <Collections title="Custom Title" subtitle="Custom subtitle" />,
    );
    expect(getByText("Custom Title")).toBeInTheDocument();
    expect(getByText("Custom subtitle")).toBeInTheDocument();
  });
});
