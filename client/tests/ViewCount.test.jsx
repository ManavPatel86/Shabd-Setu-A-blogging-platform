import { render, screen, waitFor } from "@testing-library/react";
import ViewCount from "@/components/ViewCount";

vi.mock("@/helpers/getEnv", () => ({
  getEnv: () => "https://api.example.com",
}));

describe("ViewCount", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
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
});
