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
});
