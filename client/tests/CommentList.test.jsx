import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CommentList from "@/components/CommentList";

const mockUseFetch = vi.fn();
const mockShowToast = vi.fn();
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

vi.mock("moment", () => {
  const momentFn = (value) => ({
    fromNow: () => `from ${value}`,
  });

  return {
    default: momentFn,
  };
});

describe("CommentList", () => {
  const originalFetch = global.fetch;
  const originalDispatchEvent = window.dispatchEvent;

  beforeEach(() => {
    mockUseFetch.mockReset();
    mockShowToast.mockReset();
    global.fetch = vi.fn();
    window.dispatchEvent = originalDispatchEvent;
    mockState = { user: { user: null } };
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("shows a loading indicator while data is fetching", () => {
    mockUseFetch.mockReturnValue({ data: null, loading: true, error: null });

    render(<CommentList blogid="blog-1" />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders empty state message when there are no comments", () => {
    mockUseFetch.mockReturnValue({ data: { comments: [] }, loading: false, error: null });

    render(<CommentList blogid="blog-1" />);

    expect(
      screen.getByText("No comments yet. Be the first to comment!")
    ).toBeInTheDocument();
  });

  it("allows the current user to delete their comment", async () => {
    mockState = { user: { user: { _id: "user-1" } } };

    mockUseFetch.mockReturnValue({
      data: {
        comments: [
          {
            _id: "comment-1",
            comment: "Great post!",
            createdAt: "2025-01-01T00:00:00Z",
            user: { _id: "user-1", name: "Alice" },
          },
        ],
      },
      loading: false,
      error: null,
    });

    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: "Comment deleted" }),
    });

    render(<CommentList blogid="blog-1" />);

    const deleteButton = await screen.findByRole("button", {
      name: "Delete comment",
    });

    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        "success",
        "Comment deleted"
      );
      expect(screen.queryByText("Great post!")).not.toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.example.com/comment/delete/comment-1",
      expect.objectContaining({ method: "DELETE" })
    );
    expect(dispatchSpy).toHaveBeenCalled();

    dispatchSpy.mockRestore();
  });

  it("prevents duplicate deletions while a request is in flight", async () => {
    mockState = { user: { user: { _id: "user-1" } } };

    mockUseFetch.mockReturnValue({
      data: {
        comments: [
          {
            _id: "comment-1",
            comment: "Great post!",
            createdAt: "2025-01-01T00:00:00Z",
            user: { _id: "user-1", name: "Alice" },
          },
        ],
      },
      loading: false,
      error: null,
    });

    const deferred = vi.fn();
    global.fetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          deferred.mockImplementation(() =>
            resolve({
              ok: true,
              json: () => Promise.resolve({ message: "Comment deleted" }),
            })
          );
        })
    );

    render(<CommentList blogid="blog-1" />);

    const deleteButton = await screen.findByRole("button", {
      name: "Delete comment",
    });

    fireEvent.click(deleteButton);
    fireEvent.click(deleteButton);

    expect(global.fetch).toHaveBeenCalledTimes(1);

    deferred();

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("success", "Comment deleted");
    });
  });

  it("falls back to default success message when response payload is missing", async () => {
    mockState = { user: { user: { _id: "user-1" } } };

    mockUseFetch.mockReturnValue({
      data: {
        comments: [
          {
            _id: "comment-1",
            comment: "Great post!",
            createdAt: "2025-01-01T00:00:00Z",
            user: { _id: "user-1", name: "Alice" },
          },
        ],
      },
      loading: false,
      error: null,
    });

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    render(<CommentList blogid="blog-1" />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Delete comment" })
    );

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("success", "Comment deleted");
    });
  });

  it("shows error toast when the deletion request is rejected", async () => {
    mockState = { user: { user: { _id: "user-1" } } };

    mockUseFetch.mockReturnValue({
      data: {
        comments: [
          {
            _id: "comment-1",
            comment: "Great post!",
            createdAt: "2025-01-01T00:00:00Z",
            user: { _id: "user-1", name: "Alice" },
          },
        ],
      },
      loading: false,
      error: null,
    });

    global.fetch.mockRejectedValueOnce(new Error("Network failure"));

    render(<CommentList blogid="blog-1" />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Delete comment" })
    );

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        "error",
        "Network failure"
      );
    });
  });

  it("shows error toast and aborts when deletion response is not ok", async () => {
    mockState = { user: { user: { _id: "user-1" } } };

    mockUseFetch.mockReturnValue({
      data: {
        comments: [
          {
            _id: "comment-1",
            comment: "Great post!",
            createdAt: "2025-01-01T00:00:00Z",
            user: { _id: "user-1", name: "Alice" },
          },
        ],
      },
      loading: false,
      error: null,
    });

    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({}),
    });

    render(<CommentList blogid="blog-1" />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Delete comment" })
    );

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        "error",
        "Failed to delete comment"
      );
    });

    expect(screen.getByText("Great post!")).toBeInTheDocument();
  });

  it("recovers when the delete response payload cannot be parsed", async () => {
    mockState = { user: { user: { _id: "user-1" } } };

    mockUseFetch.mockReturnValue({
      data: {
        comments: [
          {
            _id: "comment-1",
            comment: "Great post!",
            createdAt: "2025-01-01T00:00:00Z",
            user: { _id: "user-1", name: "Alice" },
          },
        ],
      },
      loading: false,
      error: null,
    });

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.reject(new Error("invalid json")),
    });

    render(<CommentList blogid="blog-1" />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Delete comment" })
    );

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("success", "Comment deleted");
    });
  });
});
