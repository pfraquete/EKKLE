'use client'

import { useState, FormEvent, KeyboardEvent } from 'react'
import { Send, Loader2 } from 'lucide-react'

interface ChatInputProps {
    onSend: (content: string) => Promise<void>
    disabled?: boolean
    placeholder?: string
}

export function ChatInput({ onSend, disabled, placeholder = 'Escreva uma mensagem...' }: ChatInputProps) {
    const [message, setMessage] = useState('')
    const [sending, setSending] = useState(false)

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()

        const trimmed = message.trim()
        if (!trimmed || sending || disabled) return

        setSending(true)
        await onSend(trimmed)
        setMessage('')
        setSending(false)
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e as unknown as FormEvent)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="p-4 border-t border-border/50 bg-background">
            <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={disabled || sending}
                        rows={1}
                        maxLength={2000}
                        className="w-full bg-muted border-0 rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none min-h-[48px] max-h-32 disabled:opacity-50"
                        style={{
                            height: 'auto',
                            minHeight: '48px',
                        }}
                        onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement
                            target.style.height = 'auto'
                            target.style.height = Math.min(target.scrollHeight, 128) + 'px'
                        }}
                    />
                </div>
                <button
                    type="submit"
                    disabled={!message.trim() || sending || disabled}
                    className="p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                >
                    {sending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Send className="w-5 h-5" />
                    )}
                </button>
            </div>
            <p className="text-[10px] text-muted-foreground/50 mt-1 text-right">
                Enter para enviar • Shift+Enter para nova linha
            </p>
        </form>
    )
}
