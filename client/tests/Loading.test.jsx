import { render, screen } from "@testing-library/react";
import Loading from "@/components/Loading";

vi.mock("@/assets/images/loading.svg", () => ({ default: "loading.svg" }));

describe("Loading", () => {
  it("displays the loading animation", () => {
    render(<Loading />);

    const image = screen.getByRole("img");
    expect(image).toHaveAttribute("src", "loading.svg");
    expect(image).toHaveAttribute("width", "100");
  });
});
