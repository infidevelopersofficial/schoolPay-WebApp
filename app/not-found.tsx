import Link from "next/link"
import { Button } from "@/components/ui/button"
import { School } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
      <div className="space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <School className="h-10 w-10 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-7xl font-extrabold text-primary">404</p>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Page not found</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <Button asChild>
          <Link href="/">Return to Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
