"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function NotificationsSettingsPage() {
  const [loading, setLoading] = useState(false);

  const handleSendReminders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications/send-reminders", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
      } else {
        toast.error(data.error || "Failed to send reminders");
      }
    } catch (error) {
      toast.error("An error occurred while sending reminders");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">Manage automated alerts and reminders</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-5 h-5 text-muted-foreground" />
            Fee Reminders
          </CardTitle>
          <CardDescription>
            Manually trigger fee reminders for all fees due within the next 3 days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSendReminders} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bell className="w-4 h-4 mr-2" />}
            Send Reminders
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
