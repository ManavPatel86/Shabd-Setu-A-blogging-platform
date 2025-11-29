import { describe, expect, it, beforeEach, afterAll, vi } from "vitest";
import { deleteData } from "@/helpers/handleDelete";

const originalConfirm = global.confirm;
const originalFetch = global.fetch;

let confirmMock;
let fetchMock;

beforeEach(() => {
  confirmMock = vi.fn();
  fetchMock = vi.fn();
  global.confirm = confirmMock;
  global.fetch = fetchMock;
});

afterAll(() => {
  global.confirm = originalConfirm;
  global.fetch = originalFetch;
});

describe("deleteData", () => {
  it("returns false when the user declines the confirmation dialog", async () => {
    confirmMock.mockReturnValue(false);

    const result = await deleteData("/api/resource");

    expect(result).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("performs the delete request when confirmed", async () => {
    confirmMock.mockReturnValue(true);
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: "ok" }),
    });

    const result = await deleteData("/api/resource");

    expect(fetchMock).toHaveBeenCalledWith("/api/resource", {
      method: "delete",
      credentials: "include",
    });
    expect(result).toBe(true);
  });

  it("logs and returns false when the server responds with an error", async () => {
    confirmMock.mockReturnValue(true);
    fetchMock.mockResolvedValue({
      ok: false,
      statusText: "Bad Request",
      json: () => Promise.resolve({}),
    });
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const result = await deleteData("/api/bad");

    expect(result).toBe(false);
    expect(logSpy).toHaveBeenCalled();

    logSpy.mockRestore();
  });

  it("handles network failures gracefully", async () => {
    confirmMock.mockReturnValue(true);
    fetchMock.mockRejectedValue(new Error("network down"));
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const result = await deleteData("/api/error");

    expect(result).toBe(false);
    expect(logSpy).toHaveBeenCalledWith(expect.any(Error));

    logSpy.mockRestore();
  });
});
