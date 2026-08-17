import { render, screen } from "@testing-library/react";
import ChecklistCard from "./ChecklistCard";

test("renders nothing when there is no checklist", () => {
  const { container } = render(<ChecklistCard checklist={[]} />);
  expect(container).toBeEmptyDOMElement();
});

test("renders nothing when checklist is not provided", () => {
  const { container } = render(<ChecklistCard />);
  expect(container).toBeEmptyDOMElement();
});

test("renders the card title and each item's label", () => {
  render(
    <ChecklistCard
      checklist={[
        { label: "Contact info present", status: "pass" },
        { label: "Uses action verbs", status: "warn" },
        { label: "No spelling errors", status: "fail" },
      ]}
    />
  );

  expect(screen.getByText("Resume quality checklist")).toBeInTheDocument();
  expect(screen.getByText("Contact info present")).toBeInTheDocument();
  expect(screen.getByText("Uses action verbs")).toBeInTheDocument();
  expect(screen.getByText("No spelling errors")).toBeInTheDocument();
});

test("applies the correct status class per item", () => {
  render(
    <ChecklistCard
      checklist={[
        { label: "Pass item", status: "pass" },
        { label: "Warn item", status: "warn" },
        { label: "Fail item", status: "fail" },
        { label: "Unknown item", status: "something-unexpected" },
      ]}
    />
  );

  expect(screen.getByText("Pass item").closest("li")).toHaveClass("checklist-pass");
  expect(screen.getByText("Warn item").closest("li")).toHaveClass("checklist-warn");
  expect(screen.getByText("Fail item").closest("li")).toHaveClass("checklist-fail");
  // Unrecognized status falls back to the warn styling rather than breaking
  expect(screen.getByText("Unknown item").closest("li")).toHaveClass("checklist-warn");
});
