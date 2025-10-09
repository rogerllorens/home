import { render, screen } from "@testing-library/react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

describe("Breadcrumbs", () => {
  it("renders breadcrumb trail", () => {
    render(
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Section", href: "/section" },
          { label: "Page" }
        ]}
      />
    );
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Section")).toBeInTheDocument();
    expect(screen.getByText("Page")).toBeInTheDocument();
  });
});
