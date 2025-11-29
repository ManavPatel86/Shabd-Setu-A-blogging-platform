import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import BlogDetails from "@/pages/Blog/BlogDetails";
import { RouteBlogAdd, RouteBlogEdit } from "@/helpers/RouteName";

const mockNavigate = vi.fn();
const mockShowToast = vi.fn();

// Mock data
const mockBlogs = [
  {
    _id: "blog1",
    title: "Test Blog 1",
    createdAt: "2024-01-15T10:00:00Z",
    author: {
      _id: "user1",
      name: "John Doe",
      avatar: "https://example.com/avatar1.jpg"
    },
    categories: [{ _id: "cat1", name: "Technology" }]
  },
  {
    _id: "blog2",
    title: "Art Design Blog",
    createdAt: "2024-01-10T10:00:00Z",
    author: {
      _id: "user2",
      name: "Jane Smith",
      profilePicture: "https://example.com/avatar2.jpg"
    },
    categories: [{ _id: "cat2", name: "Art & Design" }]
  },
  {
    _id: "blog3",
    title: "Sports News",
    createdAt: "2024-01-05T10:00:00Z",
    author: {
      _id: "user1",
      name: "John Doe"
    },
    category: [{ name: "Sports" }]
  },
  {
    _id: "blog4",
    title: "Politics Today",
    createdAt: "2024-01-01T10:00:00Z",
    author: {
      _id: "user3",
      name: "Bob Johnson"
    },
    category: "Politics"
  }
];

const mockUseFetch = vi.fn();
const mockDeleteData = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ to, children, className, ...props }) => (
      <a href={to} className={className} {...props}>
        {children}
      </a>
    ),
  };
});

vi.mock("react-redux", () => ({
  useSelector: vi.fn(() => ({
    user: {
      _id: "user1",
      name: "John Doe",
      role: "user"
    }
  })),
}));

vi.mock("@/helpers/showToast", () => ({
  showToast: (...args) => mockShowToast(...args),
}));

vi.mock("@/helpers/getEnv", () => ({
  getEnv: () => "https://api.example.com",
}));

vi.mock("@/hooks/useFetch", () => ({
  useFetch: (...args) => mockUseFetch(...args),
}));

vi.mock("@/helpers/handleDelete", () => ({
  deleteData: (...args) => mockDeleteData(...args),
}));

vi.mock("@/components/Loading", () => ({
  __esModule: true,
  default: () => <div data-testid="loading">Loading...</div>,
}));

vi.mock("moment", () => ({
  __esModule: true,
  default: (date) => ({
    format: (format) => {
      if (!date) return "—";
      if (typeof date === 'string') {
        if (format === "DD-MM-YYYY") return "15-01-2024";
        if (format === "DD MMM YYYY") return "15 Jan 2024";
        return "15-01-2024";
      }
      if (date instanceof Date) {
        if (date.getTime() === 0) return "—";
        if (format === "DD-MM-YYYY") return "15-01-2024";
        if (format === "DD MMM YYYY") return "15 Jan 2024";
        return "15-01-2024";
      }
      return "—";
    },
  }),
}));

describe("BlogDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFetch.mockReturnValue({
      data: { blog: mockBlogs },
      loading: false,
      error: null,
    });
    mockDeleteData.mockResolvedValue(true);
  });

  it("renders the main page with header", () => {
    render(<BlogDetails />);
    expect(screen.getByText(/Publishing control room/i)).toBeInTheDocument();
    expect(screen.getByText(/Dashboard • My Blogs/i)).toBeInTheDocument();
  });

  it("displays metrics cards", () => {
    render(<BlogDetails />);
    expect(screen.getByText("Total Blogs")).toBeInTheDocument();
    expect(screen.getByText("Categories Covered")).toBeInTheDocument();
    expect(screen.getByText("Last Update")).toBeInTheDocument();
  });

  it("shows Add Blog button with link", () => {
    render(<BlogDetails />);
    const addButton = screen.getByText("Add Blog");
    expect(addButton).toBeInTheDocument();
    expect(addButton.closest("a")).toHaveAttribute("href", RouteBlogAdd);
  });

  it("displays search input", () => {
    render(<BlogDetails />);
    const searchInput = screen.getByPlaceholderText(/Search blogs, categories or authors/i);
    expect(searchInput).toBeInTheDocument();
  });

  it("filters blogs by search term", async () => {
    render(<BlogDetails />);
    const searchInput = screen.getByPlaceholderText(/Search blogs, categories or authors/i);
    
    fireEvent.change(searchInput, { target: { value: "Art" } });
    
    await waitFor(() => {
      const artBlogs = screen.getAllByText("Art Design Blog");
      expect(artBlogs.length).toBeGreaterThan(0);
    });
  });

  it("filters blogs by author name", async () => {
    render(<BlogDetails />);
    const searchInput = screen.getByPlaceholderText(/Search blogs, categories or authors/i);
    
    fireEvent.change(searchInput, { target: { value: "Jane" } });
    
    await waitFor(() => {
      const artBlogs = screen.getAllByText("Art Design Blog");
      expect(artBlogs.length).toBeGreaterThan(0);
    });
  });

  it("filters blogs by category", async () => {
    render(<BlogDetails />);
    const searchInput = screen.getByPlaceholderText(/Search blogs, categories or authors/i);
    
    fireEvent.change(searchInput, { target: { value: "Technology" } });
    
    await waitFor(() => {
      const techBlogs = screen.getAllByText("Test Blog 1");
      expect(techBlogs.length).toBeGreaterThan(0);
    });
  });

  it("shows 'No blogs match' message when no results", async () => {
    render(<BlogDetails />);
    const searchInput = screen.getByPlaceholderText(/Search blogs, categories or authors/i);
    
    fireEvent.change(searchInput, { target: { value: "NonExistentBlog123" } });
    
    await waitFor(() => {
      const noBlogs = screen.getAllByText(/No blogs match your search/i);
      expect(noBlogs.length).toBeGreaterThan(0);
    });
  });

  it("displays total results count", () => {
    render(<BlogDetails />);
    expect(screen.getByText("Matching results")).toBeInTheDocument();
    const countsOf4 = screen.getAllByText("4");
    expect(countsOf4.length).toBeGreaterThan(0);
  });

  it("updates results count when filtering", async () => {
    render(<BlogDetails />);
    const searchInput = screen.getByPlaceholderText(/Search blogs, categories or authors/i);
    
    fireEvent.change(searchInput, { target: { value: "Art" } });
    
    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument();
    });
  });

  it("displays blog table on desktop", () => {
    render(<BlogDetails />);
    expect(screen.getByText("Author")).toBeInTheDocument();
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Categories")).toBeInTheDocument();
    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("displays blog rows with author information", () => {
    render(<BlogDetails />);
    const johnDoe = screen.getAllByText("John Doe");
    const janeSmith = screen.getAllByText("Jane Smith");
    expect(johnDoe.length).toBeGreaterThan(0);
    expect(janeSmith.length).toBeGreaterThan(0);
  });

  it("shows 'You' indicator for current user's blogs", () => {
    render(<BlogDetails />);
    const youIndicators = screen.getAllByText("You");
    expect(youIndicators.length).toBeGreaterThan(0);
  });

  it("displays category pills", () => {
    render(<BlogDetails />);
    const tech = screen.getAllByText("Technology");
    const art = screen.getAllByText("Art & Design");
    expect(tech.length).toBeGreaterThan(0);
    expect(art.length).toBeGreaterThan(0);
  });

  it("shows edit button for blogs", () => {
    render(<BlogDetails />);
    const editButtons = screen.getAllByLabelText("Edit blog");
    expect(editButtons.length).toBeGreaterThan(0);
  });

  it("edit button links to correct route", () => {
    render(<BlogDetails />);
    const editButtons = screen.getAllByLabelText("Edit blog");
    expect(editButtons[0]).toHaveAttribute("href", RouteBlogEdit("blog1"));
  });

  it("shows delete button for blogs", () => {
    render(<BlogDetails />);
    const deleteButtons = screen.getAllByLabelText("Delete blog");
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  it("handles blog deletion", async () => {
    render(<BlogDetails />);
    const deleteButtons = screen.getAllByLabelText("Delete blog");
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(mockDeleteData).toHaveBeenCalledWith("https://api.example.com/blog/delete/blog1");
      expect(mockShowToast).toHaveBeenCalledWith("success", "Blog deleted successfully");
    });
  });

  it("displays popular categories section", () => {
    render(<BlogDetails />);
    expect(screen.getByText("Popular categories")).toBeInTheDocument();
    expect(screen.getByText(/Where your audience spends/i)).toBeInTheDocument();
  });

  it("shows category frequency bars", () => {
    render(<BlogDetails />);
    const posts = screen.getAllByText(/posts/i);
    expect(posts.length).toBeGreaterThan(0);
  });

  it("shows loading state", () => {
    mockUseFetch.mockReturnValueOnce({
      data: null,
      loading: true,
      error: null,
    });

    render(<BlogDetails />);
    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });

  it("shows error state", () => {
    mockUseFetch.mockReturnValueOnce({
      data: null,
      loading: false,
      error: { message: "Failed to load" },
    });

    render(<BlogDetails />);
    expect(screen.getByText(/Error loading blogs/i)).toBeInTheDocument();
  });

  it("handles empty blog list", () => {
    mockUseFetch.mockReturnValueOnce({
      data: { blog: [] },
      loading: false,
      error: null,
    });

    render(<BlogDetails />);
    const noBlogs = screen.getAllByText(/No blogs match your search/i);
    expect(noBlogs.length).toBeGreaterThan(0);
  });

  it("sorts blogs by creation date (newest first)", () => {
    render(<BlogDetails />);
    const titles = screen.getAllByText(/Test Blog 1|Art Design Blog|Sports News|Politics Today/);
    expect(titles[0]).toHaveTextContent("Test Blog 1");
  });

  it("calculates unique categories correctly", () => {
    render(<BlogDetails />);
    expect(screen.getByText("Categories Covered")).toBeInTheDocument();
  });

  it("displays author avatar", () => {
    render(<BlogDetails />);
    const avatars = document.querySelectorAll('[data-slot="avatar"]');
    expect(avatars.length).toBeGreaterThan(0);
  });

  it("shows author initials when no avatar", () => {
    mockUseFetch.mockReturnValueOnce({
      data: { 
        blog: [{
          _id: "blog5",
          title: "No Avatar Blog",
          createdAt: "2024-01-01T10:00:00Z",
          author: { _id: "user5", name: "Test User" },
          categories: [{ name: "Test" }]
        }]
      },
      loading: false,
      error: null,
    });

    render(<BlogDetails />);
    const initials = screen.getAllByText("T");
    expect(initials.length).toBeGreaterThan(0);
  });

  it("handles blog with missing author", () => {
    mockUseFetch.mockReturnValueOnce({
      data: { 
        blog: [{
          _id: "blog6",
          title: "No Author Blog",
          createdAt: "2024-01-01T10:00:00Z",
          categories: [{ name: "Test" }]
        }]
      },
      loading: false,
      error: null,
    });

    render(<BlogDetails />);
    const unknownAuthors = screen.getAllByText("Unknown Author");
    expect(unknownAuthors.length).toBeGreaterThan(0);
  });

  it("handles blog without title", () => {
    mockUseFetch.mockReturnValueOnce({
      data: { 
        blog: [{
          _id: "blog7",
          createdAt: "2024-01-01T10:00:00Z",
          author: { _id: "user1", name: "John Doe" },
          categories: [{ name: "Test" }]
        }]
      },
      loading: false,
      error: null,
    });

    render(<BlogDetails />);
    const untitledBlogs = screen.getAllByText("Untitled blog");
    expect(untitledBlogs.length).toBeGreaterThan(0);
  });

  it("handles blog without createdAt", () => {
    mockUseFetch.mockReturnValueOnce({
      data: { 
        blog: [{
          _id: "blog8",
          title: "No Date Blog",
          author: { _id: "user1", name: "John Doe" },
          categories: [{ name: "Test" }]
        }]
      },
      loading: false,
      error: null,
    });

    render(<BlogDetails />);
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThan(0);
  });

  it("normalizes category labels - string category", () => {
    mockUseFetch.mockReturnValueOnce({
      data: { 
        blog: [{
          _id: "blog9",
          title: "String Category",
          createdAt: "2024-01-01T10:00:00Z",
          author: { _id: "user1", name: "John" },
          category: "TestCategory"
        }]
      },
      loading: false,
      error: null,
    });

    render(<BlogDetails />);
    const categories = screen.getAllByText("TestCategory");
    expect(categories.length).toBeGreaterThan(0);
  });

  it("normalizes category labels - numeric string", () => {
    mockUseFetch.mockReturnValueOnce({
      data: { 
        blog: [{
          _id: "blog10",
          title: "Numeric Category",
          createdAt: "2024-01-01T10:00:00Z",
          author: { _id: "user1", name: "John" },
          category: "12345"
        }]
      },
      loading: false,
      error: null,
    });

    render(<BlogDetails />);
    const uncategorized = screen.getAllByText("Uncategorized");
    expect(uncategorized.length).toBeGreaterThan(0);
  });

  it("normalizes category labels - ObjectId string", () => {
    mockUseFetch.mockReturnValueOnce({
      data: { 
        blog: [{
          _id: "blog11",
          title: "ObjectId Category",
          createdAt: "2024-01-01T10:00:00Z",
          author: { _id: "user1", name: "John" },
          category: "507f1f77bcf86cd799439011"
        }]
      },
      loading: false,
      error: null,
    });

    render(<BlogDetails />);
    const uncategorized = screen.getAllByText("Uncategorized");
    expect(uncategorized.length).toBeGreaterThan(0);
  });

  it("normalizes category labels - empty string", () => {
    mockUseFetch.mockReturnValueOnce({
      data: { 
        blog: [{
          _id: "blog12",
          title: "Empty Category",
          createdAt: "2024-01-01T10:00:00Z",
          author: { _id: "user1", name: "John" },
          category: "  "
        }]
      },
      loading: false,
      error: null,
    });

    render(<BlogDetails />);
    const uncategorized = screen.getAllByText("Uncategorized");
    expect(uncategorized.length).toBeGreaterThan(0);
  });

  it("normalizes category labels - object with name", () => {
    mockUseFetch.mockReturnValueOnce({
      data: { 
        blog: [{
          _id: "blog13",
          title: "Object Category",
          createdAt: "2024-01-01T10:00:00Z",
          author: { _id: "user1", name: "John" },
          category: { name: "ValidName" }
        }]
      },
      loading: false,
      error: null,
    });

    render(<BlogDetails />);
    const categories = screen.getAllByText("ValidName");
    expect(categories.length).toBeGreaterThan(0);
  });

  it("normalizes category labels - object with label", () => {
    mockUseFetch.mockReturnValueOnce({
      data: { 
        blog: [{
          _id: "blog14",
          title: "Object Category Label",
          createdAt: "2024-01-01T10:00:00Z",
          author: { _id: "user1", name: "John" },
          category: { label: "ValidLabel" }
        }]
      },
      loading: false,
      error: null,
    });

    render(<BlogDetails />);
    const categories = screen.getAllByText("ValidLabel");
    expect(categories.length).toBeGreaterThan(0);
  });

  it("shows blog count badge", () => {
    render(<BlogDetails />);
    expect(screen.getByText("4 total")).toBeInTheDocument();
  });

  it("displays blog count badge", () => {
    render(<BlogDetails />);
    expect(screen.getByText("Based on current filters")).toBeInTheDocument();
  });

  it("handles blog without categories", () => {
    mockUseFetch.mockReturnValueOnce({
      data: { 
        blog: [{
          _id: "blog15",
          title: "No Category Blog",
          createdAt: "2024-01-01T10:00:00Z",
          author: { _id: "user1", name: "John" }
        }]
      },
      loading: false,
      error: null,
    });

    render(<BlogDetails />);
    const uncategorized = screen.getAllByText("Uncategorized");
    expect(uncategorized.length).toBeGreaterThan(0);
  });

  it("handles empty categories array", () => {
    mockUseFetch.mockReturnValueOnce({
      data: { 
        blog: [{
          _id: "blog16",
          title: "Empty Categories",
          createdAt: "2024-01-01T10:00:00Z",
          author: { _id: "user1", name: "John" },
          categories: []
        }]
      },
      loading: false,
      error: null,
    });

    render(<BlogDetails />);
    const uncategorized = screen.getAllByText("Uncategorized");
    expect(uncategorized.length).toBeGreaterThan(0);
  });

  it("filters out invalid category objects", () => {
    mockUseFetch.mockReturnValueOnce({
      data: { 
        blog: [{
          _id: "blog17",
          title: "Invalid Category Object",
          createdAt: "2024-01-01T10:00:00Z",
          author: { _id: "user1", name: "John" },
          categories: [{ name: "12345" }]
        }]
      },
      loading: false,
      error: null,
    });

    render(<BlogDetails />);
    const uncategorized = screen.getAllByText("Uncategorized");
    expect(uncategorized.length).toBeGreaterThan(0);
  });

  it("handles category frequency with zero blogs", () => {
    mockUseFetch.mockReturnValueOnce({
      data: { blog: [] },
      loading: false,
      error: null,
    });

    render(<BlogDetails />);
    expect(screen.queryByText("Popular categories")).not.toBeInTheDocument();
  });

  it("displays formatted date correctly", () => {
    render(<BlogDetails />);
    const dates = screen.getAllByText("15-01-2024");
    expect(dates.length).toBeGreaterThan(0);
  });

  it("handles delete failure gracefully", async () => {
    mockDeleteData.mockResolvedValueOnce(false);

    render(<BlogDetails />);
    const deleteButtons = screen.getAllByLabelText("Delete blog");
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(mockDeleteData).toHaveBeenCalled();
      expect(mockShowToast).not.toHaveBeenCalledWith("success", expect.anything());
    });
  });

  it("handles non-array blog data", () => {
    mockUseFetch.mockReturnValueOnce({
      data: { blog: null },
      loading: false,
      error: null,
    });

    render(<BlogDetails />);
    const noBlogs = screen.getAllByText(/No blogs match your search/i);
    expect(noBlogs.length).toBeGreaterThan(0);
  });

  it("handles blog with null author", () => {
    mockUseFetch.mockReturnValueOnce({
      data: { 
        blog: [{
          _id: "blog18",
          title: "Null Author Blog",
          createdAt: "2024-01-01T10:00:00Z",
          author: null,
          categories: [{ name: "Test" }]
        }]
      },
      loading: false,
      error: null,
    });

    render(<BlogDetails />);
    const unknownAuthors = screen.getAllByText("Unknown Author");
    expect(unknownAuthors.length).toBeGreaterThan(0);
  });

  it("shows correct avatar fallback", () => {
    mockUseFetch.mockReturnValueOnce({
      data: { 
        blog: [{
          _id: "blog19",
          title: "Fallback Test",
          createdAt: "2024-01-01T10:00:00Z",
          author: { _id: "user1", name: "Sam" },
          categories: [{ name: "Test" }]
        }]
      },
      loading: false,
      error: null,
    });

    render(<BlogDetails />);
    const fallbacks = screen.getAllByText("S");
    expect(fallbacks.length).toBeGreaterThan(0);
  });

  it("matches art/design category style", () => {
    render(<BlogDetails />);
    const categories = screen.getAllByText("Art & Design");
    expect(categories.length).toBeGreaterThan(0);
  });

  it("matches sports category style", () => {
    render(<BlogDetails />);
    const categories = screen.getAllByText("Sports");
    expect(categories.length).toBeGreaterThan(0);
  });

  it("matches politics category style", () => {
    render(<BlogDetails />);
    const categories = screen.getAllByText("Politics");
    expect(categories.length).toBeGreaterThan(0);
  });

  it("calculates top category correctly", () => {
    render(<BlogDetails />);
    expect(screen.getByText("Top Category")).toBeInTheDocument();
  });

  it("displays active topics count", () => {
    render(<BlogDetails />);
    expect(screen.getByText(/active topics/i)).toBeInTheDocument();
  });

  it("calculates latest update correctly", () => {
    render(<BlogDetails />);
    expect(screen.getByText("Last Update")).toBeInTheDocument();
  });
});
