import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import NotificationBell from "@/components/Notifications/NotificationBell";
import { vi } from "vitest";

const { mockUseNotifications } = vi.hoisted(() => ({
	mockUseNotifications: vi.fn(),
}));

vi.mock(
	new URL("../../../src/context/NotificationsProvider.jsx", import.meta.url)
		.pathname,
	() => ({
	useNotifications: mockUseNotifications,
})
);

vi.mock(
	new URL(
		"../../../src/components/Notifications/NotificationDropdown.jsx",
		import.meta.url
	).pathname,
	() => ({
	__esModule: true,
	default: ({ onClose }) => (
		<div data-testid="notification-dropdown">
			<button onClick={onClose}>Close panel</button>
		</div>
	),
})
);

vi.mock("@/components/ui/dropdown-menu", () => {
	const MenuContext = React.createContext({ open: false, onOpenChange: () => {} });

	const DropdownMenu = ({ open, onOpenChange, children }) => (
		<MenuContext.Provider value={{ open, onOpenChange }}>
			<div data-testid="dropdown-menu" data-open={open}>
				{children}
			</div>
		</MenuContext.Provider>
	);

	const DropdownMenuTrigger = ({ children }) => {
		const ctx = React.useContext(MenuContext);
		return React.cloneElement(children, {
			onClick: (...args) => {
				children.props?.onClick?.(...args);
				ctx?.onOpenChange?.(!ctx.open);
			},
		});
	};

	const DropdownMenuContent = ({ children }) => {
		const ctx = React.useContext(MenuContext);
		if (!ctx?.open) return null;
		return (
			<div data-testid="dropdown-content">
				{children}
			</div>
		);
	};

	return {
		DropdownMenu,
		DropdownMenuTrigger,
		DropdownMenuContent,
	};
});

describe("NotificationBell", () => {
	beforeEach(() => {
		mockUseNotifications.mockReturnValue({ unreadCount: 0 });
	});

	it("renders the bell button without a badge when there are no unread notifications", () => {
		render(<NotificationBell />);

		expect(screen.getByLabelText(/notifications/i)).toBeInTheDocument();
		expect(screen.queryByText("99+")).toBeNull();
		expect(screen.queryByText("0")).toBeNull();
	});

	it("shows a capped badge for large unread counts", () => {
		mockUseNotifications.mockReturnValue({ unreadCount: 142 });

		render(<NotificationBell />);

		expect(screen.getByText("99+")).toBeInTheDocument();
	});

	it("opens the dropdown and propagates the onClose handler", async () => {
		mockUseNotifications.mockReturnValue({ unreadCount: 5 });

		render(<NotificationBell />);

		const trigger = screen.getByLabelText(/notifications/i);
		fireEvent.click(trigger);

		const dropdown = await screen.findByTestId("notification-dropdown");
		expect(dropdown).toBeInTheDocument();

		fireEvent.click(screen.getByText(/close panel/i));

		await waitFor(() =>
			expect(screen.queryByTestId("notification-dropdown")).toBeNull()
		);
	});
});
