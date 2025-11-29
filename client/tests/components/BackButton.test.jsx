import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import BackButton from "@/components/BackButton";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe("BackButton", () => {
  beforeEach(() => {
    navigateMock.mockClear();
    // Reset window.history.length mock
    Object.defineProperty(window.history, "length", {
      writable: true,
      configurable: true,
      value: 2,
    });
  });

  const renderComponent = (props = {}) =>
    render(
      <MemoryRouter>
        <BackButton {...props} />
      </MemoryRouter>
    );

  it("renders back button with correct text and icon", () => {
    renderComponent();
    const button = screen.getByRole("button", { name: /go back/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByText("Back")).toBeInTheDocument();
  });

  it("navigates back when clicked and history exists", () => {
    Object.defineProperty(window.history, "length", {
      writable: true,
      configurable: true,
      value: 3,
    });

    renderComponent();
    const button = screen.getByRole("button", { name: /go back/i });
    fireEvent.click(button);

    expect(navigateMock).toHaveBeenCalledWith(-1);
  });

  it("navigates to home when clicked and no history exists", () => {
    Object.defineProperty(window.history, "length", {
      writable: true,
      configurable: true,
      value: 1,
    });

    renderComponent();
    const button = screen.getByRole("button", { name: /go back/i });
    fireEvent.click(button);

    expect(navigateMock).toHaveBeenCalledWith("/");
  });

  it("applies custom className when provided", () => {
    renderComponent({ className: "custom-class" });
    const button = screen.getByRole("button", { name: /go back/i });
    expect(button).toHaveClass("custom-class");
  });

  it("has proper accessibility attributes", () => {
    renderComponent();
    const button = screen.getByRole("button", { name: /go back/i });
    expect(button).toHaveAttribute("aria-label", "Go back");
  });

  it("applies default styles when no className provided", () => {
    renderComponent();
    const button = screen.getByRole("button", { name: /go back/i });
    expect(button).toHaveClass("inline-flex", "items-center", "gap-2");
  });

  it("renders ArrowLeft icon", () => {
    renderComponent();
    const button = screen.getByRole("button", { name: /go back/i });
    const svg = button.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
