import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EntityTable, type EntityColumn } from "./entity-table";

type Row = { id: string; name: string; amount: number };

const columns: EntityColumn<Row>[] = [
  { key: "name", label: "Name", render: (r) => r.name },
  { key: "amount", label: "Amount", align: "right", render: (r) => `$${r.amount}` },
];

const rows: Row[] = [
  { id: "1", name: "Alpha", amount: 100 },
  { id: "2", name: "Beta", amount: 250 },
];

describe("EntityTable", () => {
  it("renders the title, count badge, headers, and one row per entity", () => {
    render(<EntityTable title="Things" rows={rows} columns={columns} emptyText="No things." />);
    expect(screen.getByText("Things")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Amount" })).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("$250")).toBeInTheDocument();
  });

  it("right-aligns numeric column headers", () => {
    render(<EntityTable title="Things" rows={rows} columns={columns} emptyText="No things." />);
    expect(screen.getByRole("columnheader", { name: "Amount" })).toHaveClass("text-right");
  });

  it("shows the empty message instead of a table when there are no rows", () => {
    render(<EntityTable title="Things" rows={[]} columns={columns} emptyText="No things." />);
    expect(screen.getByText("No things.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("marks rows clickable when requested", () => {
    const { container } = render(
      <EntityTable
        title="Things"
        rows={rows}
        columns={columns}
        emptyText="No things."
        clickableRows
      />,
    );
    expect(container.querySelectorAll("tbody tr.clickable")).toHaveLength(2);
  });
});
