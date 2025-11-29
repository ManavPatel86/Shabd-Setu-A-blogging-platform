import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, it, beforeEach, afterAll, expect, vi } from "vitest";
import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const originalMatchMedia = window.matchMedia;
const originalInnerWidth = window.innerWidth;

function TestComponent() {
  const isMobile = useIsMobile();
  return <span data-testid="mobile-flag">{isMobile ? "mobile" : "desktop"}</span>;
}

describe("useIsMobile", () => {
  let changeHandler;
  let removeListenerMock;

  const setViewport = (width) => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: width,
    });
  };

  beforeEach(() => {
    changeHandler = undefined;
    removeListenerMock = vi.fn();
    window.matchMedia = vi.fn(() => ({
      addEventListener: vi.fn((event, handler) => {
        if (event === "change") {
          changeHandler = handler;
        }
      }),
      removeEventListener: removeListenerMock,
    }));
  });

  afterAll(() => {
    window.matchMedia = originalMatchMedia;
    setViewport(originalInnerWidth);
  });

  it("reports true when the viewport is smaller than the breakpoint", async () => {
    setViewport(600);

    render(<TestComponent />);

    await waitFor(() =>
      expect(screen.getByTestId("mobile-flag").textContent).toBe("mobile")
    );
  });

  it("updates its state when the media query change event fires", async () => {
    setViewport(1200);

    render(<TestComponent />);

    await waitFor(() =>
      expect(screen.getByTestId("mobile-flag").textContent).toBe("desktop")
    );

    setViewport(700);
    await act(async () => {
      changeHandler?.();
    });

    await waitFor(() =>
      expect(screen.getByTestId("mobile-flag").textContent).toBe("mobile")
    );
  });

  it("cleans up the change listener on unmount", async () => {
    setViewport(1200);

    const { unmount } = render(<TestComponent />);

    await waitFor(() =>
      expect(screen.getByTestId("mobile-flag").textContent).toBe("desktop")
    );

    unmount();

    expect(removeListenerMock).toHaveBeenCalledWith("change", changeHandler);
  });

  it("returns false when window.innerWidth is at the breakpoint", async () => {
    setViewport(1024);

    render(<TestComponent />);

    await waitFor(() =>
      expect(screen.getByTestId("mobile-flag").textContent).toBe("desktop")
    );
  });

});
