// Simple toast hook implementation
import { useState, useCallback } from 'react'

export interface Toast {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

let toastQueue: Array<Toast & { id: string }> = []
let toastListeners: Array<(toasts: Array<Toast & { id: string }>) => void> = []

function notify() {
  toastListeners.forEach((listener) => listener([...toastQueue]))
}

export function useToast() {
  const [toasts, setToasts] = useState<Array<Toast & { id: string }>>([])

  const subscribe = useCallback((listener: typeof toastListeners[0]) => {
    toastListeners.push(listener)
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener)
    }
  }, [])

  const toast = useCallback(({ title, description, variant = 'default' }: Toast) => {
    const id = Math.random().toString(36).slice(2, 9)
    const newToast = { id, title, description, variant }

    toastQueue.push(newToast)
    notify()

    // Auto-remove after 5 seconds
    setTimeout(() => {
      toastQueue = toastQueue.filter((t) => t.id !== id)
      notify()
    }, 5000)

    return id
  }, [])

  return { toast, toasts }
}
