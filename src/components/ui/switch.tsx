'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { checked?: boolean; onCheckedChange?: (checked: boolean) => void }
>(({ className, checked, onCheckedChange, ...props }, ref) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        data-state={checked ? "checked" : "unchecked"}
        ref={ref}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
            // Base styles
            "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-300",
            // Focus state
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black-absolute",
            // Disabled state
            "disabled:cursor-not-allowed disabled:opacity-50",
            // Unchecked state - Dark
            "data-[state=unchecked]:bg-gray-border",
            // Checked state - Gold
            "data-[state=checked]:bg-gold data-[state=checked]:shadow-gold-glow-subtle",
            className
        )}
        {...props}
    >
        <span
            data-state={checked ? "checked" : "unchecked"}
            className={cn(
                // Base styles
                "pointer-events-none block h-5 w-5 rounded-full shadow-premium-sm ring-0 transition-all duration-300",
                // Unchecked state
                "data-[state=unchecked]:translate-x-0 data-[state=unchecked]:bg-gray-text-secondary",
                // Checked state
                "data-[state=checked]:translate-x-5 data-[state=checked]:bg-black-absolute"
            )}
        />
    </button>
))
Switch.displayName = "Switch"

export { Switch }
