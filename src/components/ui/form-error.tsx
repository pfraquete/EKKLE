import { AlertCircle } from 'lucide-react'

interface FormErrorProps {
  message?: string
}

export function FormError({ message }: FormErrorProps) {
  if (!message) return null

  return (
    <div className="flex items-center gap-2 text-xs text-destructive mt-1 px-1">
      <AlertCircle className="h-3 w-3" />
      <span>{message}</span>
    </div>
  )
}
