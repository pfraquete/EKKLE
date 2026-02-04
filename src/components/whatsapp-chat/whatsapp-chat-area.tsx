'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, MoreVertical, Smile, Paperclip, Mic, Send, Check, CheckCheck, Loader2 } from 'lucide-react'
import { WhatsAppContact, WhatsAppMessage } from './whatsapp-chat-layout'
import { cn } from '@/lib/utils'

interface WhatsAppChatAreaProps {
    contact: WhatsAppContact
    messages: WhatsAppMessage[]
    isLoading: boolean
    onSendMessage: (content: string) => void
}

export function WhatsAppChatArea({
    contact,
    messages,
    isLoading,
    onSendMessage
}: WhatsAppChatAreaProps) {
    const [inputValue, setInputValue] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Focus input when contact changes
    useEffect(() => {
        inputRef.current?.focus()
    }, [contact])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (inputValue.trim()) {
            onSendMessage(inputValue)
            setInputValue('')
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
        }
    }

    // Group messages by date
    const groupedMessages = groupMessagesByDate(messages)

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#202c33] border-b border-[#2a3942]">
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-[#6b7c85] flex items-center justify-center overflow-hidden">
                            {contact.photo_url ? (
                                <img
                                    src={contact.photo_url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <svg className="w-6 h-6 text-[#cfd9df]" viewBox="0 0 212 212">
                                    <path fill="currentColor" d="M106.251,0.5C164.653,0.5,212,47.846,212,106.25S164.653,212,106.251,212C47.846,212,0.5,164.654,0.5,106.25S47.846,0.5,106.251,0.5z M173.561,171.615c-0.601-0.915-1.287-1.907-2.065-2.955c-0.777-1.049-1.645-2.155-2.608-3.299c-0.964-1.144-2.024-2.326-3.184-3.527c-1.741-1.802-3.895-3.18-6.451-4.135c-2.556-0.955-5.514-1.433-8.875-1.433H62.123c-3.361,0-6.319,0.478-8.875,1.433c-2.556,0.955-4.71,2.333-6.451,4.135c-1.16,1.201-2.22,2.383-3.184,3.527c-0.963,1.144-1.831,2.25-2.608,3.299c-0.778,1.048-1.464,2.04-2.065,2.955c-0.601,0.915-1.11,1.77-1.528,2.564c13.916,15.629,34.099,25.471,56.589,25.471c22.489,0,42.673-9.842,56.589-25.471C174.671,173.385,174.162,172.53,173.561,171.615z M106.251,64.948c-22.005,0-39.867,17.862-39.867,39.867s17.862,39.867,39.867,39.867c22.005,0,39.867-17.862,39.867-39.867S128.256,64.948,106.251,64.948z"/>
                                </svg>
                            )}
                        </div>
                        {contact.is_online && (
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#00a884] rounded-full border-2 border-[#202c33]" />
                        )}
                    </div>

                    {/* Contact Info */}
                    <div>
                        <p className="font-medium text-[#e9edef] text-[15px]">{contact.name}</p>
                        <p className="text-xs text-[#8696a0]">
                            {contact.is_online ? 'online' : contact.phone}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                    <button className="p-2 rounded-full hover:bg-[#374045] transition-colors">
                        <Search className="w-5 h-5 text-[#aebac1]" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-[#374045] transition-colors">
                        <MoreVertical className="w-5 h-5 text-[#aebac1]" />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div 
                className="flex-1 overflow-y-auto px-16 py-4"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23182229' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundColor: '#0b141a'
                }}
            >
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 text-[#00a884] animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-2">
                        {Object.entries(groupedMessages).map(([date, msgs]) => (
                            <div key={date}>
                                {/* Date Divider */}
                                <div className="flex justify-center my-4">
                                    <span className="bg-[#182229] text-[#8696a0] text-xs px-3 py-1 rounded-lg shadow">
                                        {date}
                                    </span>
                                </div>

                                {/* Messages */}
                                {msgs.map((message) => (
                                    <MessageBubble key={message.id} message={message} />
                                ))}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="px-4 py-3 bg-[#202c33] border-t border-[#2a3942]">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <button type="button" className="p-2 rounded-full hover:bg-[#374045] transition-colors">
                        <Smile className="w-6 h-6 text-[#8696a0]" />
                    </button>
                    <button type="button" className="p-2 rounded-full hover:bg-[#374045] transition-colors">
                        <Paperclip className="w-6 h-6 text-[#8696a0]" />
                    </button>

                    <div className="flex-1">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Digite uma mensagem"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0] text-[15px] rounded-lg px-4 py-2.5 border-none outline-none focus:ring-1 focus:ring-[#00a884]"
                        />
                    </div>

                    <button 
                        type="submit"
                        className="p-2 rounded-full hover:bg-[#374045] transition-colors"
                    >
                        {inputValue.trim() ? (
                            <Send className="w-6 h-6 text-[#8696a0]" />
                        ) : (
                            <Mic className="w-6 h-6 text-[#8696a0]" />
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}

interface MessageBubbleProps {
    message: WhatsAppMessage
}

function MessageBubble({ message }: MessageBubbleProps) {
    const isFromMe = message.is_from_me

    return (
        <div className={cn(
            "flex mb-1",
            isFromMe ? "justify-end" : "justify-start"
        )}>
            <div className={cn(
                "relative max-w-[65%] px-3 py-1.5 rounded-lg shadow",
                isFromMe 
                    ? "bg-[#005c4b] rounded-tr-none" 
                    : "bg-[#202c33] rounded-tl-none"
            )}>
                {/* Tail */}
                <div className={cn(
                    "absolute top-0 w-3 h-3",
                    isFromMe 
                        ? "-right-2 border-l-8 border-l-[#005c4b] border-t-8 border-t-transparent border-b-8 border-b-transparent" 
                        : "-left-2 border-r-8 border-r-[#202c33] border-t-8 border-t-transparent border-b-8 border-b-transparent"
                )} style={{ display: 'none' }} />

                {/* Content */}
                <p className="text-[#e9edef] text-[14.2px] leading-[19px] whitespace-pre-wrap break-words">
                    {message.content}
                </p>

                {/* Time and Status */}
                <div className="flex items-center justify-end gap-1 mt-0.5 -mb-0.5">
                    <span className="text-[11px] text-[#8696a0]">
                        {formatMessageTime(message.timestamp)}
                    </span>
                    {isFromMe && (
                        <span className="text-[#53bdeb]">
                            {message.status === 'read' ? (
                                <CheckCheck className="w-4 h-4" />
                            ) : message.status === 'delivered' ? (
                                <CheckCheck className="w-4 h-4 text-[#8696a0]" />
                            ) : (
                                <Check className="w-4 h-4 text-[#8696a0]" />
                            )}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}

function groupMessagesByDate(messages: WhatsAppMessage[]): Record<string, WhatsAppMessage[]> {
    const groups: Record<string, WhatsAppMessage[]> = {}
    
    messages.forEach(message => {
        const date = new Date(message.timestamp)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        let dateKey: string
        if (date.toDateString() === today.toDateString()) {
            dateKey = 'HOJE'
        } else if (date.toDateString() === yesterday.toDateString()) {
            dateKey = 'ONTEM'
        } else {
            dateKey = date.toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
            })
        }

        if (!groups[dateKey]) {
            groups[dateKey] = []
        }
        groups[dateKey].push(message)
    })

    return groups
}

function formatMessageTime(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
