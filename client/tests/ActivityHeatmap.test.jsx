import { render, screen, within } from "@testing-library/react";
import ActivityHeatmap from "@/components/ActivityHeatmap";

describe("ActivityHeatmap", () => {
  const contributions = [
    { date: "2025-01-01", count: 2 },
    { date: "2025-01-02", count: 5 },
    { date: "2025-01-04", count: 0 },
  ];

  it("renders summary information and legend", () => {
    render(
      <ActivityHeatmap
        contributions={contributions}
        totalBlogs={7}
        range={{ start: "2025-01-01", end: "2025-01-07" }}
      />
    );

    expect(screen.getByText("Blog activity")).toBeInTheDocument();
    const totalPostsContainer = screen.getByText("Total posts:", {
      selector: "div",
    });
    expect(within(totalPostsContainer).getByText("7")).toBeInTheDocument();

    expect(screen.getByTitle("0")).toBeInTheDocument();
    expect(screen.getByTitle("1-2")).toBeInTheDocument();
    expect(screen.getByTitle("3-5")).toBeInTheDocument();
  });

  it("displays tiles for each contribution with descriptive titles", () => {
    render(
      <ActivityHeatmap
        contributions={contributions}
        totalBlogs={7}
        range={{ start: "2025-01-01", end: "2025-01-07" }}
      />
    );

    expect(screen.getByTitle(/ - 2 posts$/)).toBeInTheDocument();
    expect(screen.getByTitle(/ - 5 posts$/)).toBeInTheDocument();
    expect(screen.getByTitle(/ - 0 posts$/)).toBeInTheDocument();
  });

  it("handles empty and non-array contribution data gracefully", () => {
    const { container } = render(<ActivityHeatmap contributions={null} totalBlogs={0} />);

    expect(screen.getByText("Activity in the selected range")).toBeInTheDocument();
    expect(screen.getByText("Total posts:")).toBeInTheDocument();
    expect(container.querySelectorAll('[title="0"]').length).toBeGreaterThan(0); // legend still renders
    expect(screen.queryByTitle(/ - \d+ posts?/)).toBeNull();
  });

  it("normalizes input, collapses duplicate month labels, and tolerates range errors", () => {
    const throwingPrimitive = {
      valueOf() {
        throw new Error("boom");
      },
      toString() {
        throw new Error("boom");
      },
    };

    const { container } = render(
      <ActivityHeatmap
        contributions={[
          { date: "2025-01-01", count: 0 },
          { date: "2025-01-02", count: 1 },
          { date: "2025-01-03", count: 2 },
          { date: "2025-01-04", count: 3 },
          { date: "2025-01-05", count: 4 },
          { date: "2025-01-06", count: 5 },
          { date: "2025-01-07", count: -4 },
          { date: "2025-01-08", count: 7 },
          { date: "2025-01-09", count: 8 },
          { date: "2025-01-10", count: 9 },
          { date: "invalid-date", count: 10 },
          { date: "2025-02-01", count: 20 },
          { date: "2025-02-02", count: 15 },
        ]}
        totalBlogs={6}
        range={{ start: throwingPrimitive, end: "2025-02-14" }}
      />
    );

    expect(screen.getByTitle(/ - 1 post$/)).toBeInTheDocument();

    const negativeTile = screen.getByTitle(/-4 posts$/);
    expect(negativeTile).toHaveStyle({ backgroundColor: "#166534" });

    expect(screen.getAllByTitle("0").length).toBeGreaterThan(0);

    const monthLabels = Array.from(
      container.querySelectorAll("div.flex.h-4.w-3.shrink-0.items-center.justify-center")
    ).map((node) => node.textContent.trim());

    expect(monthLabels.filter((text) => text === "Jan").length).toBe(1);
    expect(monthLabels.includes("Feb")).toBe(true);

    expect(screen.getByText("Activity in the selected range")).toBeInTheDocument();
  });
});
