import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import FollowButton from "@/components/FollowButton";
import { vi } from "vitest";
import { useSelector } from "react-redux";
import { getEnv } from "@/helpers/getEnv";
import { showToast } from "@/helpers/showToast";

vi.mock("react-redux", () => ({
	useSelector: vi.fn(),
}));

vi.mock("@/helpers/getEnv", () => ({
	getEnv: vi.fn(),
}));

vi.mock("@/helpers/showToast", () => ({
	showToast: vi.fn(),
}));

const mockUserState = ({ user = null, isLoggedIn = false } = {}) => {
	useSelector.mockImplementation((selector) =>
		selector({ user: { user, isLoggedIn } })
	);
};

const buildResponse = ({ ok = true, jsonData = {} } = {}) => ({
	ok,
	json: () => Promise.resolve(jsonData),
});

describe("FollowButton", () => {
	const originalFetch = global.fetch;

	beforeEach(() => {
		vi.clearAllMocks();
		getEnv.mockReturnValue("https://api.example.com");
		mockUserState();
		global.fetch = vi.fn();
	});

	afterAll(() => {
		global.fetch = originalFetch;
	});

	it("does not render when the user views their own profile", async () => {
		mockUserState({ user: { _id: "user-1" } });

		const { container } = render(<FollowButton userId="user-1" />);

		expect(container).toBeEmptyDOMElement();
		await waitFor(() => {
			expect(global.fetch).not.toHaveBeenCalled();
		});
	});

	it("renders the follow button for guests without firing network calls", async () => {
		render(<FollowButton userId="publisher" />);

		await waitFor(() =>
			expect(screen.getByRole("button", { name: /follow/i })).toBeInTheDocument()
		);

		expect(global.fetch).not.toHaveBeenCalled();

		fireEvent.click(screen.getByRole("button", { name: /follow/i }));
		expect(showToast).toHaveBeenCalledWith(
			"error",
			"Please login to follow users"
		);
	});

	it("fetches follow state and toggles successfully", async () => {
		mockUserState({ user: { _id: "session-user" } });

		global.fetch
			.mockResolvedValueOnce(buildResponse({ jsonData: { isFollowing: false } }))
			.mockResolvedValueOnce(
				buildResponse({ jsonData: { message: "Now following", isFollowing: true } })
			);

		render(<FollowButton userId="author-1" />);

		await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
		expect(global.fetch).toHaveBeenCalledWith(
			"https://api.example.com/follow/check/author-1",
			expect.objectContaining({ method: "GET", credentials: "include" })
		);

		const button = await screen.findByRole("button", { name: /follow/i });
		fireEvent.click(button);

		await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
		expect(global.fetch).toHaveBeenLastCalledWith(
			"https://api.example.com/follow/follow/author-1",
			expect.objectContaining({ method: "POST", credentials: "include" })
		);

		await waitFor(() => expect(showToast).toHaveBeenCalledWith("success", "Now following"));
		expect(button).toHaveTextContent("Unfollow");
	});

	it("notifies the user when toggling fails", async () => {
		mockUserState({ user: { _id: "session-user" } });

		global.fetch
			.mockResolvedValueOnce(buildResponse({ jsonData: { isFollowing: true } }))
			.mockResolvedValueOnce(
				buildResponse({ ok: false, jsonData: { message: "Unable to update" } })
			);

		render(<FollowButton userId="creator" />);

		const button = await screen.findByRole("button", { name: /unfollow/i });
		fireEvent.click(button);

		await waitFor(() =>
			expect(showToast).toHaveBeenCalledWith("error", "Unable to update")
		);
		expect(button).toHaveTextContent("Unfollow");
	});

	it("falls back to a generic error when the request throws", async () => {
		mockUserState({ user: { _id: "session-user" } });
		global.fetch
			.mockResolvedValueOnce(buildResponse({ jsonData: { isFollowing: false } }))
			.mockRejectedValueOnce(new Error("network down"));

		render(<FollowButton userId="creator" />);

		const button = await screen.findByRole("button", { name: /follow/i });
		fireEvent.click(button);

		await waitFor(() =>
			expect(showToast).toHaveBeenCalledWith("error", "Something went wrong")
		);
		expect(button).toHaveTextContent("Follow");
	});

	it("handles follow status check errors silently", async () => {
		mockUserState({ user: { _id: "session-user" } });
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		global.fetch.mockRejectedValueOnce(new Error("Network error"));

		render(<FollowButton userId="author-error" />);

		await waitFor(() => expect(global.fetch).toHaveBeenCalled());
		await waitFor(() => {
			expect(screen.getByRole("button", { name: /follow/i })).toBeInTheDocument();
		});

		expect(consoleErrorSpy).toHaveBeenCalledWith("Error checking follow status:", expect.any(Error));
		consoleErrorSpy.mockRestore();
	});

	it("shows unfollow button for already followed users", async () => {
		mockUserState({ user: { _id: "session-user" } });
		global.fetch.mockResolvedValueOnce(buildResponse({ jsonData: { isFollowing: true } }));

		render(<FollowButton userId="followed-author" />);

		await waitFor(() => {
			expect(screen.getByRole("button", { name: /unfollow/i })).toBeInTheDocument();
		});
	});

	it("handles unfollow action successfully", async () => {
		mockUserState({ user: { _id: "session-user" } });
		global.fetch
			.mockResolvedValueOnce(buildResponse({ jsonData: { isFollowing: true } }))
			.mockResolvedValueOnce(
				buildResponse({ jsonData: { message: "Unfollowed successfully", isFollowing: false } })
			);

		render(<FollowButton userId="author-unfollow" />);

		const button = await screen.findByRole("button", { name: /unfollow/i });
		fireEvent.click(button);

		await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
		expect(global.fetch).toHaveBeenLastCalledWith(
			"https://api.example.com/follow/unfollow/author-unfollow",
			expect.objectContaining({ method: "DELETE", credentials: "include" })
		);

		await waitFor(() => expect(showToast).toHaveBeenCalledWith("success", "Unfollowed successfully"));
		expect(button).toHaveTextContent("Follow");
	});
});
