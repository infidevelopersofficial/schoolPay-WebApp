"use client";

import { useState, useTransition } from "react";
import { NotificationCategory } from "@prisma/client";
import { Switch } from "@/components/ui/switch";
import { updatePreferenceAction } from "./actions";
import { toast } from "sonner";

interface PreferenceItem {
  category: NotificationCategory;
  inApp: boolean;
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  push: boolean;
}

interface PreferencesFormProps {
  initialPreferences: PreferenceItem[];
}

const CATEGORY_DETAILS: Record<
  NotificationCategory,
  { title: string; description: string }
> = {
  ATTENDANCE: {
    title: "Attendance Alerts",
    description: "Receive instant updates when your child is marked absent or late.",
  },
  RESULT: {
    title: "Academic Results",
    description: "Get notified as soon as exam marksheets and report cards are published.",
  },
  FEE: {
    title: "Fee Due Reminders",
    description: "Friendly alerts regarding upcoming or overdue school fee payments.",
  },
  PAYMENT: {
    title: "Payment Confirmations",
    description: "Receipt summaries sent immediately after successful fee transactions.",
  },
  ANNOUNCEMENT: {
    title: "Announcements & Notices",
    description: "Daily circulars, holiday notices, and school co-ordinator updates.",
  },
  EXAM: {
    title: "Exam Schedules",
    description: "Timetables, room arrangements, and seat number notifications.",
  },
  ADMISSION: {
    title: "Admissions & Onboarding",
    description: "Onboarding circulars and registration verification alerts.",
  },
  HOMEWORK: {
    title: "Homework & Assignments",
    description: "Daily tasks and assignment reminders published by class teachers.",
  },
  SYSTEM: {
    title: "Account Security & Alerts",
    description: "Critical security notices, login logs, and password reset requests.",
  },
};

export function PreferencesForm({ initialPreferences }: PreferencesFormProps) {
  const [preferences, setPreferences] = useState<PreferenceItem[]>(initialPreferences);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (
    category: NotificationCategory,
    channel: "email" | "sms" | "whatsapp" | "inApp" | "push",
    currentValue: boolean
  ) => {
    const newValue = !currentValue;

    // Optimistic UI update
    setPreferences((prev) =>
      prev.map((p) => (p.category === category ? { ...p, [channel]: newValue } : p))
    );

    // Trigger Server Action in a standard transition
    startTransition(async () => {
      try {
        const result = await updatePreferenceAction(category, channel, newValue);
        if (result.success) {
          toast.success(
            `Updated preference for ${CATEGORY_DETAILS[category]?.title}: ${channel.toUpperCase()} set to ${
              newValue ? "enabled" : "disabled"
            }.`
          );
        } else {
          throw new Error("Failed update");
        }
      } catch (err) {
        // Rollback state on error
        setPreferences((prev) =>
          prev.map((p) => (p.category === category ? { ...p, [channel]: currentValue } : p))
        );
        toast.error(`Failed to update notification settings. Please try again.`);
      }
    });
  };

  return (
    <div className="divide-y divide-border">
      {/* Table Header for medium screens */}
      <div className="hidden md:flex flex-row justify-between items-center px-6 py-3 bg-muted/5 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
        <div className="w-1/2">Alert Category</div>
        <div className="flex w-1/2 justify-between">
          <div className="w-1/5 text-center">In-App</div>
          <div className="w-1/5 text-center">Email</div>
          <div className="w-1/5 text-center">Push</div>
          <div className="w-1/5 text-center">SMS</div>
          <div className="w-1/5 text-center">WhatsApp</div>
        </div>
      </div>

      {preferences.map((pref) => {
        const info = CATEGORY_DETAILS[pref.category] || {
          title: pref.category,
          description: "Alerts matching this category.",
        };

        return (
          <div
            key={pref.category}
            className="flex flex-col md:grid md:grid-cols-12 gap-4 p-6 hover:bg-muted/5 transition-colors items-center"
          >
            {/* Left Col: Info details */}
            <div className="w-full md:col-span-6 space-y-1">
              <h4 className="text-sm font-semibold text-foreground leading-none">
                {info.title}
              </h4>
              <p className="text-xs text-muted-foreground leading-normal">
                {info.description}
              </p>
            </div>

            {/* Right Cols: Channel switches */}
            <div className="w-full md:col-span-6 grid grid-cols-5 gap-2 md:gap-4 mt-4 md:mt-0 text-center">
              {/* In-App */}
              <div className="flex flex-col md:items-center gap-1.5">
                <span className="text-[10px] md:hidden text-muted-foreground uppercase font-semibold">
                  In-App
                </span>
                <Switch
                  checked={pref.inApp}
                  onCheckedChange={() => handleToggle(pref.category, "inApp", pref.inApp)}
                  disabled={isPending}
                  aria-label={`Toggle In-App alerts for ${info.title}`}
                />
              </div>

              {/* Email */}
              <div className="flex flex-col md:items-center gap-1.5">
                <span className="text-[10px] md:hidden text-muted-foreground uppercase font-semibold">
                  Email
                </span>
                <Switch
                  checked={pref.email}
                  onCheckedChange={() => handleToggle(pref.category, "email", pref.email)}
                  disabled={isPending}
                  aria-label={`Toggle Email alerts for ${info.title}`}
                />
              </div>

              {/* Push */}
              <div className="flex flex-col md:items-center gap-1.5">
                <span className="text-[10px] md:hidden text-muted-foreground uppercase font-semibold">
                  Push
                </span>
                <Switch
                  checked={pref.push}
                  onCheckedChange={() => handleToggle(pref.category, "push", pref.push)}
                  disabled={isPending}
                  aria-label={`Toggle Push alerts for ${info.title}`}
                />
              </div>

              {/* SMS */}
              <div className="flex flex-col md:items-center gap-1.5">
                <span className="text-[10px] md:hidden text-muted-foreground uppercase font-semibold">
                  SMS
                </span>
                <Switch
                  checked={pref.sms}
                  onCheckedChange={() => handleToggle(pref.category, "sms", pref.sms)}
                  disabled={isPending}
                  aria-label={`Toggle SMS alerts for ${info.title}`}
                />
              </div>

              {/* WhatsApp */}
              <div className="flex flex-col md:items-center gap-1.5">
                <span className="text-[10px] md:hidden text-muted-foreground uppercase font-semibold">
                  WhatsApp
                </span>
                <Switch
                  checked={pref.whatsapp}
                  onCheckedChange={() => handleToggle(pref.category, "whatsapp", pref.whatsapp)}
                  disabled={isPending}
                  aria-label={`Toggle WhatsApp alerts for ${info.title}`}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
