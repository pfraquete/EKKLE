'use client'

import { ReactNode } from 'react'
import { Button } from './button'
import { Loader2, AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void | Promise<void>
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: 'default' | 'destructive'
    isLoading?: boolean
}

export function ConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'default',
    isLoading = false
}: ConfirmDialogProps) {
    if (!open) return null

    const handleConfirm = async () => {
        await onConfirm()
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/80 z-50 animate-in fade-in-0"
                onClick={() => !isLoading && onOpenChange(false)}
            />

            {/* Dialog */}
            <div className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%] duration-200">
                <div className="bg-background border border-border rounded-3xl shadow-2xl mx-4">
                    <div className="p-6 space-y-4">
                        {/* Icon */}
                        <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                        </div>

                        {/* Content */}
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-foreground">
                                {title}
                            </h2>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {description}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                                className="flex-1 h-11 rounded-xl font-semibold"
                            >
                                {cancelText}
                            </Button>
                            <Button
                                variant={variant}
                                onClick={handleConfirm}
                                disabled={isLoading}
                                className="flex-1 h-11 rounded-xl font-semibold"
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {confirmText}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
