import { cn } from "@/lib/utils"

interface ResponsiveGridProps {
  children: React.ReactNode
  /** Column counts per breakpoint. Default: { sm: 1, md: 2, lg: 3 } */
  cols?: { sm?: number; md?: number; lg?: number; xl?: number }
  /** Gap size (Tailwind scale). Default: 4 */
  gap?: number
  className?: string
}

const colsMap: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  7: "grid-cols-7",
}

const smColsMap: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
  5: "sm:grid-cols-5",
  6: "sm:grid-cols-6",
}

const mdColsMap: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6",
}

const lgColsMap: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
}

const xlColsMap: Record<number, string> = {
  1: "xl:grid-cols-1",
  2: "xl:grid-cols-2",
  3: "xl:grid-cols-3",
  4: "xl:grid-cols-4",
  5: "xl:grid-cols-5",
  6: "xl:grid-cols-6",
}

const gapMap: Record<number, string> = {
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  5: "gap-5",
  6: "gap-6",
  8: "gap-8",
}

/**
 * Responsive grid container that defaults to 1 column on mobile
 * and scales up at breakpoints.
 *
 * @example
 * <ResponsiveGrid cols={{ sm: 1, md: 2, lg: 3 }} gap={4}>
 *   {items.map(item => <Card key={item.id} />)}
 * </ResponsiveGrid>
 */
export function ResponsiveGrid({
  children,
  cols = { sm: 1, md: 2, lg: 3 },
  gap = 4,
  className,
}: ResponsiveGridProps) {
  const baseCol = cols.sm ?? 1

  return (
    <div
      className={cn(
        "grid",
        colsMap[baseCol],
        cols.sm && cols.sm > 1 ? smColsMap[cols.sm] : undefined,
        cols.md ? mdColsMap[cols.md] : undefined,
        cols.lg ? lgColsMap[cols.lg] : undefined,
        cols.xl ? xlColsMap[cols.xl] : undefined,
        gapMap[gap] ?? "gap-4",
        className
      )}
    >
      {children}
    </div>
  )
}
