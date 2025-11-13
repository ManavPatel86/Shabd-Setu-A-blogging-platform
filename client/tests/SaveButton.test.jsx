import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import SaveButton from "@/components/SaveButton";

const mockNavigate = vi.fn();
const mockShowToast = vi.fn();
let mockState;

const flushPromises = () => new Promise((resolve) => setTimeout(resolve));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("react-redux", () => ({
  useSelector: (selector) => selector(mockState),
}));

vi.mock("@/helpers/getEnv", () => ({
  getEnv: () => "https://api.example.com",
}));

vi.mock("@/helpers/showToast", () => ({
  showToast: (...args) => mockShowToast(...args),
}));

describe("SaveButton", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    mockState = { user: { isLoggedIn: false } };
    mockNavigate.mockReset();
    mockShowToast.mockReset();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("redirects unauthenticated users to the sign-in page", () => {
    render(<SaveButton blogId="blog-1" />);

    fireEvent.click(screen.getByRole("button", { name: /save blog/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/signin");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("applies the small icon class when the saved state is true", async () => {
    mockState = { user: { isLoggedIn: true } };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ isSaved: true }),
    });

    render(<SaveButton blogId="blog-1" size="sm" withLabel />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /remove from saved/i })).toBeInTheDocument()
    );

    const button = screen.getByRole("button", { name: /remove from saved/i });
    const icon = button.querySelector("svg");

    expect(icon).toHaveClass("h-4", "w-4");
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button).toHaveTextContent("Saved");
  });

  it("clears the saved state when the user logs out", async () => {
    mockState = { user: { isLoggedIn: true } };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ isSaved: true }),
    });

    const { rerender } = render(<SaveButton blogId="blog-1" withLabel />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /remove from saved/i })).toBeInTheDocument()
    );

    mockState = { user: { isLoggedIn: false } };
    rerender(<SaveButton blogId="blog-1" withLabel />);

    expect(screen.getByRole("button", { name: /save blog/i })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("skips status fetch when prerequisites are missing", async () => {
    mockState = { user: { isLoggedIn: true } };

    render(<SaveButton blogId={undefined} />);

    await flushPromises();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("ignores late status updates once the component unmounts", async () => {
    mockState = { user: { isLoggedIn: true } };

    let resolveFetch;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });

    global.fetch.mockReturnValue(fetchPromise);

    const { unmount } = render(<SaveButton blogId="blog-1" />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    unmount();

    resolveFetch({
      ok: true,
      json: () => Promise.resolve({ isSaved: true }),
    });

    await flushPromises();
    expect(mockShowToast).not.toHaveBeenCalled();
  });

  it("responds to savedUpdated events", async () => {
    mockState = { user: { isLoggedIn: false } };

    render(<SaveButton blogId="blog-1" withLabel />);

    const button = screen.getByRole("button", { name: /save blog/i });

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent("savedUpdated", {
          detail: { blogId: "other", isSaved: true },
        })
      );
      await flushPromises();
    });

    expect(button).toHaveAttribute("aria-pressed", "false");

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent("savedUpdated", {
          detail: { blogId: "blog-1", isSaved: true },
        })
      );
      await flushPromises();
    });

    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button).toHaveTextContent("Saved");
  });

  it("prevents repeated toggles while a request is in flight", async () => {
    mockState = { user: { isLoggedIn: true } };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ isSaved: false }),
    });

    let resolveToggle;
    global.fetch.mockImplementationOnce(() =>
      new Promise((resolve) => {
        resolveToggle = resolve;
      })
    );

    render(<SaveButton blogId="blog-1" />);

    const button = await screen.findByRole("button", { name: /save blog/i });

    fireEvent.click(button);

    expect(button).toBeDisabled();
    fireEvent.click(button);

    expect(global.fetch).toHaveBeenCalledTimes(2);

    resolveToggle({
      ok: true,
      json: () => Promise.resolve({ isSaved: true, message: "Saved" }),
    });

    await waitFor(() => expect(button).not.toBeDisabled());
  });

  it("uses fallback success messaging when removing a saved blog", async () => {
    mockState = { user: { isLoggedIn: true } };

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ isSaved: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ isSaved: false }),
      });

    render(<SaveButton blogId="blog-1" />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /remove from saved/i })).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: /remove from saved/i }));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("success", "Removed from saved.");
    });
  });

  it("uses fallback success messaging when saving without a server message", async () => {
    mockState = { user: { isLoggedIn: true } };

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ isSaved: false }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ isSaved: true }),
      });

    render(<SaveButton blogId="blog-1" />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /save blog/i })).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: /save blog/i }));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("success", "Blog saved.");
    });
  });

  it("uses a default error message when the API fails without details", async () => {
    mockState = { user: { isLoggedIn: true } };

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ isSaved: false }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });

    render(<SaveButton blogId="blog-1" />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /save blog/i })).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: /save blog/i }));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        "error",
        "Unable to update saved status."
      );
    });
  });

  it("shows a fallback error when the toggle request rejects without a message", async () => {
    mockState = { user: { isLoggedIn: true } };

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ isSaved: false }),
      })
      .mockRejectedValueOnce({});

    render(<SaveButton blogId="blog-1" />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /save blog/i })).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: /save blog/i }));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        "error",
        "Unable to update saved status."
      );
    });
  });

  it("skips toggling when the blog identifier is missing", async () => {
    mockState = { user: { isLoggedIn: true } };

    render(<SaveButton blogId={undefined} />);

    fireEvent.click(screen.getByRole("button"));

    await flushPromises();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockShowToast).not.toHaveBeenCalled();
  });
});
