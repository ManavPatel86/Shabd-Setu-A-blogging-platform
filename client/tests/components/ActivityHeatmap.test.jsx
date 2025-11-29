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
    expect(container.querySelectorAll('[title="0"]').length).toBeGreaterThan(0);
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

  it("uses fallback bucket when count does not match any defined bucket", () => {
    render(
      <ActivityHeatmap
        contributions={[
          { date: "2025-01-01", count: 1 },
          { date: "2025-01-02", count: 100 },
        ]}
        totalBlogs={2}
        range={{ start: "2025-01-01", end: "2025-01-02" }}
      />
    );

    const highCountTile = screen.getByTitle(/ - 100 posts$/);
    expect(highCountTile).toHaveStyle({ backgroundColor: "#166534" });
  });

  it("handles weeks with all padding days", () => {
    render(
      <ActivityHeatmap
        contributions={[
          { date: "2025-01-06", count: 5 },
        ]}
        totalBlogs={1}
        range={{ start: "2025-01-06", end: "2025-01-06" }}
      />
    );

    expect(screen.getByTitle(/ - 5 posts$/)).toBeInTheDocument();
    expect(screen.getByText("Jan")).toBeInTheDocument();
  });

  it("omits month label when a week only contains padding cells", () => {
    const testWeeks = [
      Array.from({ length: 7 }, () => ({ isPadding: true })),
      [
        {
          isPadding: false,
          date: new Date("2025-01-06"),
          dateString: "2025-01-06",
          count: 3,
          bucket: { color: "#dcfce7" },
        },
        ...Array.from({ length: 6 }, () => ({ isPadding: true })),
      ],
    ];

    const { container } = render(
      <ActivityHeatmap
        contributions={[]}
        totalBlogs={1}
        __testWeeks={testWeeks}
      />
    );

    const monthCells = Array.from(
      container.querySelectorAll("div.flex.h-4.w-3.shrink-0.items-center.justify-center")
    );

    expect(monthCells[0].textContent?.trim()).toBe("");
    expect(monthCells.some((cell) => cell.textContent?.trim() === "Jan")).toBe(true);
  });

  it("handles empty weeks array properly", () => {
    render(
      <ActivityHeatmap
        contributions={[]}
        totalBlogs={0}
      />
    );

    expect(screen.getByText("Activity in the selected range")).toBeInTheDocument();
    expect(screen.getByText("Total posts:")).toBeInTheDocument();
  });
});
