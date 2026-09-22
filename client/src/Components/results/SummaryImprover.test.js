import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SummaryImprover, { extractCandidateSummary } from "./SummaryImprover";

describe("extractCandidateSummary", () => {
  it("extracts summary from professional summary section", () => {
    const resume = `
John Doe
Software Engineer

PROFESSIONAL SUMMARY
Results-driven full-stack developer with 5 years of experience building modern web applications.

EXPERIENCE
Acme Corp - Senior Engineer
    `;
    const extracted = extractCandidateSummary(resume);
    expect(extracted).toContain("Results-driven full-stack developer");
  });

  it("returns empty string if no summary section is present", () => {
    const resume = `
John Doe
EXPERIENCE
Acme Corp - Senior Engineer
    `;
    expect(extractCandidateSummary(resume)).toBe("");
  });
});

describe("SummaryImprover component", () => {
  it("renders the title, hint, and textarea", () => {
    render(<SummaryImprover />);
    expect(screen.getByText("Summary rewriting")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Paste your professional summary here…")).toBeInTheDocument();
  });

  it("extracts summary from resumeText into textarea", () => {
    const resumeText = `
Jane Doe
SUMMARY:
Experienced cloud architect passionate about distributed systems and scalability.
SKILLS: AWS, Docker, Kubernetes
    `;
    render(<SummaryImprover resumeText={resumeText} />);
    const textarea = screen.getByPlaceholderText("Paste your professional summary here…");
    expect(textarea.value).toContain("Experienced cloud architect");
  });

  it("disables the submit button when text is under 20 characters", () => {
    render(<SummaryImprover />);
    const textarea = screen.getByPlaceholderText("Paste your professional summary here…");
    fireEvent.change(textarea, { target: { value: "Too short" } });
    const button = screen.getByRole("button", { name: /Improve summary/i });
    expect(button).toBeDisabled();
  });

  it("enables the submit button when text has 20 or more characters", () => {
    render(<SummaryImprover />);
    const textarea = screen.getByPlaceholderText("Paste your professional summary here…");
    fireEvent.change(textarea, {
      target: { value: "Results-oriented software developer with extensive React experience." },
    });
    const button = screen.getByRole("button", { name: /Improve summary/i });
    expect(button).toBeEnabled();
  });
});
