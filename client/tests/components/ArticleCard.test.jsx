import { fireEvent, render, screen } from "@testing-library/react";
import { describe, beforeEach, expect, it, vi } from "vitest";
import ArticleCard from "@/components/ArticleCard";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
	const actual = await importOriginal();
	return {
		...actual,
		useNavigate: () => navigateMock,
	};
});

const baseBlog = {
	id: "abc-123",
	thumbnail: "https://cdn.example.com/thumb.jpg",
	title: "Testing ArticleCard",
	description: "<p>Rendered description with <strong>HTML</strong> content</p>",
	author: "QA Writer",
	profile: "https://cdn.example.com/avatar.png",
	createdAt: "Mar 12",
	filter: "Engineering",
};

describe("ArticleCard", () => {
	beforeEach(() => {
		navigateMock.mockReset();
	});

	it("renders the primary blog metadata", () => {
		render(<ArticleCard blog={baseBlog} />);

		expect(screen.getAllByText(baseBlog.filter).length).toBeGreaterThan(0);
		expect(screen.getAllByText(baseBlog.title).length).toBeGreaterThan(0);
		expect(screen.getAllByText(baseBlog.author).length).toBeGreaterThan(0);
		expect(screen.getAllByText(baseBlog.createdAt).length).toBeGreaterThan(0);
	});

	it("navigates to the blog details page when any hero content is clicked", () => {
		render(<ArticleCard blog={baseBlog} />);

		fireEvent.click(screen.getAllByText(baseBlog.title)[0]);

		expect(navigateMock).toHaveBeenCalledWith(`/blog/${baseBlog.id}`);
	});

	it("shows the summary action affordance with icons", () => {
		const { container } = render(<ArticleCard blog={baseBlog} />);

		expect(screen.getByRole("button", { name: /summary/i })).toBeInTheDocument();
		expect(container.querySelectorAll("svg").length).toBeGreaterThanOrEqual(4);
	});
});
