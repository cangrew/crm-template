import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormField } from "./form-field";

describe("FormField", () => {
  it("associates the label with its control", () => {
    render(
      <FormField label="Broker name">
        <input />
      </FormField>,
    );
    expect(screen.getByLabelText("Broker name")).toBeInTheDocument();
  });

  it("marks required fields", () => {
    render(
      <FormField label="Rate" required>
        <input />
      </FormField>,
    );
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("renders the error message when present", () => {
    render(
      <FormField label="Amount" err="Must be a positive number">
        <input />
      </FormField>,
    );
    expect(screen.getByText("Must be a positive number")).toBeInTheDocument();
  });

  it("renders no error markup when the field is clean", () => {
    const { container } = render(
      <FormField label="Notes">
        <textarea />
      </FormField>,
    );
    expect(container.querySelector(".err-msg")).toBeNull();
  });
});
