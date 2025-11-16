import React, { useState, Suspense } from 'react';
import { useNotifications } from '../../context/NotificationsProvider.jsx';
import { BellIcon } from 'lucide-react';
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NotificationDropdown = React.lazy(() => import('./NotificationDropdown'));

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { unreadCount } = useNotifications();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-11 w-11 rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:text-[#6C5CE7] hover:shadow-md"
          aria-label="Notifications"
        >
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 text-[11px] leading-none bg-red-500 text-white rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] p-0">
        <Suspense fallback={null}>
          <NotificationDropdown onClose={() => setOpen(false)} />
        </Suspense>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}