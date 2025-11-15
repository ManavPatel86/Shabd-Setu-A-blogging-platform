import { afterEach, describe, expect, it, vi } from "vitest";
import { getEnv } from "@/helpers/getEnv";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getEnv", () => {
  it("returns the environment value when it exists", () => {
    vi.stubEnv("VITE_SAMPLE_KEY", "sample-value");

    expect(getEnv("VITE_SAMPLE_KEY")).toBe("sample-value");
  });

  it("returns undefined when the environment variable is missing", () => {
    expect(getEnv("VITE_MISSING_KEY")).toBeUndefined();
  });
});
