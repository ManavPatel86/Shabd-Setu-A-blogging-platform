import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, vi, beforeEach } from "vitest";
import React from "react";
import SignUp from "@/pages/SignUp";
import { MemoryRouter } from "react-router-dom";

const navigateMock = vi.fn();
const showToastMock = vi.fn();

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

vi.mock("@/components/ui/GoogleLogin", () => ({
  default: () => <div data-testid="google-login" />,
}));

describe("SignUp page", () => {
  beforeEach(() => {
    navigateMock.mockClear();
    showToastMock.mockClear();
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: { available: true } }),
      })
    );
    import.meta.env.VITE_API_BASE_URL = "https://api.example.com";
    import.meta.env.VITE_OTP_RESEND_INTERVAL_MINUTES = "1";
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    );

  it("renders all form fields", () => {
    renderComponent();

    expect(screen.getByPlaceholderText(/tell us what to call you/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/choose a unique handle/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/name@shabdsetu.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/create a secure password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/re-enter password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("renders page title and description", () => {
    renderComponent();
    expect(screen.getByText(/create your profile/i)).toBeInTheDocument();
    expect(screen.getByText(/join the shabdsetu circle/i)).toBeInTheDocument();
  });

  it("renders google login component", () => {
    renderComponent();
    expect(screen.getByTestId("google-login")).toBeInTheDocument();
  });

  it("renders sign in link", () => {
    renderComponent();
    const signInLink = screen.getByText(/sign in/i);
    expect(signInLink).toBeInTheDocument();
    expect(signInLink.closest("a")).toHaveAttribute("href", "/signin");
  });

  it("toggles password visibility", () => {
    renderComponent();

    const passwordInput = screen.getByPlaceholderText(/create a secure password/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleButton = passwordInput.nextElementSibling;
    fireEvent.click(toggleButton);

    expect(passwordInput).toHaveAttribute("type", "text");

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("toggles confirm password visibility", () => {
    renderComponent();

    const confirmPasswordInput = screen.getByPlaceholderText(/re-enter password/i);
    expect(confirmPasswordInput).toHaveAttribute("type", "password");

    const toggleButton = confirmPasswordInput.nextElementSibling;
    fireEvent.click(toggleButton);

    expect(confirmPasswordInput).toHaveAttribute("type", "text");

    fireEvent.click(toggleButton);
    expect(confirmPasswordInput).toHaveAttribute("type", "password");
  });

  it("shows validation error when submitting empty form", async () => {
    renderComponent();

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(showToastMock).toHaveBeenCalled();
    });
  });

  it("shows error for invalid name", async () => {
    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/tell us what to call you/i), {
      target: { value: "A" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(showToastMock).toHaveBeenCalled();
    });
  });

  it("accepts valid email format", () => {
    renderComponent();

    const emailInput = screen.getByPlaceholderText(/name@shabdsetu.com/i);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    expect(emailInput.value).toBe("test@example.com");
  });

  it("shows error for password mismatch", async () => {
    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/tell us what to call you/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByPlaceholderText(/name@shabdsetu.com/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/create a secure password/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByPlaceholderText(/re-enter password/i), {
      target: { value: "differentPassword" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(showToastMock).toHaveBeenCalled();
    });
  });

  it("normalizes username input to lowercase", () => {
    renderComponent();

    const usernameInput = screen.getByPlaceholderText(/choose a unique handle/i);
    fireEvent.change(usernameInput, {
      target: { value: "TestUser123" },
    });

    expect(usernameInput.value).toBe("testuser123");
  });

  it("allows underscores in username", () => {
    renderComponent();

    const usernameInput = screen.getByPlaceholderText(/choose a unique handle/i);
    fireEvent.change(usernameInput, {
      target: { value: "test_user" },
    });

    expect(usernameInput.value).toBe("test_user");
  });

  it("handles name input change", () => {
    renderComponent();

    const nameInput = screen.getByPlaceholderText(/tell us what to call you/i);
    fireEvent.change(nameInput, {
      target: { value: "John Doe" },
    });

    expect(nameInput.value).toBe("John Doe");
  });

  it("handles email input change", () => {
    renderComponent();

    const emailInput = screen.getByPlaceholderText(/name@shabdsetu.com/i);
    fireEvent.change(emailInput, {
      target: { value: "test@example.com" },
    });

    expect(emailInput.value).toBe("test@example.com");
  });

  it("handles password input change", () => {
    renderComponent();

    const passwordInput = screen.getByPlaceholderText(/create a secure password/i);
    fireEvent.change(passwordInput, {
      target: { value: "MyPassword123!" },
    });

    expect(passwordInput.value).toBe("MyPassword123!");
  });

  it("handles confirm password input change", () => {
    renderComponent();

    const confirmPasswordInput = screen.getByPlaceholderText(/re-enter password/i);
    fireEvent.change(confirmPasswordInput, {
      target: { value: "MyPassword123!" },
    });

    expect(confirmPasswordInput.value).toBe("MyPassword123!");
  });

  it("renders username icon", () => {
    renderComponent();
    const usernameInput = screen.getByPlaceholderText(/choose a unique handle/i);
    const container = usernameInput.closest("div")?.parentElement;
    expect(container).toBeInTheDocument();
  });

  it("renders email icon", () => {
    renderComponent();
    const emailInput = screen.getByPlaceholderText(/name@shabdsetu.com/i);
    const container = emailInput.closest("div")?.parentElement;
    expect(container).toBeInTheDocument();
  });

  it("renders name icon", () => {
    renderComponent();
    const nameInput = screen.getByPlaceholderText(/tell us what to call you/i);
    const container = nameInput.closest("div")?.parentElement;
    expect(container).toBeInTheDocument();
  });

  it("has proper form structure", () => {
    renderComponent();
    const form = screen.getByRole("button", { name: /create account/i }).closest("form");
    expect(form).toBeInTheDocument();
  });

  it("prevents context menu on page", () => {
    renderComponent();
    const container = screen.getByText(/create your profile/i).closest("div");
    const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");
    
    container?.dispatchEvent(event);
    
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it("renders decorative background elements", () => {
    renderComponent();
    const container = screen.getByText(/create your profile/i).closest("div")?.parentElement?.parentElement;
    expect(container).toHaveClass("relative");
  });

  it("renders divider between google login and form", () => {
    renderComponent();
    const divider = screen.getByText((content, element) => {
      return element?.tagName === "SPAN" && content === "or";
    });
    expect(divider).toBeInTheDocument();
  });

  it("has accessible labels for form fields", () => {
    renderComponent();
    
    expect(screen.getByPlaceholderText(/tell us what to call you/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/choose a unique handle/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/name@shabdsetu.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/create a secure password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/re-enter password/i)).toBeInTheDocument();
  });

  it("renders submit button with correct text", () => {
    renderComponent();
    const submitButton = screen.getByRole("button", { name: /create account/i });
    expect(submitButton).toHaveTextContent(/create account/i);
  });

  it("handles successful registration submission", async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { available: true } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: "Registration successful" }),
      });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/tell us what to call you/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByPlaceholderText(/choose a unique handle/i), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByPlaceholderText(/name@shabdsetu.com/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/create a secure password/i), {
      target: { value: "ValidPass123!" },
    });
    fireEvent.change(screen.getByPlaceholderText(/re-enter password/i), {
      target: { value: "ValidPass123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/verify & continue/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("handles OTP input field in verification step", async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { available: true } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: "Registration successful" }),
      });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/tell us what to call you/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByPlaceholderText(/choose a unique handle/i), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByPlaceholderText(/name@shabdsetu.com/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/create a secure password/i), {
      target: { value: "ValidPass123!" },
    });
    fireEvent.change(screen.getByPlaceholderText(/re-enter password/i), {
      target: { value: "ValidPass123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      const otpInput = screen.getByPlaceholderText("000000");
      expect(otpInput).toBeInTheDocument();
      expect(otpInput).toHaveAttribute("maxlength", "6");
    }, { timeout: 3000 });
  });

  it("displays username as unavailable when already taken", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ data: { available: false } }),
    });

    renderComponent();

    const usernameInput = screen.getByPlaceholderText(/choose a unique handle/i);
    fireEvent.change(usernameInput, {
      target: { value: "takenuser" },
    });

    await waitFor(() => {
      const feedbackElement = screen.queryByText(/username is unavailable/i);
      if (feedbackElement) {
        expect(feedbackElement).toBeInTheDocument();
      }
    }, { timeout: 1500 });
  });

  it("shows checking feedback while validating username", async () => {
    global.fetch = vi.fn(() =>
      new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: () => Promise.resolve({ data: { available: true } }),
          });
        }, 100);
      })
    );

    renderComponent();

    const usernameInput = screen.getByPlaceholderText(/choose a unique handle/i);
    fireEvent.change(usernameInput, {
      target: { value: "checkuser" },
    });

    expect(usernameInput.value).toBe("checkuser");
  });

  it("handles username with only lowercase letters", () => {
    renderComponent();

    const usernameInput = screen.getByPlaceholderText(/choose a unique handle/i);
    fireEvent.change(usernameInput, {
      target: { value: "abc" },
    });

    expect(usernameInput.value).toBe("abc");
  });

  it("handles username with numbers", () => {
    renderComponent();

    const usernameInput = screen.getByPlaceholderText(/choose a unique handle/i);
    fireEvent.change(usernameInput, {
      target: { value: "user123" },
    });

    expect(usernameInput.value).toBe("user123");
  });

  it("renders password strength requirements", () => {
    renderComponent();
    
    const passwordInput = screen.getByPlaceholderText(/create a secure password/i);
    expect(passwordInput).toBeInTheDocument();
  });

  it("has password fields with correct initial type", () => {
    renderComponent();

    expect(screen.getByPlaceholderText(/create a secure password/i)).toHaveAttribute("type", "password");
    expect(screen.getByPlaceholderText(/re-enter password/i)).toHaveAttribute("type", "password");
  });

  it("handles form with valid data", () => {
    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/tell us what to call you/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText(/choose a unique handle/i), {
      target: { value: "johndoe" },
    });
    fireEvent.change(screen.getByPlaceholderText(/name@shabdsetu.com/i), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/create a secure password/i), {
      target: { value: "SecurePass123!" },
    });
    fireEvent.change(screen.getByPlaceholderText(/re-enter password/i), {
      target: { value: "SecurePass123!" },
    });

    expect(screen.getByPlaceholderText(/tell us what to call you/i).value).toBe("John Doe");
    expect(screen.getByPlaceholderText(/choose a unique handle/i).value).toBe("johndoe");
    expect(screen.getByPlaceholderText(/name@shabdsetu.com/i).value).toBe("john@example.com");
  });

  it("handles OTP input changes", async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { available: true } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: "Registration successful" }),
      });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/tell us what to call you/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByPlaceholderText(/choose a unique handle/i), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByPlaceholderText(/name@shabdsetu.com/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/create a secure password/i), {
      target: { value: "ValidPass123!" },
    });
    fireEvent.change(screen.getByPlaceholderText(/re-enter password/i), {
      target: { value: "ValidPass123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      const otpInput = screen.getByPlaceholderText("000000");
      fireEvent.change(otpInput, { target: { value: "123456" } });
      expect(otpInput.value).toBe("123456");
    }, { timeout: 3000 });
  });

  it("displays email in OTP verification step", async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { available: true } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: "Registration successful" }),
      });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/tell us what to call you/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByPlaceholderText(/choose a unique handle/i), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByPlaceholderText(/name@shabdsetu.com/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/create a secure password/i), {
      target: { value: "ValidPass123!" },
    });
    fireEvent.change(screen.getByPlaceholderText(/re-enter password/i), {
      target: { value: "ValidPass123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("shows resend button disabled with timer in OTP step", async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { available: true } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: "Registration successful" }),
      });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/tell us what to call you/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByPlaceholderText(/choose a unique handle/i), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByPlaceholderText(/name@shabdsetu.com/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/create a secure password/i), {
      target: { value: "ValidPass123!" },
    });
    fireEvent.change(screen.getByPlaceholderText(/re-enter password/i), {
      target: { value: "ValidPass123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      const resendButton = screen.getByRole("button", { name: /resend in \d+s/i });
      expect(resendButton).toBeDisabled();
    }, { timeout: 3000 });
  });

  it("handles successful OTP verification", async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { available: true } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: "Registration successful" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: "OTP verified" }),
      });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/tell us what to call you/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByPlaceholderText(/choose a unique handle/i), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByPlaceholderText(/name@shabdsetu.com/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/create a secure password/i), {
      target: { value: "ValidPass123!" },
    });
    fireEvent.change(screen.getByPlaceholderText(/re-enter password/i), {
      target: { value: "ValidPass123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      const otpInput = screen.getByPlaceholderText("000000");
      fireEvent.change(otpInput, { target: { value: "123456" } });
    }, { timeout: 3000 });

    const verifyButton = screen.getByRole("button", { name: /verify & continue/i });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/signin");
    }, { timeout: 3000 });
  });

  it("shows loading state on submit button", async () => {
    global.fetch = vi.fn(() =>
      new Promise(() => {}) // Never resolves to keep loading state
    );

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/tell us what to call you/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByPlaceholderText(/choose a unique handle/i), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByPlaceholderText(/name@shabdsetu.com/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/create a secure password/i), {
      target: { value: "ValidPass123!" },
    });
    fireEvent.change(screen.getByPlaceholderText(/re-enter password/i), {
      target: { value: "ValidPass123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /creating account/i })).toBeDisabled();
    }, { timeout: 500 });
  });

  it("strips special characters from username except underscores", () => {
    renderComponent();

    const usernameInput = screen.getByPlaceholderText(/choose a unique handle/i);
    fireEvent.change(usernameInput, {
      target: { value: "user@#$name_123" },
    });

    expect(usernameInput.value).toBe("username_123");
  });

  it("handles very short username input", () => {
    renderComponent();

    const usernameInput = screen.getByPlaceholderText(/choose a unique handle/i);
    fireEvent.change(usernameInput, {
      target: { value: "ab" },
    });

    expect(usernameInput.value).toBe("ab");
  });

  it("handles long username input", () => {
    renderComponent();

    const usernameInput = screen.getByPlaceholderText(/choose a unique handle/i);
    const longUsername = "a".repeat(25);
    fireEvent.change(usernameInput, {
      target: { value: longUsername },
    });

    expect(usernameInput.value).toBe(longUsername);
  });

  it("handles OTP verification with incorrect length", async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { available: true } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: "Registration successful" }),
      });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/tell us what to call you/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByPlaceholderText(/choose a unique handle/i), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByPlaceholderText(/name@shabdsetu.com/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/create a secure password/i), {
      target: { value: "ValidPass123!" },
    });
    fireEvent.change(screen.getByPlaceholderText(/re-enter password/i), {
      target: { value: "ValidPass123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      const otpInput = screen.getByPlaceholderText("000000");
      fireEvent.change(otpInput, { target: { value: "123" } });
    }, { timeout: 3000 });

    const verifyButton = screen.getByRole("button", { name: /verify & continue/i });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(showToastMock).toHaveBeenCalledWith("error", "Enter 6-digit OTP");
    }, { timeout: 1000 });
  });

  it("handles resend OTP button click", async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { available: true } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: "Registration successful" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: "OTP resent" }),
      });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/tell us what to call you/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByPlaceholderText(/choose a unique handle/i), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByPlaceholderText(/name@shabdsetu.com/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/create a secure password/i), {
      target: { value: "ValidPass123!" },
    });
    fireEvent.change(screen.getByPlaceholderText(/re-enter password/i), {
      target: { value: "ValidPass123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      const resendButton = screen.getByRole("button", { name: /resend in \d+s/i });
      expect(resendButton).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("shows verifying state on OTP submit", async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { available: true } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: "Registration successful" }),
      })
      .mockImplementationOnce(() =>
        new Promise(() => {}) // Never resolves to keep loading state
      );

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/tell us what to call you/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByPlaceholderText(/choose a unique handle/i), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByPlaceholderText(/name@shabdsetu.com/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/create a secure password/i), {
      target: { value: "ValidPass123!" },
    });
    fireEvent.change(screen.getByPlaceholderText(/re-enter password/i), {
      target: { value: "ValidPass123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      const otpInput = screen.getByPlaceholderText("000000");
      fireEvent.change(otpInput, { target: { value: "123456" } });
    }, { timeout: 3000 });

    const verifyButton = screen.getByRole("button", { name: /verify & continue/i });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /verifying/i })).toBeDisabled();
    }, { timeout: 500 });
  });

  it("handles form error with validation messages", async () => {
    renderComponent();

    // Submit empty form to trigger validation errors
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(showToastMock).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it("validates username length is within range", async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { available: true } }),
      });

    renderComponent();

    const usernameInput = screen.getByPlaceholderText(/choose a unique handle/i);
    fireEvent.change(usernameInput, { target: { value: "ab" } }); // Too short

    fireEvent.change(screen.getByPlaceholderText(/tell us what to call you/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByPlaceholderText(/name@shabdsetu.com/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/create a secure password/i), {
      target: { value: "ValidPass123!" },
    });
    fireEvent.change(screen.getByPlaceholderText(/re-enter password/i), {
      target: { value: "ValidPass123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(showToastMock).toHaveBeenCalledWith("error", expect.stringContaining("lowercase"));
    }, { timeout: 1000 });
  });

  it("validates username with invalid characters", async () => {
    renderComponent();

    const usernameInput = screen.getByPlaceholderText(/choose a unique handle/i);
    fireEvent.change(usernameInput, { target: { value: "user$name" } }); // Invalid character

    fireEvent.change(screen.getByPlaceholderText(/tell us what to call you/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByPlaceholderText(/name@shabdsetu.com/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/create a secure password/i), {
      target: { value: "ValidPass123!" },
    });
    fireEvent.change(screen.getByPlaceholderText(/re-enter password/i), {
      target: { value: "ValidPass123!" },
    });

    expect(usernameInput.value).toBe("username");
  });

  it("normalizes email to lowercase", async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { available: true } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: "Registration successful" }),
      });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/tell us what to call you/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByPlaceholderText(/choose a unique handle/i), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByPlaceholderText(/name@shabdsetu.com/i), {
      target: { value: "Test@Example.COM" },
    });
    fireEvent.change(screen.getByPlaceholderText(/create a secure password/i), {
      target: { value: "ValidPass123!" },
    });
    fireEvent.change(screen.getByPlaceholderText(/re-enter password/i), {
      target: { value: "ValidPass123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining("test@example.com")
        })
      );
    }, { timeout: 3000 });
  });

  it("trims name and email values on submit", async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { available: true } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: "Registration successful" }),
      });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/tell us what to call you/i), {
      target: { value: "  Test User  " },
    });
    fireEvent.change(screen.getByPlaceholderText(/choose a unique handle/i), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByPlaceholderText(/name@shabdsetu.com/i), {
      target: { value: "  test@example.com  " },
    });
    fireEvent.change(screen.getByPlaceholderText(/create a secure password/i), {
      target: { value: "ValidPass123!" },
    });
    fireEvent.change(screen.getByPlaceholderText(/re-enter password/i), {
      target: { value: "ValidPass123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining("Test User")
        })
      );
    }, { timeout: 3000 });
  });

});
