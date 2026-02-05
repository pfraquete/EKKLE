import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Base styles
        "flex field-sizing-content min-h-24 w-full rounded-xl border px-4 py-3 text-base transition-all duration-300 ease-out outline-none md:text-sm",
        // Dark Premium colors
        "bg-input border-border text-foreground",
        "placeholder:text-muted-foreground",
        // Selection
        "selection:bg-primary/30 selection:text-foreground",
        // Shadow
        "shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]",
        // Focus state - Gold glow
        "focus:border-primary focus:shadow-[inset_0_1px_2px_rgba(0,0,0,0.3),0_0_15px_rgba(212,175,55,0.08)]",
        "focus-visible:ring-0",
        // Disabled state
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
        // Invalid state
        "aria-invalid:border-destructive aria-invalid:shadow-[inset_0_1px_2px_rgba(0,0,0,0.3),0_0_15px_rgba(127,29,29,0.15)]",
        // Resize
        "resize-y",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
