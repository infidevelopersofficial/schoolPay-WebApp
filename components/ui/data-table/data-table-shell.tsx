import { ReactNode } from "react"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

interface Crumb {
  label: string
  href?: string
}

interface DataTableShellProps {
  title: string
  description?: string
  /** Optional breadcrumb trail shown above the title. The current page is
   *  appended automatically from `title` — do not repeat it here. */
  breadcrumbs?: Crumb[]
  actions?: ReactNode
  search?: ReactNode
  children: ReactNode
}

/**
 * Standardized layout wrapper for all dashboard data tables.
 * Handles title, optional breadcrumb navigation, toolbar, and content area.
 */
export function DataTableShell({
  title,
  description,
  breadcrumbs,
  actions,
  search,
  children,
}: DataTableShellProps) {
  const crumbs: Crumb[] = breadcrumbs ?? []

  return (
    <div className="space-y-5">
      {/* Breadcrumbs */}
      {crumbs.length > 0 && (
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1 text-sm text-muted-foreground">
            <li>
              <Link
                href="/"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
                aria-label="Dashboard"
              >
                <Home className="h-3.5 w-3.5" />
              </Link>
            </li>
            {crumbs.map((crumb, i) => (
              <li key={i} className="flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-foreground transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </li>
            ))}
            <li className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              <span className="text-foreground font-medium">{title}</span>
            </li>
          </ol>
        </nav>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {/* Toolbar */}
      {search && (
        <div className="flex items-center gap-3 flex-wrap">
          {search}
        </div>
      )}

      {/* Content */}
      {children}
    </div>
  )
}
