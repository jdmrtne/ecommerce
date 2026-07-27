import { describe, expect, it } from "vitest";
import { Routes, Route } from "react-router-dom";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Policy } from "@/pages/Policy";
import { POLICY_PAGES } from "@/content/policies";
import { NOT_FOUND } from "@/content/notFound";

function renderPolicy(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/policies/${slug}`]}>
      <Routes>
        <Route path="policies/:slug" element={<Policy />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Policy", () => {
  it.each(Object.entries(POLICY_PAGES))("renders the %s policy document", (slug, doc) => {
    const { getByText } = renderPolicy(slug);
    expect(getByText(doc.title)).toBeInTheDocument();
    for (const section of doc.sections) {
      expect(getByText(section.heading)).toBeInTheDocument();
    }
  });

  it("renders the not-found panel for an unknown slug", () => {
    const { getByText } = renderPolicy("not-a-real-policy");
    expect(getByText(NOT_FOUND.title)).toBeInTheDocument();
  });
});
