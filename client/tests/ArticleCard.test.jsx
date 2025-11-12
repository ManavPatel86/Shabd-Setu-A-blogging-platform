import { fireEvent, render, screen } from "@testing-library/react";
import ArticleCard from "@/components/ArticleCard";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const blog = {
  id: "blog-123",
  thumbnail: "https://example.com/thumb.jpg",
  title: "Testing React Components",
  description: "Insights about testing components effectively.",
  author: "Jane Doe",
  profile: "https://example.com/avatar.jpg",
  createdAt: "Nov 12, 2025",
  filter: "Testing",
};

describe("ArticleCard", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it("renders the provided blog information", () => {
    render(<ArticleCard blog={blog} />);

    expect(
      screen.getAllByText("Testing React Components").length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("Testing").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Jane Doe").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Insights about testing components/).length).toBeGreaterThan(0);
  });

  it("navigates to the blog details page when the hero section is clicked", () => {
    render(<ArticleCard blog={blog} />);

    const heroImage = screen.getAllByRole("img", {
      name: "Testing React Components",
    })[0];

    fireEvent.click(heroImage);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/blog/blog-123");
  });
});
