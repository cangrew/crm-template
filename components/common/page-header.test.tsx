import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "./page-header";

describe("PageHeader", () => {
  it("renders the title and subtitle", () => {
    render(<PageHeader title="Drivers" subtitle="12 total · 3 available now" />);
    expect(screen.getByText("Drivers")).toBeInTheDocument();
    expect(screen.getByText("12 total · 3 available now")).toBeInTheDocument();
  });

  it("renders an actions slot", () => {
    render(<PageHeader title="Drivers" actions={<button>New Driver</button>} />);
    expect(screen.getByRole("button", { name: "New Driver" })).toBeInTheDocument();
  });

  it("renders a back link with label when backHref is given", () => {
    render(<PageHeader title="Acme" backHref="/drivers" backLabel="Back to Drivers" />);
    const link = screen.getByRole("link", { name: /Back to Drivers/ });
    expect(link).toHaveAttribute("href", "/drivers");
  });

  it("omits the back link when backHref is absent", () => {
    render(<PageHeader title="Drivers" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
