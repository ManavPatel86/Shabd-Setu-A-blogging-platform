import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LikeCount from "@/components/LikeCount";

const mockShowToast = vi.fn();
const mockUseFetch = vi.fn();
let mockState;

vi.mock("react-redux", () => ({
  useSelector: (selector) => selector(mockState),
}));

vi.mock("@/hooks/useFetch", () => ({
  useFetch: (...args) => mockUseFetch(...args),
}));

vi.mock("@/helpers/getEnv", () => ({
  getEnv: () => "https://api.example.com",
}));

vi.mock("@/helpers/showToast", () => ({
  showToast: (...args) => mockShowToast(...args),
}));

describe("LikeCount", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    mockUseFetch.mockReset();
    mockShowToast.mockReset();
    mockState = { user: { isLoggedIn: false, user: null } };
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("shows a toast when guests attempt to like", () => {
    mockUseFetch.mockReturnValue({
      data: { likecount: 3, isUserliked: false },
      loading: false,
      error: null,
    });

    render(<LikeCount blogid="blog-1" />);

    fireEvent.click(screen.getByRole("button"));

    expect(mockShowToast).toHaveBeenCalledWith(
      "error",
      "Please login into your account."
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("renders the latest like count from the fetch hook", async () => {
    mockState = {
      user: { isLoggedIn: true, user: { _id: "user-123" } },
    };

    mockUseFetch.mockReturnValue({
      data: { likecount: 5, isUserliked: false },
      loading: false,
      error: null,
    });

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ likecount: 6 }),
      statusText: "OK",
    });

    render(<LikeCount blogid="blog-1" />);

    expect(screen.getByText("5")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByText("6")).toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.example.com/bloglike/do-like",
      expect.objectContaining({ method: "post" })
    );
  });

  it("shows an error toast when the like request fails", async () => {
    mockState = {
      user: { isLoggedIn: true, user: { _id: "user-123" } },
    };

    mockUseFetch.mockReturnValue({
      data: { likecount: 2, isUserliked: true },
      loading: false,
      error: null,
    });

    global.fetch.mockResolvedValueOnce({
      ok: false,
      statusText: "Server error",
      json: () => Promise.resolve({ message: "Cannot like" }),
    });

    render(<LikeCount blogid="blog-1" />);

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("error", "Server error");
    });
  });

  it("shows an error toast when the like request throws", async () => {
    mockState = {
      user: { isLoggedIn: true, user: { _id: "user-123" } },
    };

    mockUseFetch.mockReturnValue({
      data: { likecount: 4, isUserliked: false },
      loading: false,
      error: null,
    });

    global.fetch.mockRejectedValueOnce(new Error("Network down"));

    render(<LikeCount blogid="blog-1" />);

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("error", "Network down");
    });
  });

  it("keeps the default count while the hook has no data", () => {
    mockState = {
      user: { isLoggedIn: true, user: { _id: "user-123" } },
    };

    mockUseFetch.mockReturnValue({
      data: null,
      loading: true,
      error: null,
    });

    render(<LikeCount blogid="blog-1" />);

    expect(screen.getByText("0")).toBeInTheDocument();
    expect(mockShowToast).not.toHaveBeenCalled();
  });
});
