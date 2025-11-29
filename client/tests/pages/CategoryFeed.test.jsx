import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import CategoryFeed from "@/pages/CategoryFeed";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const useFetchMock = vi.fn();

vi.mock("@/hooks/useFetch", () => ({
  useFetch: (...args) => useFetchMock(...args),
}));

vi.mock("@/helpers/getEnv", () => ({
  getEnv: () => "https://api.example.com",
}));

vi.mock("@/components/Loading", () => ({
  __esModule: true,
  default: () => <div data-testid="loading">Loading...</div>,
}));

vi.mock("@/components/BlogCard", () => ({
  __esModule: true,
  default: ({ blog }) => (
    <div data-testid="blog-card">
      <h3>{blog.title}</h3>
    </div>
  ),
}));

describe("CategoryFeed", () => {
  const mockBlogs = [
    {
      _id: "blog-1",
      title: "Test Blog 1",
      slug: "test-blog-1",
      description: "Description 1",
      featuredImage: "image1.jpg",
    },
    {
      _id: "blog-2",
      title: "Test Blog 2",
      slug: "test-blog-2",
      description: "Description 2",
      featuredImage: "image2.jpg",
    },
  ];

  const renderWithRouter = (category = "technology") => {
    return render(
      <MemoryRouter initialEntries={[`/category/${category}`]}>
        <Routes>
          <Route path="/category/:category" element={<CategoryFeed />} />
        </Routes>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays loading state", () => {
    useFetchMock.mockReturnValue({ data: null, loading: true, error: null });

    renderWithRouter();

    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });

  it("displays error message when fetch fails", () => {
    useFetchMock.mockReturnValue({
      data: null,
      loading: false,
      error: { message: "Network error" },
    });

    renderWithRouter();

    expect(
      screen.getByText(/Unable to load blogs for this category/i)
    ).toBeInTheDocument();
  });

  it("displays category name and blogs", async () => {
    useFetchMock.mockReturnValue({
      data: {
        blog: mockBlogs,
        categoryData: { name: "Technology" },
      },
      loading: false,
      error: null,
    });

    renderWithRouter("technology");

    await waitFor(() => {
      expect(screen.getByText("Technology")).toBeInTheDocument();
      expect(screen.getAllByTestId("blog-card")).toHaveLength(2);
      expect(screen.getByText("Test Blog 1")).toBeInTheDocument();
      expect(screen.getByText("Test Blog 2")).toBeInTheDocument();
    });
  });

  it("displays category from URL when categoryData is not available", async () => {
    useFetchMock.mockReturnValue({
      data: {
        blog: mockBlogs,
      },
      loading: false,
      error: null,
    });

    renderWithRouter("science");

    await waitFor(() => {
      expect(screen.getByText("science")).toBeInTheDocument();
    });
  });

  it("displays empty state when no blogs found", async () => {
    useFetchMock.mockReturnValue({
      data: {
        blog: [],
        categoryData: { name: "Empty Category" },
      },
      loading: false,
      error: null,
    });

    renderWithRouter("empty");

    await waitFor(() => {
      expect(screen.getByText("Empty Category")).toBeInTheDocument();
      expect(
        screen.getByText(/No blogs found in this category yet/i)
      ).toBeInTheDocument();
    });
  });

  it("displays stats correctly", async () => {
    useFetchMock.mockReturnValue({
      data: {
        blog: mockBlogs,
        categoryData: { name: "Tech" },
      },
      loading: false,
      error: null,
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("Entries")).toBeInTheDocument();
      const statsSection = screen.getByText("Entries").closest('section');
      expect(statsSection).toHaveTextContent("2");
      expect(screen.getByText("Fresh picks")).toBeInTheDocument();
    });
  });

  it("handles non-array blog data gracefully", async () => {
    useFetchMock.mockReturnValue({
      data: {
        blog: null,
        categoryData: { name: "Test" },
      },
      loading: false,
      error: null,
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("Test")).toBeInTheDocument();
      expect(
        screen.getByText(/No blogs found in this category yet/i)
      ).toBeInTheDocument();
    });
  });

  it("renders category hub title", async () => {
    useFetchMock.mockReturnValue({
      data: {
        blog: mockBlogs,
        categoryData: { name: "Tech" },
      },
      loading: false,
      error: null,
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("Category Hub")).toBeInTheDocument();
    });
  });

  it("displays description text", async () => {
    useFetchMock.mockReturnValue({
      data: {
        blog: mockBlogs,
        categoryData: { name: "Tech" },
      },
      loading: false,
      error: null,
    });

    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByText(/Browse every story/i)
      ).toBeInTheDocument();
    });
  });
});
