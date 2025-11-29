import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import SaveButton from "@/components/SaveButton";
import { vi } from "vitest";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getEnv } from "@/helpers/getEnv";
import { showToast } from "@/helpers/showToast";
import { RouteSignIn } from "@/helpers/RouteName";

vi.mock("react-redux", () => ({
	useSelector: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
	useNavigate: vi.fn(),
}));

vi.mock("@/helpers/getEnv", () => ({
	getEnv: vi.fn(),
}));

vi.mock("@/helpers/showToast", () => ({
	showToast: vi.fn(),
}));

const mockNavigate = vi.fn();

const setAuthState = ({ isLoggedIn = false } = {}) => {
	useSelector.mockImplementation((selector) =>
		selector({ user: { isLoggedIn } })
	);
};

const apiResponse = ({ ok = true, jsonData = {} } = {}) => ({
	ok,
	json: () => Promise.resolve(jsonData),
});

describe("SaveButton", () => {
	const originalFetch = global.fetch;

	beforeEach(() => {
		vi.clearAllMocks();
		setAuthState();
		getEnv.mockReturnValue("https://api.example.com");
		useNavigate.mockReturnValue(mockNavigate);
		global.fetch = vi.fn();
	});

	afterEach(() => {
		cleanup();
	});

	afterAll(() => {
		global.fetch = originalFetch;
	});

	it("redirects guests to sign-in when toggled", () => {
		render(<SaveButton blogId="blog-1" withLabel />);

		fireEvent.click(screen.getByRole("button", { name: /save blog/i }));

		expect(mockNavigate).toHaveBeenCalledWith(RouteSignIn);
		expect(global.fetch).not.toHaveBeenCalled();
	});

	it("applies the compact icon sizing when requested", () => {
		setAuthState({ isLoggedIn: true });
		global.fetch.mockResolvedValue(apiResponse({ jsonData: { isSaved: false } }));

		render(<SaveButton blogId="blog-compact" withLabel size="sm" />);

		const icon = screen.getByRole("button", { name: /save blog/i }).querySelector("svg");
		expect(icon).toHaveClass("h-4 w-4");
	});

	it("skips the initial status fetch if prerequisites are missing", async () => {
		setAuthState();
		render(<SaveButton blogId="blog-guest" withLabel />);

		await waitFor(() => expect(global.fetch).not.toHaveBeenCalled());
	});

	it("fetches saved status when logged in", async () => {
		setAuthState({ isLoggedIn: true });
		global.fetch.mockResolvedValue(apiResponse({ jsonData: { isSaved: true } }));

		render(<SaveButton blogId="blog-2" withLabel />);

		await waitFor(() =>
			expect(global.fetch).toHaveBeenCalledWith(
				"https://api.example.com/save/status/blog-2",
				expect.objectContaining({ method: "get", credentials: "include" })
			)
		);

		const button = screen.getByRole("button", { name: /remove from saved/i });
		expect(button).toHaveAttribute("aria-pressed", "true");
		expect(button).toHaveTextContent("Saved");
	});

	it("toggles saved state and dispatches update events", async () => {
		setAuthState({ isLoggedIn: true });
		const dispatchSpy = vi.spyOn(window, "dispatchEvent");

		global.fetch
			.mockResolvedValueOnce(apiResponse({ jsonData: { isSaved: false } }))
			.mockResolvedValueOnce(
				apiResponse({ jsonData: { isSaved: true, message: "Blog saved." } })
			);

		render(<SaveButton blogId="blog-3" withLabel />);

		const button = await screen.findByRole("button", { name: /save blog/i });
		fireEvent.click(button);

		await waitFor(() =>
			expect(global.fetch).toHaveBeenLastCalledWith(
				"https://api.example.com/save/toggle/blog-3",
				expect.objectContaining({ method: "POST", credentials: "include" })
			)
		);

		await waitFor(() =>
			expect(showToast).toHaveBeenCalledWith("success", "Blog saved.")
		);
		expect(button).toHaveAttribute("aria-pressed", "true");
		expect(dispatchSpy).toHaveBeenCalled();
		dispatchSpy.mockRestore();
	});

	it("shows an error toast when the toggle request fails", async () => {
		setAuthState({ isLoggedIn: true });
		global.fetch
			.mockResolvedValueOnce(apiResponse({ jsonData: { isSaved: false } }))
			.mockResolvedValueOnce(
				apiResponse({ ok: false, jsonData: { message: "Unable to update" } })
			);

		render(<SaveButton blogId="blog-4" withLabel />);

		const button = await screen.findByRole("button", { name: /save blog/i });
		fireEvent.click(button);

		await waitFor(() =>
			expect(showToast).toHaveBeenCalledWith("error", "Unable to update")
		);
		expect(button).toHaveAttribute("aria-pressed", "false");
	});

	it("reacts to savedUpdated custom events", async () => {
		setAuthState({ isLoggedIn: true });
		global.fetch.mockResolvedValue(apiResponse({ jsonData: { isSaved: false } }));

		render(<SaveButton blogId="blog-5" withLabel />);

		const button = await screen.findByRole("button", { name: /save blog/i });

		act(() => {
			window.dispatchEvent(
				new CustomEvent("savedUpdated", { detail: { blogId: "blog-5", isSaved: true } })
			);
		});

		await waitFor(() => expect(button).toHaveAttribute("aria-pressed", "true"));

		act(() => {
			window.dispatchEvent(
				new CustomEvent("savedUpdated", { detail: { blogId: "blog-5", isSaved: false } })
			);
		});

		await waitFor(() => expect(button).toHaveAttribute("aria-pressed", "false"));
	});

	it("shows a descriptive error when the toggle request throws", async () => {
		setAuthState({ isLoggedIn: true });
		global.fetch
			.mockResolvedValueOnce(apiResponse({ jsonData: { isSaved: false } }))
			.mockRejectedValueOnce(new Error("network failure"));

		render(<SaveButton blogId="blog-6" withLabel />);

		const button = await screen.findByRole("button", { name: /save blog/i });
		fireEvent.click(button);

		await waitFor(() =>
			expect(showToast).toHaveBeenCalledWith("error", "network failure")
		);
		expect(button).toHaveAttribute("aria-pressed", "false");
	});

	it("prevents duplicate toggle calls while a request is in flight", async () => {
		setAuthState({ isLoggedIn: true });
		const toggleDeferred = {};
		toggleDeferred.promise = new Promise((resolve) => {
			toggleDeferred.resolve = resolve;
		});

		global.fetch
			.mockResolvedValueOnce(apiResponse({ jsonData: { isSaved: false } }))
			.mockReturnValueOnce(toggleDeferred.promise);

		render(<SaveButton blogId="blog-7" withLabel />);

		const button = await screen.findByRole("button", { name: /save blog/i });
		fireEvent.click(button);
		fireEvent.click(button);

		expect(global.fetch).toHaveBeenCalledTimes(2);

		toggleDeferred.resolve(
			apiResponse({ jsonData: { isSaved: true, message: "Saved" } })
		);

		await waitFor(() => expect(button).toHaveAttribute("aria-pressed", "true"));
	});

	it("handles fetch status JSON parse errors gracefully", async () => {
		setAuthState({ isLoggedIn: true });
		global.fetch.mockResolvedValue({
			ok: true,
			json: () => Promise.reject(new Error("Invalid JSON")),
		});

		render(<SaveButton blogId="blog-parse-error" withLabel />);

		await waitFor(() => expect(global.fetch).toHaveBeenCalled());
		const button = screen.getByRole("button", { name: /save blog/i });
		expect(button).toBeInTheDocument();
	});

	it("handles toggle response JSON parse errors gracefully", async () => {
		setAuthState({ isLoggedIn: true });
		global.fetch
			.mockResolvedValueOnce(apiResponse({ jsonData: { isSaved: false } }))
			.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.reject(new Error("Invalid JSON")),
			});

		render(<SaveButton blogId="blog-toggle-parse" withLabel />);

		const button = await screen.findByRole("button", { name: /save blog/i });
		fireEvent.click(button);

		await waitFor(() => {
			expect(global.fetch).toHaveBeenLastCalledWith(
				"https://api.example.com/save/toggle/blog-toggle-parse",
				expect.objectContaining({ method: "POST" })
			);
		});
	});

	it("shows default success message when toggle succeeds without custom message", async () => {
		setAuthState({ isLoggedIn: true });
		global.fetch
			.mockResolvedValueOnce(apiResponse({ jsonData: { isSaved: false } }))
			.mockResolvedValueOnce(apiResponse({ jsonData: { isSaved: true } }));

		render(<SaveButton blogId="blog-default-msg" withLabel />);

		const button = await screen.findByRole("button", { name: /save blog/i });
		fireEvent.click(button);

		await waitFor(() =>
			expect(showToast).toHaveBeenCalledWith("success", "Blog saved.")
		);
	});

	it("shows default success message when unsaving without custom message", async () => {
		setAuthState({ isLoggedIn: true });
		global.fetch
			.mockResolvedValueOnce(apiResponse({ jsonData: { isSaved: true } }))
			.mockResolvedValueOnce(apiResponse({ jsonData: { isSaved: false } }));

		render(<SaveButton blogId="blog-unsave-msg" withLabel />);

		const button = await screen.findByRole("button", { name: /remove from saved/i });
		fireEvent.click(button);

		await waitFor(() =>
			expect(showToast).toHaveBeenCalledWith("success", "Removed from saved.")
		);
	});

	it("shows default error message when toggle fails without custom message", async () => {
		setAuthState({ isLoggedIn: true });
		global.fetch
			.mockResolvedValueOnce(apiResponse({ jsonData: { isSaved: false } }))
			.mockResolvedValueOnce(apiResponse({ ok: false, jsonData: {} }));

		render(<SaveButton blogId="blog-default-error" withLabel />);

		const button = await screen.findByRole("button", { name: /save blog/i });
		fireEvent.click(button);

		await waitFor(() =>
			expect(showToast).toHaveBeenCalledWith("error", "Unable to update saved status.")
		);
	});

	it("shows default error message when toggle throws without message", async () => {
		setAuthState({ isLoggedIn: true });
		global.fetch
			.mockResolvedValueOnce(apiResponse({ jsonData: { isSaved: false } }))
			.mockRejectedValueOnce(new Error());

		render(<SaveButton blogId="blog-empty-error" withLabel />);

		const button = await screen.findByRole("button", { name: /save blog/i });
		fireEvent.click(button);

		await waitFor(() =>
			expect(showToast).toHaveBeenCalledWith("error", "Unable to update saved status.")
		);
	});

	it("prevents toggle when blogId is missing", async () => {
		setAuthState({ isLoggedIn: true });
		render(<SaveButton blogId={null} withLabel />);

		const button = screen.getByRole("button", { name: /save blog/i });
		fireEvent.click(button);

		expect(global.fetch).not.toHaveBeenCalled();
	});

	it("handles fetch status network errors silently", async () => {
		setAuthState({ isLoggedIn: true });
		global.fetch.mockRejectedValue(new Error("Network error"));

		render(<SaveButton blogId="blog-network-error" withLabel />);

		await waitFor(() => expect(global.fetch).toHaveBeenCalled());
		
		// Should not show error toast for status fetch failures
		expect(showToast).not.toHaveBeenCalled();
	});

	it("ignores fetch status response when component unmounts", async () => {
		setAuthState({ isLoggedIn: true });
		let resolveStatus;
		const statusPromise = new Promise((resolve) => {
			resolveStatus = resolve;
		});
		global.fetch.mockReturnValue(statusPromise);

		const { unmount } = render(<SaveButton blogId="blog-unmount" withLabel />);

		unmount();

		resolveStatus(apiResponse({ jsonData: { isSaved: true } }));

		// No error should be thrown
		await waitFor(() => expect(global.fetch).toHaveBeenCalled());
	});

	it("resets saved state when user logs out", async () => {
		setAuthState({ isLoggedIn: true });
		global.fetch.mockResolvedValue(apiResponse({ jsonData: { isSaved: true } }));

		const { rerender } = render(<SaveButton blogId="blog-logout" withLabel />);

		await waitFor(() => {
			const button = screen.getByRole("button", { name: /remove from saved/i });
			expect(button).toHaveAttribute("aria-pressed", "true");
		});

		setAuthState({ isLoggedIn: false });
		rerender(<SaveButton blogId="blog-logout" withLabel />);

		await waitFor(() => {
			const button = screen.getByRole("button", { name: /save blog/i });
			expect(button).toHaveAttribute("aria-pressed", "false");
		});
	});
});

