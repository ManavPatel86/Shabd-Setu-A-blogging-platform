import { fireEvent, render, screen } from "@testing-library/react";
import SearchBox from "@/components/SearchBox";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("SearchBox", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it("navigates to the generic search route when the input is empty", () => {
    render(<SearchBox />);
    const input = screen.getByPlaceholderText("Search blogs, topics, or @username...");

    fireEvent.change(input, { target: { value: "    " } });
    fireEvent.submit(input.closest("form"));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/search");
  });

  it("navigates with an encoded query when the input has a value", () => {
    render(<SearchBox />);
    const input = screen.getByPlaceholderText("Search blogs, topics, or @username...");

    fireEvent.change(input, { target: { value: "React Hooks" } });
    fireEvent.submit(input.closest("form"));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/search?q=React%20Hooks");
  });
});
