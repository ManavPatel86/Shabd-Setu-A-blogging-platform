import { describe, expect, it } from "vitest";
import {
  RouteProfileView,
  RouteCategoryFeed,
  RouteBlogDetails,
  RouteSearch,
} from "@/helpers/RouteName";

describe("Route helpers", () => {
  describe("RouteProfileView", () => {
    it("returns dynamic path when user id is missing", () => {
      expect(RouteProfileView()).toBe("/profile/view/:userId");
    });

    it("injects the user id into the profile path", () => {
      expect(RouteProfileView("abc123")).toBe("/profile/view/abc123");
    });
  });

  describe("RouteCategoryFeed", () => {
    it("uses placeholder segment when slug absent", () => {
      expect(RouteCategoryFeed()).toBe("/category/:category");
    });

    it("uses the provided category slug", () => {
      expect(RouteCategoryFeed("technology")).toBe("/category/technology");
    });
  });

  describe("RouteBlogDetails", () => {
    it("returns route template when params missing", () => {
      expect(RouteBlogDetails()).toBe("/blog/:category/:blog");
    });

    it("returns encoded path when category and blog provided", () => {
      expect(RouteBlogDetails("tech", "react-hooks")).toBe(
        "/blog/tech/react-hooks"
      );
    });

    it.todo("should handle categories or slugs with spaces");
  });

  describe("RouteSearch", () => {
    it("falls back to /search when query empty after trim", () => {
      expect(RouteSearch("   ")).toBe("/search");
    });

    it("returns encoded query string when value provided", () => {
      expect(RouteSearch("hooks & tips")).toBe("/search?q=hooks%20%26%20tips");
    });
  });
});
