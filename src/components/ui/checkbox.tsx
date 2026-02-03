"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        // Base styles
        "peer size-5 shrink-0 rounded-md border transition-all duration-200 outline-none",
        // Default state - Dark Premium
        "border-gray-border bg-black-deep",
        // Checked state - Gold
        "data-[state=checked]:bg-gold data-[state=checked]:border-gold data-[state=checked]:text-black-absolute",
        // Focus state
        "focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black-absolute",
        // Hover state
        "hover:border-gray-text-muted",
        "data-[state=checked]:hover:bg-gold-light",
        // Invalid state
        "aria-invalid:border-destructive",
        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className="size-3.5 stroke-[3]" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
