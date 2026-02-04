'use client'

import { Search, MoreVertical, MessageSquarePlus } from 'lucide-react'
import { WhatsAppContact } from './whatsapp-chat-layout'
import { cn } from '@/lib/utils'

interface WhatsAppConversationListProps {
    contacts: WhatsAppContact[]
    selectedContact: WhatsAppContact | null
    searchQuery: string
    onSearchChange: (query: string) => void
    onSelectContact: (contact: WhatsAppContact) => void
}

export function WhatsAppConversationList({
    contacts,
    selectedContact,
    searchQuery,
    onSearchChange,
    onSelectContact
}: WhatsAppConversationListProps) {
    return (
        <div className="flex flex-col h-full bg-[#111b21]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#202c33]">
                <h2 className="text-[#e9edef] font-bold text-lg">Conversas</h2>
                <div className="flex items-center gap-2">
                    <button className="p-2 rounded-full hover:bg-[#374045] transition-colors">
                        <MessageSquarePlus className="w-5 h-5 text-[#aebac1]" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-[#374045] transition-colors">
                        <MoreVertical className="w-5 h-5 text-[#aebac1]" />
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="px-3 py-2 bg-[#111b21]">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8696a0]" />
                    <input
                        type="text"
                        placeholder="Pesquisar ou começar uma nova conversa"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full bg-[#202c33] text-[#e9edef] placeholder-[#8696a0] text-sm rounded-lg pl-10 pr-4 py-2 border-none outline-none focus:ring-1 focus:ring-[#00a884]"
                    />
                </div>
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto">
                {contacts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-[#202c33] flex items-center justify-center mb-4">
                            <MessageSquarePlus className="w-8 h-8 text-[#8696a0]" />
                        </div>
                        <p className="text-[#8696a0] text-sm">
                            {searchQuery ? 'Nenhum contato encontrado' : 'Nenhuma conversa ainda'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-[#2a3942]">
                        {contacts.map((contact) => (
                            <ConversationItem
                                key={contact.id}
                                contact={contact}
                                isSelected={selectedContact?.id === contact.id}
                                onClick={() => onSelectContact(contact)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

interface ConversationItemProps {
    contact: WhatsAppContact
    isSelected: boolean
    onClick: () => void
}

function ConversationItem({ contact, isSelected, onClick }: ConversationItemProps) {
    const hasUnread = (contact.unread_count || 0) > 0

    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 px-3 py-3 transition-colors text-left",
                isSelected ? "bg-[#2a3942]" : "hover:bg-[#202c33]"
            )}
        >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-[#6b7c85] flex items-center justify-center overflow-hidden">
                    {contact.photo_url ? (
                        <img
                            src={contact.photo_url}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <svg className="w-7 h-7 text-[#cfd9df]" viewBox="0 0 212 212">
                            <path fill="currentColor" d="M106.251,0.5C164.653,0.5,212,47.846,212,106.25S164.653,212,106.251,212C47.846,212,0.5,164.654,0.5,106.25S47.846,0.5,106.251,0.5z M173.561,171.615c-0.601-0.915-1.287-1.907-2.065-2.955c-0.777-1.049-1.645-2.155-2.608-3.299c-0.964-1.144-2.024-2.326-3.184-3.527c-1.741-1.802-3.895-3.18-6.451-4.135c-2.556-0.955-5.514-1.433-8.875-1.433H62.123c-3.361,0-6.319,0.478-8.875,1.433c-2.556,0.955-4.71,2.333-6.451,4.135c-1.16,1.201-2.22,2.383-3.184,3.527c-0.963,1.144-1.831,2.25-2.608,3.299c-0.778,1.048-1.464,2.04-2.065,2.955c-0.601,0.915-1.11,1.77-1.528,2.564c13.916,15.629,34.099,25.471,56.589,25.471c22.489,0,42.673-9.842,56.589-25.471C174.671,173.385,174.162,172.53,173.561,171.615z M106.251,64.948c-22.005,0-39.867,17.862-39.867,39.867s17.862,39.867,39.867,39.867c22.005,0,39.867-17.862,39.867-39.867S128.256,64.948,106.251,64.948z"/>
                        </svg>
                    )}
                </div>
                {contact.is_online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] rounded-full border-2 border-[#111b21]" />
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                    <p className="font-medium text-[#e9edef] truncate text-[15px]">
                        {contact.name}
                    </p>
                    <span className={cn(
                        "text-xs flex-shrink-0 ml-2",
                        hasUnread ? "text-[#00a884]" : "text-[#8696a0]"
                    )}>
                        {formatTime(contact.last_message_time)}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <p className="text-sm text-[#8696a0] truncate">
                        {contact.last_message || contact.phone}
                    </p>
                    {hasUnread && (
                        <span className="flex-shrink-0 ml-2 min-w-[20px] h-5 bg-[#00a884] rounded-full flex items-center justify-center">
                            <span className="text-[11px] font-medium text-[#111b21] px-1.5">
                                {contact.unread_count}
                            </span>
                        </span>
                    )}
                </div>
            </div>
        </button>
    )
}

function formatTime(dateString?: string): string {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffDays === 0) {
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
        return 'Ontem'
    } else if (diffDays < 7) {
        return date.toLocaleDateString('pt-BR', { weekday: 'short' })
    } else {
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
    }
}
