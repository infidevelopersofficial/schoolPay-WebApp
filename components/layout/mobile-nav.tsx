"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Menu, School } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { NavList } from "./sidebar"

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Open navigation menu"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="border-b border-border px-4 py-5">
            <SheetTitle asChild>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-primary to-accent">
                  <School className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-semibold text-foreground">SchoolPay</span>
              </div>
            </SheetTitle>
          </SheetHeader>
          <nav className="overflow-y-auto px-3 py-4 h-[calc(100%-4.5rem)]">
            <NavList pathname={pathname} onNavigate={() => setOpen(false)} />
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}
