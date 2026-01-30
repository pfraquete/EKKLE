'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface CollapsibleContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
  disabled?: boolean
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | undefined>(undefined)

function useCollapsible() {
  const context = React.useContext(CollapsibleContext)
  if (!context) {
    throw new Error('useCollapsible must be used within a Collapsible')
  }
  return context
}

interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
}

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  (
    {
      open: controlledOpen,
      defaultOpen = false,
      onOpenChange,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : uncontrolledOpen

    const handleOpenChange = React.useCallback(
      (newOpen: boolean) => {
        if (disabled) return
        if (!isControlled) {
          setUncontrolledOpen(newOpen)
        }
        onOpenChange?.(newOpen)
      },
      [disabled, isControlled, onOpenChange]
    )

    return (
      <CollapsibleContext.Provider
        value={{ open, onOpenChange: handleOpenChange, disabled }}
      >
        <div
          ref={ref}
          data-state={open ? 'open' : 'closed'}
          data-disabled={disabled ? '' : undefined}
          className={className}
          {...props}
        >
          {children}
        </div>
      </CollapsibleContext.Provider>
    )
  }
)
Collapsible.displayName = 'Collapsible'

interface CollapsibleTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const CollapsibleTrigger = React.forwardRef<
  HTMLButtonElement,
  CollapsibleTriggerProps
>(({ className, children, asChild, onClick, disabled: triggerDisabled, ...props }, ref) => {
  const { open, onOpenChange, disabled } = useCollapsible()
  const isDisabled = disabled || triggerDisabled

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isDisabled) {
      onOpenChange(!open)
    }
    onClick?.(e)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: handleClick,
      'data-state': open ? 'open' : 'closed',
      'data-disabled': isDisabled ? '' : undefined,
      'aria-expanded': open,
    })
  }

  return (
    <button
      ref={ref}
      type="button"
      aria-expanded={open}
      data-state={open ? 'open' : 'closed'}
      data-disabled={isDisabled ? '' : undefined}
      disabled={isDisabled}
      onClick={handleClick}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
})
CollapsibleTrigger.displayName = 'CollapsibleTrigger'

interface CollapsibleContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  forceMount?: boolean
}

const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  CollapsibleContentProps
>(({ className, children, forceMount, ...props }, ref) => {
  const { open } = useCollapsible()

  if (!open && !forceMount) {
    return null
  }

  return (
    <div
      ref={ref}
      data-state={open ? 'open' : 'closed'}
      className={cn(
        'overflow-hidden',
        open ? 'animate-in fade-in-0' : 'animate-out fade-out-0',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
CollapsibleContent.displayName = 'CollapsibleContent'

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
