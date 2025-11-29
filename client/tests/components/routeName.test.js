// Tests for Route helpers moved to client/tests/helpers/routeName.test.js
import {
	RouteCategoryFeed,
	RouteCategoryDetails,
	RouteAddCategory,
	RouteEditCategory,
	RouteBlogEdit,
	RouteBlogDetails,
	RouteProfileView,
	RouteSearch,
} from "@/helpers/RouteName";

describe("RouteName helpers", () => {
	it("resolves profile routes with and without userId", () => {
		expect(RouteProfileView("abc123")).toBe("/profile/view/abc123");
		expect(RouteProfileView()).toBe("/profile/view/:userId");
	});

	it("returns category feed paths with graceful fallbacks", () => {
		expect(RouteCategoryFeed("tech")).toBe("/category/tech");
		expect(RouteCategoryFeed()).toBe("/category/:category");
	});

	it("exposes admin category routes", () => {
		expect(RouteCategoryDetails).toBe("/categories");
		expect(RouteAddCategory).toBe("/category/add");
		expect(RouteEditCategory("42")).toBe("/category/edit/42");
		expect(RouteEditCategory()).toBe("/category/edit/:category_id");
	});

	it("produces blog edit and detail routes", () => {
		expect(RouteBlogEdit("blog-9")).toBe("/blog/edit/blog-9");
		expect(RouteBlogEdit()).toBe("/blog/edit/:blogid");

		expect(RouteBlogDetails("Growth Marketing", "Launch Plan")).toBe(
			"/blog/Growth%20Marketing/Launch%20Plan"
		);
		expect(RouteBlogDetails()).toBe("/blog/:category/:blog");
	});

	it("handles search queries, trimming and encoding input", () => {
		expect(RouteSearch()).toBe("/search");
		expect(RouteSearch("   ")).toBe("/search");
		expect(RouteSearch("react testing")).toBe("/search?q=react%20testing");
	});
});
