import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import SignIn from "@/pages/SignIn";
import { RouteIndex } from "@/helpers/RouteName";
import { MemoryRouter } from "react-router-dom";

const dispatchMock = vi.fn();
const navigateMock = vi.fn();
const showToastMock = vi.fn();

vi.mock("react-redux", () => ({
  useDispatch: () => dispatchMock,
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/helpers/showToast", () => ({
  showToast: (...args) => showToastMock(...args),
}));

const getEnvMock = vi.fn(() => "https://api.example.com");
vi.mock("@/helpers/getEnv", () => ({
  getEnv: (...args) => getEnvMock(...args),
}));

vi.mock("@/components/ui/GoogleLogin", () => ({
  default: () => <div data-testid="google-login" />,
}));

describe("SignIn page", () => {
  beforeEach(() => {
    dispatchMock.mockClear();
    navigateMock.mockClear();
    showToastMock.mockClear();
    getEnvMock.mockClear();
    global.fetch = vi.fn();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <SignIn />
      </MemoryRouter>
    );

  it("shows validation errors when submitting empty form", async () => {
    renderComponent();

    const submitButton = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(submitButton);

    expect(
      await screen.findByText(/password must be at least 8 characters long/i)
    ).toBeInTheDocument();
    expect(await screen.findByText(/invalid email address/i)).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
    expect(showToastMock).not.toHaveBeenCalled();
  });

  it("submits credentials and navigates on success", async () => {
    const userResponse = { user: { _id: "user-1" }, token: "token-123", message: "Welcome" };
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => userResponse,
    });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/name@shabdsetu.com/i), {
      target: { value: "dev@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: "hunter2!!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/auth/login",
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          body: JSON.stringify({ email: "dev@example.com", password: "hunter2!!" }),
        })
      );
    });

    expect(dispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: "user/setUser", payload: userResponse.user })
    );
    expect(localStorage.getItem("token")).toBe("token-123");
    expect(navigateMock).toHaveBeenCalledWith(RouteIndex);
    expect(showToastMock).toHaveBeenCalledWith("success", "Welcome");
  });

  it("shows server error toast when login fails", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Invalid credentials" }),
    });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/name@shabdsetu.com/i), {
      target: { value: "dev@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: "hunter2!!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(showToastMock).toHaveBeenCalledWith("error", "Invalid credentials");
    });

    expect(dispatchMock).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("handles fetch rejection gracefully", async () => {
    global.fetch.mockRejectedValue(new Error("Network down"));

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/name@shabdsetu.com/i), {
      target: { value: "dev@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: "hunter2!!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(showToastMock).toHaveBeenCalledWith("error", "Network down");
    });
  });

  it("toggles password visibility", () => {
    renderComponent();

    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleButton = passwordInput.nextElementSibling;
    fireEvent.click(toggleButton);

    expect(passwordInput).toHaveAttribute("type", "text");

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("renders sign up link", () => {
    renderComponent();
    const signUpLink = screen.getByText(/sign up/i);
    expect(signUpLink).toBeInTheDocument();
    expect(signUpLink.closest("a")).toHaveAttribute("href", "/signup");
  });

  it("renders forgot password link", () => {
    renderComponent();
    const forgotLink = screen.getByText(/forgot your password/i);
    expect(forgotLink).toBeInTheDocument();
  });

  it("renders google login component", () => {
    renderComponent();
    expect(screen.getByTestId("google-login")).toBeInTheDocument();
  });

  it("clears localStorage token on mount", () => {
    localStorage.setItem("token", "old-token");
    renderComponent();
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("clears sessionStorage on mount", () => {
    sessionStorage.setItem("test", "data");
    renderComponent();
    expect(sessionStorage.length).toBe(0);
  });

  it("disables submit button while loading", async () => {
    global.fetch.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: () => ({}) }), 100))
    );

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/name@shabdsetu.com/i), {
      target: { value: "dev@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: "hunter2!!" },
    });

    const submitButton = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled();
    });
  });

  it("shows password validation error for short password", async () => {
    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/name@shabdsetu.com/i), {
      target: { value: "dev@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: "short" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/password must be at least 8 characters long/i)).toBeInTheDocument();
  });

  it("stores token in localStorage on successful login", async () => {
    const mockToken = "jwt-token-123";
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ user: { _id: "1" }, token: mockToken, message: "Success" }),
    });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/name@shabdsetu.com/i), {
      target: { value: "dev@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBe(mockToken);
    });
  });

  it("handles successful login without token", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ user: { _id: "1" }, message: "Success" }),
    });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/name@shabdsetu.com/i), {
      target: { value: "dev@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith(RouteIndex);
    });
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("renders page with proper styling and layout", () => {
    renderComponent();
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByText(/sign in & step back into your creative flow/i)).toBeInTheDocument();
    expect(screen.getByText(/access drafts, saved reads, and analytics on/i)).toBeInTheDocument();
  });

  it("displays email icon", () => {
    renderComponent();
    const emailInput = screen.getByPlaceholderText(/name@shabdsetu.com/i);
    expect(emailInput.parentElement.querySelector('svg')).toBeInTheDocument();
  });

  it("calls getEnv with correct parameter", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ user: {}, token: "t", message: "ok" }),
    });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/name@shabdsetu.com/i), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(getEnvMock).toHaveBeenCalledWith("VITE_API_BASE_URL");
    });
  });

  it("handles BFCache pageshow event with persisted flag", () => {
    const mockReplaceAll = vi.fn();
    const originalLocation = global.location;
    
    delete global.location;
    global.location = {
      ...originalLocation,
      href: "http://localhost:3000/signin",
      replaceAll: mockReplaceAll,
    };

    renderComponent();

    // Simulate BFCache restoration (swipe back on mobile)
    const pageshowEvent = new Event("pageshow");
    Object.defineProperty(pageshowEvent, "persisted", {
      value: true,
      writable: false,
    });

    window.dispatchEvent(pageshowEvent);

    expect(mockReplaceAll).toHaveBeenCalledWith("http://localhost:3000/signin");

    global.location = originalLocation;
  });

  it("does not trigger replaceAll when pageshow event is not persisted", () => {
    const mockReplaceAll = vi.fn();
    const originalLocation = global.location;
    
    delete global.location;
    global.location = {
      ...originalLocation,
      href: "http://localhost:3000/signin",
      replaceAll: mockReplaceAll,
    };

    renderComponent();

    // Simulate regular page load (not from BFCache)
    const pageshowEvent = new Event("pageshow");
    Object.defineProperty(pageshowEvent, "persisted", {
      value: false,
      writable: false,
    });

    window.dispatchEvent(pageshowEvent);

    expect(mockReplaceAll).not.toHaveBeenCalled();

    global.location = originalLocation;
  });
});
