import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import FollowButton from "@/components/FollowButton";

const mockShowToast = vi.fn();
let mockState;

vi.mock("react-redux", () => ({
  useSelector: (selector) => selector(mockState),
  useDispatch: () => vi.fn(),
}));

vi.mock("@/helpers/getEnv", () => ({
  getEnv: () => "https://api.example.com",
}));

vi.mock("@/helpers/showToast", () => ({
  showToast: (...args) => mockShowToast(...args),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

describe("FollowButton", () => {
  const originalFetch = global.fetch;
  let consoleErrorSpy;

  beforeEach(() => {
    mockShowToast.mockReset();
    mockState = { user: { user: null } };
    global.fetch = vi.fn();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    consoleErrorSpy.mockRestore();
  });

  it("does not render when viewing own profile", () => {
    mockState = { user: { user: { _id: "user-1" } } };

    const { container } = render(<FollowButton userId="user-1" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows login toast when unauthenticated user clicks follow", async () => {
    mockState = { user: { user: null } };

    render(<FollowButton userId="user-2" />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /follow/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /follow/i }));

    expect(mockShowToast).toHaveBeenCalledWith(
      "error",
      "Please login to follow users"
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("toggles follow status for authenticated users", async () => {
    mockState = { user: { user: { _id: "current" } } };

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ isFollowing: false }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: "Now following" }),
      });

    render(<FollowButton userId="other-user" />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /follow/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /follow/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /unfollow/i })).toBeInTheDocument();
      expect(mockShowToast).toHaveBeenCalledWith("success", "Now following");
    });

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "https://api.example.com/follow/follow/other-user",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("handles follow status check failures gracefully", async () => {
    mockState = { user: { user: { _id: "current" } } };

    global.fetch.mockRejectedValueOnce(new Error("status failure"));

    render(<FollowButton userId="other-user" />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error checking follow status:",
        expect.any(Error)
      );
      expect(screen.getByRole("button", { name: /follow/i })).toBeInTheDocument();
    });
  });

  it("sends an unfollow request when already following", async () => {
    mockState = { user: { user: { _id: "current" } } };

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ isFollowing: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: "Unfollowed" }),
      });

    render(<FollowButton userId="other-user" />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /unfollow/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /unfollow/i }));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("success", "Unfollowed");
    });

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "https://api.example.com/follow/unfollow/other-user",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("surfaces API errors when follow toggle fails", async () => {
    mockState = { user: { user: { _id: "current" } } };

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ isFollowing: false }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: "Server error" }),
      });

    render(<FollowButton userId="other-user" />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /follow/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /follow/i }));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("error", "Server error");
    });
  });

  it("shows a generic error when the follow request throws", async () => {
    mockState = { user: { user: { _id: "current" } } };

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ isFollowing: false }),
      })
      .mockRejectedValueOnce(new Error("network failure"));

    render(<FollowButton userId="other-user" />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /follow/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /follow/i }));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        "error",
        "Something went wrong"
      );
    });
  });
});
