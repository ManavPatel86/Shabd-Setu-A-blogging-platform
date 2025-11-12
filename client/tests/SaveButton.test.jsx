import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SaveButton from "@/components/SaveButton";

const mockNavigate = vi.fn();
const mockShowToast = vi.fn();
let mockState;

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

  it("toggles the saved state and shows a success toast", async () => {
    mockState = { user: { isLoggedIn: true } };

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ isSaved: false }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ isSaved: true, message: "Blog saved." }),
      });

    render(<SaveButton blogId="blog-1" withLabel />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole("button", { name: /save blog/i }));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("success", "Blog saved.");
    });

    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("shows an error toast when the toggle request fails", async () => {
    mockState = { user: { isLoggedIn: true } };

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ isSaved: false }),
      })
      .mockResolvedValueOnce({
        ok: false,
        statusText: "Server error",
        json: () => Promise.resolve({ message: "Unable to save" }),
      });

    render(<SaveButton blogId="blog-1" />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole("button", { name: /save blog/i }));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        "error",
        "Unable to save"
      );
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
