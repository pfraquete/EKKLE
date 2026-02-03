import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none transition-all duration-200 overflow-hidden",
  {
    variants: {
      variant: {
        // Badge Dourado Premium
        default:
          "border-gold/30 bg-gold/10 text-gold-light [a&]:hover:bg-gold/20",
        
        // Badge Secundário (Neutro)
        secondary:
          "border-gray-border bg-black-elevated text-gray-text-secondary [a&]:hover:bg-black-surface",
        
        // Badge Destrutivo
        destructive:
          "border-red-500/30 bg-red-500/10 text-red-400 [a&]:hover:bg-red-500/20",
        
        // Badge Outline
        outline:
          "border-gray-border bg-transparent text-white-soft [a&]:hover:bg-black-elevated [a&]:hover:border-gray-text-muted",
        
        // Badge Sucesso
        success:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 [a&]:hover:bg-emerald-500/20",
        
        // Badge Warning
        warning:
          "border-amber-500/30 bg-amber-500/10 text-amber-400 [a&]:hover:bg-amber-500/20",
        
        // Badge Info
        info:
          "border-blue-500/30 bg-blue-500/10 text-blue-400 [a&]:hover:bg-blue-500/20",
        
        // Badge Premium (com glow)
        premium:
          "border-gold/40 bg-gold/15 text-gold shadow-gold-glow-subtle [a&]:hover:shadow-gold-glow",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
