import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "./page-header";

describe("PageHeader", () => {
  it("renders the title and subtitle", () => {
    render(<PageHeader title="Contacts" subtitle="12 total · 3 active now" />);
    expect(screen.getByText("Contacts")).toBeInTheDocument();
    expect(screen.getByText("12 total · 3 active now")).toBeInTheDocument();
  });

  it("renders an actions slot", () => {
    render(<PageHeader title="Contacts" actions={<button>New Contact</button>} />);
    expect(screen.getByRole("button", { name: "New Contact" })).toBeInTheDocument();
  });

  it("renders a back link with label when backHref is given", () => {
    render(<PageHeader title="Acme" backHref="/contacts" backLabel="Back to Contacts" />);
    const link = screen.getByRole("link", { name: /Back to Contacts/ });
    expect(link).toHaveAttribute("href", "/contacts");
  });

  it("omits the back link when backHref is absent", () => {
    render(<PageHeader title="Contacts" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
