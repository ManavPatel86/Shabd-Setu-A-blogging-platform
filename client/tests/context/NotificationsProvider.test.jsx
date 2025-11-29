import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import NotificationsProvider, { useNotifications } from "@/context/NotificationsProvider";

const { fetchNotificationsMock, getEnvMock, ioMock } = vi.hoisted(() => ({
  fetchNotificationsMock: vi.fn(),
  getEnvMock: vi.fn(),
  ioMock: vi.fn(),
}));

vi.mock("@/services/notifications", () => ({
  fetchNotifications: (...args) => fetchNotificationsMock(...args),
}));

vi.mock("@/helpers/getEnv", () => ({
  getEnv: (...args) => getEnvMock(...args),
}));

vi.mock("socket.io-client", () => ({
  io: (...args) => ioMock(...args),
}));

function Consumer() {
  const value = useNotifications();
  return (
    <div>
      <span data-testid="unread-count">{value?.unreadCount ?? 0}</span>
      <button type="button" onClick={() => value?.setItems([])} data-testid="clear">
        Clear
      </button>
    </div>
  );
}

describe("NotificationsProvider", () => {
  let socketHandlers;
  let socketInstance;

  beforeEach(() => {
    fetchNotificationsMock.mockReset();
    getEnvMock.mockReset();
    ioMock.mockReset();
    socketHandlers = {};
    socketInstance = {
      on: vi.fn((event, handler) => {
        socketHandlers[event] = handler;
      }),
      off: vi.fn(),
      emit: vi.fn(),
      disconnect: vi.fn(),
    };
    ioMock.mockImplementation(() => socketInstance);
    getEnvMock.mockReturnValue("https://api.example.com");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const renderWithUser = (user) =>
    render(
      <NotificationsProvider currentUser={user}>
        <Consumer />
      </NotificationsProvider>
    );

  it("loads notifications, emits identify, and handles live updates", async () => {
    fetchNotificationsMock.mockResolvedValue([
      { id: "n1", isRead: false },
      { id: "n2", isRead: true },
    ]);

    renderWithUser({ _id: "user-1" });

    await waitFor(() =>
      expect(screen.getByTestId("unread-count").textContent).toBe("1")
    );

    expect(fetchNotificationsMock).toHaveBeenCalled();
    expect(ioMock).toHaveBeenCalledWith(
      "https://api.example.com",
      expect.objectContaining({ withCredentials: true })
    );
    expect(socketInstance.emit).toHaveBeenCalledWith("auth:identify", "user-1");

    await act(async () => {
      socketHandlers["notification:new"]?.({ id: "n3", isRead: false });
    });

    await waitFor(() =>
      expect(screen.getByTestId("unread-count").textContent).toBe("2")
    );
  });

  it("skips network activity when no user is provided", () => {
    fetchNotificationsMock.mockResolvedValue([{ id: "n1", isRead: false }]);

    renderWithUser(null);

    expect(fetchNotificationsMock).not.toHaveBeenCalled();
    expect(ioMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("unread-count").textContent).toBe("0");
  });

  it("handles fetch errors gracefully", async () => {
    fetchNotificationsMock.mockRejectedValue(new Error("Network"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    renderWithUser({ _id: "user-2" });

    await waitFor(() =>
      expect(screen.getByTestId("unread-count").textContent).toBe("0")
    );

    consoleSpy.mockRestore();
  });

  it("avoids state updates when unmounted before the initial fetch resolves", async () => {
    let resolveFetch;
    fetchNotificationsMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    const { unmount } = renderWithUser({ _id: "user-long" });
    await waitFor(() => expect(fetchNotificationsMock).toHaveBeenCalled());
    unmount();

    await act(async () => {
      resolveFetch?.([{ id: "n1", isRead: true }]);
    });
  });

  it("normalizes dev server URLs before connecting", async () => {
    getEnvMock.mockReturnValue("http://localhost:3000/api");
    fetchNotificationsMock.mockResolvedValue([]);

    const { unmount } = renderWithUser({ _id: "user-3" });

    await waitFor(() => expect(ioMock).toHaveBeenCalled());
    expect(ioMock).toHaveBeenCalledWith("http://localhost:5000", expect.any(Object));

    unmount();
    expect(socketInstance.off).toHaveBeenCalledWith("notification:new");
    expect(socketInstance.disconnect).toHaveBeenCalled();
  });

  it("falls back to window origin when the API base is invalid", async () => {
    const rawOrigin = window.location.origin;
    const fallbackOrigin = rawOrigin.includes(":3000")
      ? rawOrigin.replace(":3000", ":5000")
      : rawOrigin;
    getEnvMock.mockReturnValue("api");
    fetchNotificationsMock.mockResolvedValue([]);

    renderWithUser({ _id: "user-4" });

    await waitFor(() => expect(ioMock).toHaveBeenCalled());
    expect(ioMock).toHaveBeenCalledWith(fallbackOrigin, expect.any(Object));
  });

  it("preserves derived socket urls that do not match the dev port pattern", async () => {
    getEnvMock.mockReturnValue("invalid-url-value");
    fetchNotificationsMock.mockResolvedValue([]);

    renderWithUser({ _id: "user-4b" });

    await waitFor(() => expect(ioMock).toHaveBeenCalled());
    expect(ioMock).toHaveBeenCalledWith("invalid-url-value", expect.any(Object));
  });

  it("logs and disconnects when socket error handlers fire", async () => {
    vi.stubEnv("DEV", "true");
    fetchNotificationsMock.mockResolvedValue([]);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    renderWithUser({ _id: "user-5" });

    await waitFor(() =>
      expect(typeof socketHandlers["connect_error"]).toBe("function")
    );

    await act(async () => {
      socketHandlers["connect_error"](new Error("boom"));
    });

    expect(warnSpy).toHaveBeenCalledWith(
      "Notifications socket disconnected:",
      expect.stringContaining("boom")
    );
    expect(socketInstance.disconnect).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("suppresses socket warnings when not running in dev mode", async () => {
    vi.stubEnv("DEV", "");
    fetchNotificationsMock.mockResolvedValue([]);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    renderWithUser({ _id: "user-6" });

    await waitFor(() =>
      expect(typeof socketHandlers["error"]).toBe("function")
    );

    await act(async () => {
      socketHandlers["error"](new Error("hidden"));
    });

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("handles socket factory failures without crashing", async () => {
    vi.stubEnv("DEV", "true");
    fetchNotificationsMock.mockResolvedValue([]);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    ioMock.mockImplementation(() => {
      throw new Error("init failed");
    });

    renderWithUser({ _id: "user-6" });

    await waitFor(() => expect(warnSpy).toHaveBeenCalled());
    warnSpy.mockRestore();
  });
});
