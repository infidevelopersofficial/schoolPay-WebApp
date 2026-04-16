import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import type { LucideIcon } from "lucide-react"

interface TableEmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  /** When provided, renders an "Add" CTA button linking to this href. */
  addHref?: string
  addLabel?: string
}

export function TableEmptyState({
  icon: Icon,
  title,
  description,
  addHref,
  addLabel,
}: TableEmptyStateProps) {
  return (
    <Empty className="border border-dashed rounded-xl py-16">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon className="size-6 text-muted-foreground" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
      </EmptyHeader>
      <EmptyContent>
        <EmptyDescription>{description}</EmptyDescription>
        {addHref && (
          <Button asChild size="sm" className="mt-2">
            <Link href={addHref}>{addLabel ?? "Add"}</Link>
          </Button>
        )}
      </EmptyContent>
    </Empty>
  )
}
