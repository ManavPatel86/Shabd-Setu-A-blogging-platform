import React from "react";
import { render } from "@testing-library/react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

vi.mock("@radix-ui/react-avatar", async () => {
  const ReactActual = await vi.importActual("react");
  const forwardRef = ReactActual.forwardRef || ReactActual.default.forwardRef;

  return {
    Root: forwardRef(({ children, ...props }, ref) => (
      <div ref={ref} {...props}>
        {children}
      </div>
    )),
    Image: forwardRef((props, ref) => <img ref={ref} {...props} />),
    Fallback: forwardRef(({ children, ...props }, ref) => (
      <span ref={ref} {...props}>
        {children}
      </span>
    )),
  };
});

describe("Avatar UI components", () => {
  it("merges provided classes on Avatar root", () => {
    const { getByTestId } = render(
      <Avatar data-testid="avatar-root" className="custom-root">
        content
      </Avatar>
    );

    const root = getByTestId("avatar-root");
    expect(root).toHaveClass("relative", "flex", "size-8", "custom-root");
    expect(root).toHaveAttribute("data-slot", "avatar");
    expect(root).toHaveTextContent("content");
  });

  it("merges provided classes on Avatar image", () => {
    const { getByTestId } = render(
      <AvatarImage data-testid="avatar-image" className="custom-image" alt="profile" />
    );

    const image = getByTestId("avatar-image");
    expect(image).toHaveClass("aspect-square", "size-full", "custom-image");
    expect(image).toHaveAttribute("alt", "profile");
    expect(image).toHaveAttribute("data-slot", "avatar-image");
  });

  it("merges provided classes on Avatar fallback", () => {
    const { getByTestId } = render(
      <AvatarFallback data-testid="avatar-fallback" className="custom-fallback">
        JD
      </AvatarFallback>
    );

    const fallback = getByTestId("avatar-fallback");
    expect(fallback).toHaveClass("bg-muted", "flex", "size-full", "items-center", "custom-fallback");
    expect(fallback).toHaveAttribute("data-slot", "avatar-fallback");
    expect(fallback).toHaveTextContent("JD");
  });
});
