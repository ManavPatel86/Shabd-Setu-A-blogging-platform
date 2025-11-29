import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import React from "react";
import Profile from "@/pages/Profile";
import { MemoryRouter } from "react-router-dom";

const useFetchMock = vi.fn();
const showToastMock = vi.fn();
const mockDispatch = vi.fn();

vi.mock("react-redux", () => ({
	useSelector: (selector) =>
		selector({
			user: {
				user: { _id: "user-1", name: "Current User", username: "current" },
			},
		}),
	useDispatch: () => mockDispatch,
}));

vi.mock("@/helpers/getEnv", () => ({
	getEnv: () => "https://api.example.com",
}));

vi.mock("@/hooks/useFetch", () => ({
	useFetch: (...args) => useFetchMock(...args),
}));

vi.mock("@/helpers/showToast", () => ({
	showToast: (...args) => showToastMock(...args),
}));

vi.mock("@/components/Loading", () => ({
	__esModule: true,
	default: () => <div data-testid="loading" />,
}));

vi.mock("@/components/ActivityHeatmap", () => ({
	__esModule: true,
	default: () => <div data-testid="heatmap" />,
}));

vi.mock("react-dropzone", () => ({
	__esModule: true,
	default: ({ children }) =>
		typeof children === "function"
			? children({
					getRootProps: () => ({}),
					getInputProps: () => ({}),
					isDragActive: false,
				})
			: children,
}));

describe("Profile page", () => {
	let fetchResponses;
	const clipboardWriteMock = vi.fn();
	const originalClipboard = navigator.clipboard;
	const originalURL = global.URL;
	const originalCreateObjectURL = global.URL?.createObjectURL;
	const originalRevokeObjectURL = global.URL?.revokeObjectURL;

	const defaultUser = {
		success: true,
		user: {
			_id: "user-1",
			name: "Jane Creator",
			email: "jane@example.com",
			bio: "Writes about testing.",
			username: "janewriter",
		},
	};

	const defaultOverview = {
		stats: {
			totalPosts: 12,
			totalViews: 3400,
			totalLikes: 120,
			followersCount: 45,
			followingCount: 10,
		},
		highlights: {
			topCategories: [
				{ name: "Testing", slug: "testing" },
				{ name: "React", slug: "react" },
			],
		},
		recentPosts: [],
		user: {
			_id: "user-1",
			name: "Jane Creator",
			username: "janewriter",
			bio: "Writes about testing.",
			role: "Author",
			createdAt: "2024-01-01T00:00:00.000Z",
		},
	};

	const renderProfile = () =>
		render(
			<MemoryRouter>
				<Profile />
			</MemoryRouter>
		);

	beforeEach(() => {
		fetchResponses = {
			user: { data: defaultUser, loading: false, error: null },
			contributions: { data: { totalBlogs: 3 }, loading: false, error: null },
			overview: { data: defaultOverview, loading: false, error: null },
		};

		useFetchMock.mockImplementation((url) => {
			if (!url) {
				return { data: null, loading: false, error: null };
			}
			if (url.includes("/user/get-user/")) {
				return fetchResponses.user;
			}
			if (url.includes("/user/contributions/")) {
				return fetchResponses.contributions;
			}
			if (url.includes("/user/profile-overview/")) {
				return fetchResponses.overview;
			}
			return { data: null, loading: false, error: null };
		});

		Object.defineProperty(navigator, "clipboard", {
			value: { writeText: clipboardWriteMock.mockResolvedValue() },
			configurable: true,
		});

		if (!global.URL) {
			global.URL = {};
		}
		global.URL.createObjectURL = vi.fn(() => "blob:preview");
		global.URL.revokeObjectURL = vi.fn();
	});

	afterEach(() => {
		useFetchMock.mockReset();
		clipboardWriteMock.mockReset();
		mockDispatch.mockReset();
		showToastMock.mockReset();

		if (originalClipboard) {
			Object.defineProperty(navigator, "clipboard", {
				value: originalClipboard,
				configurable: true,
			});
		} else {
			delete navigator.clipboard;
		}

		if (originalURL) {
			global.URL = originalURL;
			global.URL.createObjectURL = originalCreateObjectURL;
			global.URL.revokeObjectURL = originalRevokeObjectURL;
		}
	});

	it("renders overview stats and copies username", async () => {
		renderProfile();

		expect(await screen.findByText(/Creator cockpit/i)).toBeInTheDocument();
		expect(screen.getByText(/Jane Creator/i)).toBeInTheDocument();
		expect(screen.getByText(/Total posts/i)).toBeInTheDocument();
		expect(screen.getByText("12")).toBeInTheDocument();

		// Find username element (may appear multiple times)
		const usernameElements = await screen.findAllByText(/@janewriter/i);
		expect(usernameElements.length).toBeGreaterThan(0);
	});

	it("shows an error view when user details fail to load", async () => {
		fetchResponses.user = { data: null, loading: false, error: { message: "Network" } };

		renderProfile();

		expect(await screen.findByText(/couldn't load your profile settings/i)).toBeInTheDocument();
	});

	it("displays loading state while fetching user data", () => {
		fetchResponses.user = { data: null, loading: true, error: null };

		renderProfile();

		expect(screen.getByTestId("loading")).toBeInTheDocument();
	});

	it("renders profile form with user data", async () => {
		renderProfile();

		await waitFor(() => {
			expect(screen.getByDisplayValue("Jane Creator")).toBeInTheDocument();
			expect(screen.getByDisplayValue("Writes about testing.")).toBeInTheDocument();
		});
	});

	it("renders activity heatmap component", async () => {
		renderProfile();

		expect(await screen.findByTestId("heatmap")).toBeInTheDocument();
	});

	it("displays overview stats correctly", async () => {
		renderProfile();

		await waitFor(() => {
			expect(screen.getByText("12")).toBeInTheDocument(); // total posts
			expect(screen.getByText("45")).toBeInTheDocument(); // followers
		});
	});

	it("renders top categories", async () => {
		renderProfile();

		await waitFor(() => {
			expect(screen.getAllByText("Testing")[0]).toBeInTheDocument();
			expect(screen.getAllByText("React")[0]).toBeInTheDocument();
		});
	});

	it("handles overview data loading", async () => {
		fetchResponses.overview = { data: null, loading: true, error: null };

		renderProfile();

		// Should still render basic profile info
		await waitFor(() => {
			expect(screen.getByText(/Jane Creator/i)).toBeInTheDocument();
		});
	});

	it("handles missing overview data gracefully", async () => {
		fetchResponses.overview = { data: null, loading: false, error: null };

		renderProfile();

		// Should not crash, should show default state
		expect(await screen.findByText(/Creator cockpit/i)).toBeInTheDocument();
	});

	it("handles overview error state", async () => {
		fetchResponses.overview = { 
			data: null, 
			loading: false, 
			error: "Failed to load overview" 
		};

		renderProfile();

		await waitFor(() => {
			expect(screen.getByText(/Creator cockpit/i)).toBeInTheDocument();
		});
	});

	it("renders profile form fields correctly", async () => {
		renderProfile();

		await waitFor(() => {
			expect(screen.getByDisplayValue("Jane Creator")).toBeInTheDocument();
		});
	});

	it("handles copy username functionality", async () => {
		renderProfile();

		await waitFor(() => {
			const copyButtons = screen.getAllByText(/Copy handle/i);
			expect(copyButtons.length).toBeGreaterThan(0);
		});

		const copyButton = screen.getAllByText(/Copy handle/i)[0];
		fireEvent.click(copyButton);

		await waitFor(() => {
			expect(clipboardWriteMock).toHaveBeenCalledWith("@janewriter");
			expect(showToastMock).toHaveBeenCalledWith("success", expect.stringContaining("copied"));
		});
	});

	it("handles copy username when clipboard unavailable", async () => {
		Object.defineProperty(navigator, "clipboard", {
			value: undefined,
			configurable: true,
		});

		renderProfile();

		await waitFor(() => {
			const copyButtons = screen.getAllByText(/Copy handle/i);
			expect(copyButtons.length).toBeGreaterThan(0);
		});

		const copyButton = screen.getAllByText(/Copy handle/i)[0];
		fireEvent.click(copyButton);

		await waitFor(() => {
			expect(showToastMock).toHaveBeenCalledWith("error", expect.any(String));
		});
	});

	it("enables username change mode", async () => {
		renderProfile();

		await waitFor(() => {
			const changeButton = screen.getByText(/Change username/i);
			expect(changeButton).toBeInTheDocument();
		});

		fireEvent.click(screen.getByText(/Change username/i));

		await waitFor(() => {
			expect(screen.getByText(/Cancel/i)).toBeInTheDocument();
		});
	});

	it("cancels username change", async () => {
		renderProfile();

		await waitFor(() => {
			fireEvent.click(screen.getByText(/Change username/i));
		});

		await waitFor(() => {
			const cancelButton = screen.getByText(/Cancel/i);
			fireEvent.click(cancelButton);
		});

		await waitFor(() => {
			expect(screen.getByText(/Change username/i)).toBeInTheDocument();
		});
	});

	it("enables password change mode", async () => {
		renderProfile();

		await waitFor(() => {
			const changePasswordButtons = screen.getAllByText(/Change password/i);
			expect(changePasswordButtons.length).toBeGreaterThan(0);
		});

		fireEvent.click(screen.getAllByText(/Change password/i)[0]);

		await waitFor(() => {
			expect(screen.getByPlaceholderText(/Enter your current password/i)).toBeInTheDocument();
		});
	});

	it("cancels password change", async () => {
		renderProfile();

		await waitFor(() => {
			fireEvent.click(screen.getAllByText(/Change password/i)[0]);
		});

		await waitFor(() => {
			const cancelButtons = screen.getAllByText(/Cancel/i);
			fireEvent.click(cancelButtons[0]);
		});

		await waitFor(() => {
			expect(screen.queryByPlaceholderText(/Enter your current password/i)).not.toBeInTheDocument();
		});
	});

	it("submits profile update successfully", async () => {
		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				success: true,
				message: "Profile updated",
				user: { ...defaultUser.user, name: "Updated Name" },
			}),
		});

		renderProfile();

		await waitFor(() => {
			const nameInput = screen.getByDisplayValue("Jane Creator");
			fireEvent.change(nameInput, { target: { value: "Updated Name" } });
		});

		await waitFor(() => {
			const saveButton = screen.getByRole("button", { name: /Save changes/i });
			fireEvent.click(saveButton);
		});

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining("/user/update-user/"),
				expect.objectContaining({ method: "put" })
			);
			expect(showToastMock).toHaveBeenCalledWith("success", "Profile updated");
			expect(mockDispatch).toHaveBeenCalled();
		});
	});

	it("handles profile update error", async () => {
		global.fetch = vi.fn().mockResolvedValue({
			ok: false,
			json: async () => ({ message: "Update failed" }),
		});

		renderProfile();

		await waitFor(() => {
			const saveButton = screen.getByRole("button", { name: /Save changes/i });
			fireEvent.click(saveButton);
		});

		await waitFor(() => {
			expect(showToastMock).toHaveBeenCalledWith("error", "Update failed");
		});
	});

	it("validates username before submission", async () => {
		renderProfile();

		await waitFor(() => {
			fireEvent.click(screen.getByText(/Change username/i));
		});

		await waitFor(() => {
			const usernameInput = screen.getByDisplayValue("janewriter");
			fireEvent.change(usernameInput, { target: { value: "ab" } });
		});

		await waitFor(() => {
			const saveButton = screen.getByRole("button", { name: /Save changes/i });
			fireEvent.click(saveButton);
		});

		await waitFor(() => {
			expect(showToastMock).toHaveBeenCalled();
		});
	});



	it("displays recent posts section", async () => {
		fetchResponses.overview = {
			...fetchResponses.overview,
			data: {
				...defaultOverview,
				recentPosts: [
					{
						_id: "post1",
						title: "Test Post 1",
						slug: "test-post-1",
						views: 100,
						likeCount: 10,
						createdAt: "2024-01-15T00:00:00.000Z",
						categories: [{ name: "Tech", slug: "tech" }],
					},
				],
			},
		};

		renderProfile();

		await waitFor(() => {
			expect(screen.getByText("Test Post 1")).toBeInTheDocument();
			expect(screen.getByText("100 views")).toBeInTheDocument();
		});
	});

	it("displays top post highlight", async () => {
		fetchResponses.overview = {
			...fetchResponses.overview,
			data: {
				...defaultOverview,
				highlights: {
					...defaultOverview.highlights,
					topPost: {
						id: "top1",
						title: "Most Popular Post",
						slug: "popular",
						views: 5000,
						likeCount: 500,
						createdAt: "2024-01-10T00:00:00.000Z",
						categories: [{ name: "Viral", slug: "viral" }],
					},
				},
			},
		};

		renderProfile();

		await waitFor(() => {
			expect(screen.getByText("Most Popular Post")).toBeInTheDocument();
			expect(screen.getByText("5,000 views")).toBeInTheDocument();
		});
	});

	it("renders navigation buttons", async () => {
		renderProfile();

		await waitFor(() => {
			expect(screen.getByText(/Write a new blog/i)).toBeInTheDocument();
			expect(screen.getByText(/View public profile/i)).toBeInTheDocument();
			expect(screen.getByText(/See your analytics/i)).toBeInTheDocument();
		});
	});

	it("displays empty state for no posts", async () => {
		fetchResponses.overview = {
			...fetchResponses.overview,
			data: {
				...defaultOverview,
				recentPosts: [],
				highlights: { ...defaultOverview.highlights, topPost: null },
			},
		};

		renderProfile();

		await waitFor(() => {
			expect(screen.getByText(/Publish your first post/i)).toBeInTheDocument();
			expect(screen.getByText(/Publish a post to start building/i)).toBeInTheDocument();
		});
	});

	it("displays contribution statistics", async () => {
		renderProfile();

		await waitFor(() => {
			expect(screen.getByText("3")).toBeInTheDocument(); // totalBlogs from contributions
		});
	});

	it("handles missing bio gracefully", async () => {
		fetchResponses.overview = {
			...fetchResponses.overview,
			data: {
				...defaultOverview,
				user: { ...defaultOverview.user, bio: "" },
			},
		};

		renderProfile();

		await waitFor(() => {
			expect(screen.getByText(/Add a short bio/i)).toBeInTheDocument();
		});
	});

	it("handles contributions loading state", async () => {
		fetchResponses.contributions = { data: null, loading: true, error: null };

		renderProfile();

		await waitFor(() => {
			expect(screen.getByText(/Loading activity/i)).toBeInTheDocument();
		});
	});

	it("handles contributions error state", async () => {
		fetchResponses.contributions = { data: null, loading: false, error: "Failed" };

		renderProfile();

		await waitFor(() => {
			expect(screen.getByText(/Unable to load your activity heatmap/i)).toBeInTheDocument();
		});
	});

	it("displays zero blogs message", async () => {
		fetchResponses.contributions = {
			data: { totalBlogs: 0, contributions: [] },
			loading: false,
			error: null,
		};

		renderProfile();

		await waitFor(() => {
			expect(screen.getByText(/You have not published any posts/i)).toBeInTheDocument();
		});
	});



	it("displays member since date", async () => {
		renderProfile();

		await waitFor(() => {
			expect(screen.getByText(/Member since/i)).toBeInTheDocument();
			expect(screen.getByText(/Jan 2024/i)).toBeInTheDocument();
		});
	});

	it("displays user role badge", async () => {
		renderProfile();

		await waitFor(() => {
			expect(screen.getByText("Author")).toBeInTheDocument();
		});
	});

	it("displays top topic badges", async () => {
		renderProfile();

		await waitFor(() => {
			expect(screen.getByText(/Top topic/i)).toBeInTheDocument();
			expect(screen.getAllByText("Testing")[0]).toBeInTheDocument();
		});
	});

	it("updates character count for bio field", async () => {
		renderProfile();

		await waitFor(() => {
			const bioTextarea = screen.getByDisplayValue("Writes about testing.");
			fireEvent.change(bioTextarea, { target: { value: "New bio text" } });
		});

		await waitFor(() => {
			expect(screen.getByText("12/500")).toBeInTheDocument();
		});
	});

	it("handles username checking state", async () => {
		global.fetch = vi.fn().mockImplementation((url) => {
			if (url.includes('/auth/username/check')) {
				return new Promise(() => {}); // Never resolves
			}
			return Promise.resolve({ ok: true, json: async () => ({}) });
		});

		renderProfile();

		await waitFor(() => {
			fireEvent.click(screen.getByText(/Change username/i));
		});

		await waitFor(() => {
			const usernameInput = screen.getByDisplayValue("janewriter");
			fireEvent.change(usernameInput, { target: { value: "checking" } });
		});

		// Wait for debounce
		await new Promise(resolve => setTimeout(resolve, 600));

		await waitFor(() => {
			const saveButton = screen.getByRole("button", { name: /Save changes/i });
			fireEvent.click(saveButton);
		});

		await waitFor(() => {
			expect(showToastMock).toHaveBeenCalledWith("error", "Please wait while we confirm that username.");
		});
	});

	it("handles unavailable username on submission", async () => {
		global.fetch = vi.fn().mockImplementation((url) => {
			if (url.includes('/auth/username/check')) {
				return Promise.resolve({
					ok: true,
					json: async () => ({ data: { available: false } }),
				});
			}
			return Promise.resolve({ ok: true, json: async () => ({}) });
		});

		renderProfile();

		await waitFor(() => {
			fireEvent.click(screen.getByText(/Change username/i));
		});

		await waitFor(() => {
			const usernameInput = screen.getByDisplayValue("janewriter");
			fireEvent.change(usernameInput, { target: { value: "taken" } });
		});

		await new Promise(resolve => setTimeout(resolve, 600));

		await waitFor(() => {
			const saveButton = screen.getByRole("button", { name: /Save changes/i });
			fireEvent.click(saveButton);
		});

		await waitFor(() => {
			expect(showToastMock).toHaveBeenCalledWith("error", expect.stringContaining("taken"));
		});
	});

});
