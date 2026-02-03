import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // Primary (Dourado) - CTA principal
        default: "bg-primary text-primary-foreground hover:bg-[#F2D675] active:bg-[#B8962E] shadow-md hover:shadow-lg",
        // Destructive - Ações de perigo
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20",
        // Outline - Borda sutil
        outline:
          "border border-border bg-transparent hover:bg-muted hover:text-foreground",
        // Secondary - Ações secundárias
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        // Ghost - Ações sutis
        ghost:
          "hover:bg-muted hover:text-foreground",
        // Link - Texto clicável dourado
        link: "text-primary underline-offset-4 hover:underline hover:text-[#F2D675]",
        // Premium - Dourado com gradiente
        premium: "bg-gradient-to-r from-[#D4AF37] via-[#F2D675] to-[#D4AF37] text-[#0B0B0B] font-bold hover:shadow-lg hover:shadow-[#D4AF37]/20 active:from-[#B8962E] active:to-[#B8962E]",
        // Gold Outline - Borda dourada
        "gold-outline": "border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground",
      },
      size: {
        default: "h-11 px-4 py-2 has-[>svg]:px-3",
        sm: "h-9 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-12 rounded-md px-6 has-[>svg]:px-4",
        xl: "h-14 rounded-lg px-8 text-base has-[>svg]:px-6",
        icon: "size-11",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
