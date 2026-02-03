import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-black-elevated",
        "relative overflow-hidden",
        // Shimmer effect
        "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_2s_infinite]",
        "after:bg-gradient-to-r after:from-transparent after:via-gray-border/20 after:to-transparent",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
