'use client'

import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-media-query"

export interface ResponsiveTableColumn<T> {
  key: string
  header: string
  /** Optional className for the th/td */
  className?: string
  /** Render function for the cell content */
  render: (item: T) => React.ReactNode
}

interface ResponsiveTableProps<T> {
  data: T[]
  /** Columns visible on desktop table view */
  columns: ResponsiveTableColumn<T>[]
  /** Card renderer for mobile view */
  mobileCard: (item: T, index: number) => React.ReactNode
  /** Unique key extractor */
  keyExtractor: (item: T) => string
  /** Optional empty state */
  emptyState?: React.ReactNode
  /** Optional loading state */
  loading?: boolean
  /** Optional loading skeleton count */
  skeletonCount?: number
  className?: string
}

/**
 * Responsive data display that renders a table on desktop (md+)
 * and stacked cards on mobile (<md).
 *
 * @example
 * <ResponsiveTable
 *   data={transactions}
 *   columns={[
 *     { key: 'date', header: 'Data', render: (t) => formatDate(t.date) },
 *     { key: 'amount', header: 'Valor', render: (t) => formatCurrency(t.amount) },
 *   ]}
 *   mobileCard={(t) => (
 *     <Card>
 *       <p>{t.description}</p>
 *       <p>{formatCurrency(t.amount)}</p>
 *     </Card>
 *   )}
 *   keyExtractor={(t) => t.id}
 * />
 */
export function ResponsiveTable<T>({
  data,
  columns,
  mobileCard,
  keyExtractor,
  emptyState,
  loading,
  skeletonCount = 3,
  className,
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile()

  if (loading) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className={cn("py-8 text-center text-muted-foreground", className)}>
        {emptyState ?? "Nenhum item encontrado."}
      </div>
    )
  }

  // Mobile: card list
  if (isMobile) {
    return (
      <div className={cn("space-y-3", className)}>
        {data.map((item, index) => (
          <div key={keyExtractor(item)}>
            {mobileCard(item, index)}
          </div>
        ))}
      </div>
    )
  }

  // Desktop: table
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-left font-medium text-muted-foreground",
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              className="border-b border-border/50 hover:bg-muted/30 transition-colors"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn("px-4 py-3", col.className)}
                >
                  {col.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
