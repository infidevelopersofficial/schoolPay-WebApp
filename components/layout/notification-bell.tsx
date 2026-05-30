"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotificationBell() {
  return (
    <Link href="/dashboard/notifications" passHref>
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9 hover:bg-accent rounded-lg"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
      </Button>
    </Link>
  );
}
