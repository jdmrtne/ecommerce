import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render } from "@testing-library/react";
import { DynamicPage } from "@/pages/DynamicPage";
import { DYNAMIC_PAGES } from "@/config/layouts/pages";
import { FAQ_SECTION, FAQS } from "@/content/homepage";
import { NOT_FOUND } from "@/content/notFound";

function renderDynamicPage(slug: string) {
  return render(
    <MemoryRouter>
      <DynamicPage slug={slug} />
    </MemoryRouter>,
  );
}

describe("DynamicPage", () => {
  it("renders the faq page's registered sections", () => {
    const { getByText } = renderDynamicPage("faq");
    expect(getByText(FAQ_SECTION.title)).toBeInTheDocument();
    expect(getByText(FAQS[0].question)).toBeInTheDocument();
  });

  it.each(Object.keys(DYNAMIC_PAGES))("renders every registered page (%s) without a not-found fallback", (slug) => {
    const { queryByText } = renderDynamicPage(slug);
    expect(queryByText(NOT_FOUND.title)).not.toBeInTheDocument();
  });

  it("renders the not-found panel for an unregistered slug", () => {
    const { getByText } = renderDynamicPage("not-a-real-page");
    expect(getByText(NOT_FOUND.title)).toBeInTheDocument();
  });
});
