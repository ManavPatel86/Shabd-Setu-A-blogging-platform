import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import SearchResult from "@/pages/SearchResult";
import { MemoryRouter } from "react-router-dom";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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

describe("SearchResult", () => {
  const mockBlogs = [
    {
      _id: "blog-1",
      title: "React Tutorial",
      slug: "react-tutorial",
    },
    {
      _id: "blog-2",
      title: "React Hooks Guide",
      slug: "react-hooks-guide",
    },
  ];

  const mockAuthors = [
    {
      _id: "user-1",
      name: "John Doe",
      username: "johndoe",
      bio: "Developer",
    },
    {
      _id: "user-2",
      name: "Jane Smith",
      username: "janesmith",
      bio: "Writer",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  const renderWithQuery = (query = "") => {
    const searchParams = query ? `?q=${encodeURIComponent(query)}` : "";
    return render(
      <MemoryRouter initialEntries={[`/search${searchParams}`]}>
        <SearchResult />
      </MemoryRouter>
    );
  };

  it("displays empty state when no query provided", () => {
    renderWithQuery();

    expect(
      screen.getByText(/Enter a search term above to find blogs and authors/i)
    ).toBeInTheDocument();
  });

  it("displays loading state while fetching", async () => {
    global.fetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ ok: true, json: () => ({}) }), 100);
        })
    );

    renderWithQuery("react");

    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });

  it("displays search results for blogs and authors", async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes('/blog/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            blog: mockBlogs,
            authors: mockAuthors,
          }),
        });
      }
      if (url.includes('/user/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ users: [] }),
        });
      }
    });

    renderWithQuery("react");

    await waitFor(() => {
      expect(screen.getByText(/Search Results/i)).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByText("React Tutorial")).toBeInTheDocument();
    });
  });

  it("displays error message when fetch fails", async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes('/blog/search')) {
        return Promise.resolve({
          ok: false,
          json: async () => ({ message: "Search failed" }),
        });
      }
      if (url.includes('/user/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ users: [] }),
        });
      }
    });

    renderWithQuery("test");

    await waitFor(() => {
      expect(screen.getByText("Search failed")).toBeInTheDocument();
    });
  });

  it("handles fetch exception", async () => {
    global.fetch.mockImplementation(() => Promise.reject(new Error("Network error")));

    renderWithQuery("test");

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("displays empty results message when no blogs or authors found", async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes('/blog/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ blog: [], authors: [] }),
        });
      }
      if (url.includes('/user/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ users: [] }),
        });
      }
    });

    renderWithQuery("nonexistent");

    await waitFor(() => {
      expect(screen.getByText(/Search Results/i)).toBeInTheDocument();
    });
  });

  it("displays only blogs when no authors found", async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes('/blog/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ blog: mockBlogs, authors: [] }),
        });
      }
      if (url.includes('/user/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ users: [] }),
        });
      }
    });

    renderWithQuery("blog");

    await waitFor(() => {
      expect(screen.getAllByTestId("blog-card")).toHaveLength(2);
    });
  });

  it("displays only authors when no blogs found", async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes('/blog/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ blog: [], authors: mockAuthors }),
        });
      }
      if (url.includes('/user/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ users: [] }),
        });
      }
    });

    renderWithQuery("author");

    await waitFor(() => {
      const authorsHeadings = screen.getAllByText(/Authors/i);
      expect(authorsHeadings.length).toBeGreaterThan(0);
    });
  });

  it("handles non-array blog data", async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes('/blog/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ blog: null, authors: mockAuthors }),
        });
      }
      if (url.includes('/user/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ users: [] }),
        });
      }
    });

    renderWithQuery("test");

    await waitFor(() => {
      const authorsHeadings = screen.getAllByText(/Authors/i);
      expect(authorsHeadings.length).toBeGreaterThan(0);
    });
  });

  it("handles non-array authors data", async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes('/blog/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ blog: mockBlogs, authors: null }),
        });
      }
      if (url.includes('/user/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ users: [] }),
        });
      }
    });

    renderWithQuery("test");

    await waitFor(() => {
      expect(screen.getAllByTestId("blog-card")).toHaveLength(2);
    });
  });

  it("aborts fetch on unmount", async () => {
    const abortSpy = vi.fn();
    global.AbortController = class {
      signal = {};
      abort = abortSpy;
    };

    global.fetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () => resolve({ ok: true, json: () => ({ blog: [], authors: [] }) }),
            1000
          );
        })
    );

    const { unmount } = renderWithQuery("test");

    unmount();

    expect(abortSpy).toHaveBeenCalled();
  });

  it("displays authors count", async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes('/blog/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ blog: mockBlogs, authors: mockAuthors }),
        });
      }
      if (url.includes('/user/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ users: [] }),
        });
      }
    });

    renderWithQuery("react");

    await waitFor(() => {
      expect(screen.getByText(/2 authors/i)).toBeInTheDocument();
    });
  });

  it("displays blogs count", async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes('/blog/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ blog: mockBlogs, authors: mockAuthors }),
        });
      }
      if (url.includes('/user/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ users: [] }),
        });
      }
    });

    renderWithQuery("react");

    await waitFor(() => {
      expect(screen.getByText(/2 blogs/i)).toBeInTheDocument();
    });
  });

  it("encodes search query in URL", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ blog: [], authors: [] }),
    });

    renderWithQuery("test & query");

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("test%20%26%20query"),
        expect.any(Object)
      );
    });
  });
});
