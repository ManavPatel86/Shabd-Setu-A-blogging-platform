import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { useFetch } from "@/hooks/useFetch";

describe("useFetch hook", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("fetches data successfully", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: "ok" }),
    });

    const { result } = renderHook(() =>
      useFetch("https://api.example.com/test", { method: "get" }, [])
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({ message: "ok" });
    expect(result.current.error).toBeUndefined();
  });

  it("captures errors when response not ok", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      statusText: "Bad Request",
      status: 400,
      json: async () => ({ message: "failed" }),
    });

    const { result } = renderHook(() =>
      useFetch("https://api.example.com/fail", { method: "get" }, [])
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("skips fetch when url is falsy", async () => {
    const { result } = renderHook(() => useFetch(null, {}, []));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
