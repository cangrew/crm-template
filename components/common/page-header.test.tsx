import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "./page-header";

describe("PageHeader", () => {
  it("renders the title and subtitle", () => {
    render(<PageHeader title="Clients" subtitle="12 total · 3 active now" />);
    expect(screen.getByText("Clients")).toBeInTheDocument();
    expect(screen.getByText("12 total · 3 active now")).toBeInTheDocument();
  });

  it("renders an actions slot", () => {
    render(<PageHeader title="Clients" actions={<button>New Client</button>} />);
    expect(screen.getByRole("button", { name: "New Client" })).toBeInTheDocument();
  });

  it("renders a back link with label when backHref is given", () => {
    render(<PageHeader title="Acme" backHref="/clients" backLabel="Back to Clients" />);
    const link = screen.getByRole("link", { name: /Back to Clients/ });
    expect(link).toHaveAttribute("href", "/clients");
  });

  it("omits the back link when backHref is absent", () => {
    render(<PageHeader title="Clients" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
