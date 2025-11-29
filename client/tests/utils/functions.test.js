import { describe, expect, it } from "vitest";
import { formatDate, getDisplayName } from "@/utils/functions";

describe("utils/functions", () => {
  describe("formatDate", () => {
    it("converts ISO strings into friendly dates", () => {
      const input = "2024-01-15T00:00:00.000Z";
      const expected = new Date(input).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      expect(formatDate(input)).toBe(expected);
    });
  });

  describe("getDisplayName", () => {
    it("prefers a trimmed name when available", () => {
      expect(
        getDisplayName({ name: "   Melody   ", username: "mel", email: "mel@example.com" })
      ).toBe("Melody");
    });

    it("falls back to the username when no name is provided", () => {
      expect(getDisplayName({ username: "writer42" })).toBe("@writer42");
    });

    it("uses the email local part when name and username are missing", () => {
      expect(getDisplayName({ email: "guest@example.com" })).toBe("guest");
    });

    it("returns a default label when there is no identifying info", () => {
      expect(getDisplayName(null)).toBe("Unknown user");
      expect(getDisplayName({})).toBe("Unknown user");
    });
  });
});
