import { render, screen, waitFor } from "@testing-library/react";
import ViewCount from "@/components/ViewCount";

vi.mock("@/helpers/getEnv", () => ({
  getEnv: () => "https://api.example.com",
}));

describe("ViewCount", () => {
  const originalFetch = global.fetch;
  let consoleErrorSpy;

  beforeEach(() => {
    global.fetch = vi.fn();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    consoleErrorSpy.mockRestore();
    vi.clearAllMocks();
  });

  it("shows placeholder while loading and renders the fetched count", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ viewCount: 42 }),
    });

    render(<ViewCount blogId="blog-xyz" />);

    expect(screen.getByText("...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("42")).toBeInTheDocument();
    });

    expect(screen.queryByText("...")).not.toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.example.com/view/blog-xyz",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("adds a view before fetching the latest count when requested", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ viewCount: 7 }),
      });

    render(<ViewCount blogId="blog-xyz" addView />);

    await waitFor(() => {
      expect(screen.getByText("7")).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "https://api.example.com/view/add-view",
      expect.objectContaining({ method: "POST" })
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "https://api.example.com/view/blog-xyz",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("logs a warning when adding a view fails but still fetches the count", async () => {
    const addViewError = new Error("add view failed");

    global.fetch
      .mockRejectedValueOnce(addViewError)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ viewCount: 9 }),
      });

    render(<ViewCount blogId="blog-xyz" addView />);

    await waitFor(() => {
      expect(screen.getByText("9")).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to add view", addViewError);
  });

  it("logs an error when fetching the view count fails", async () => {
    const fetchError = new Error("network down");

    global.fetch.mockRejectedValueOnce(fetchError);

    render(<ViewCount blogId="blog-xyz" />);

    await waitFor(() => {
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith("Error with view count:", fetchError);
  });

  it("skips network calls when no blog identifier is provided", () => {
    render(<ViewCount blogId={null} addView />);

    expect(screen.getByText("...")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("resets hasAddedViewRef when blogId changes", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ viewCount: 5 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ viewCount: 10 }),
      });

    const { rerender } = render(<ViewCount blogId="blog-1" addView />);

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);

    rerender(<ViewCount blogId="blog-2" addView />);

    await waitFor(() => {
      expect(screen.getByText("10")).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledTimes(4);
    expect(global.fetch).toHaveBeenNthCalledWith(
      3,
      "https://api.example.com/view/add-view",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("handles non-ok response from view count fetch", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Not found" }),
    });

    render(<ViewCount blogId="blog-xyz" />);

    await waitFor(() => {
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });

  it("handles missing viewCount in response", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    render(<ViewCount blogId="blog-xyz" />);

    await waitFor(() => {
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });

  it("prevents state updates after unmount", async () => {
    let resolveFetch;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });

    global.fetch.mockReturnValue(fetchPromise);

    const { unmount } = render(<ViewCount blogId="blog-xyz" />);

    expect(screen.getByText("...")).toBeInTheDocument();

    unmount();

    resolveFetch({
      ok: true,
      json: () => Promise.resolve({ viewCount: 42 }),
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
