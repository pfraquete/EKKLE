'use client'

import { useState, useEffect } from 'react'
import { WhatsAppConversationList } from './whatsapp-conversation-list'
import { WhatsAppChatArea } from './whatsapp-chat-area'
import { WhatsAppEmptyState } from './whatsapp-empty-state'
import { MessageSquare } from 'lucide-react'

export interface WhatsAppContact {
    id: string
    name: string
    phone: string
    photo_url?: string | null
    last_message?: string
    last_message_time?: string
    unread_count?: number
    is_online?: boolean
}

export interface WhatsAppMessage {
    id: string
    contact_id: string
    content: string
    is_from_me: boolean
    timestamp: string
    status: 'sent' | 'delivered' | 'read'
    type: 'text' | 'image' | 'audio' | 'document'
}

interface WhatsAppChatLayoutProps {
    contacts: WhatsAppContact[]
    instanceName: string
    isConnected: boolean
}

export function WhatsAppChatLayout({
    contacts: initialContacts,
    instanceName,
    isConnected
}: WhatsAppChatLayoutProps) {
    const [contacts, setContacts] = useState<WhatsAppContact[]>(initialContacts)
    const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null)
    const [messages, setMessages] = useState<WhatsAppMessage[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    // Filter contacts based on search
    const filteredContacts = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phone.includes(searchQuery)
    )

    // Handle contact selection
    const handleSelectContact = async (contact: WhatsAppContact) => {
        setSelectedContact(contact)
        setIsLoading(true)
        
        // TODO: Fetch messages for this contact from Evolution API
        // For now, using mock data
        setTimeout(() => {
            setMessages([
                {
                    id: '1',
                    contact_id: contact.id,
                    content: 'Olá! Como posso ajudar?',
                    is_from_me: true,
                    timestamp: new Date(Date.now() - 3600000).toISOString(),
                    status: 'read',
                    type: 'text'
                },
                {
                    id: '2',
                    contact_id: contact.id,
                    content: 'Oi! Gostaria de saber mais sobre os cultos.',
                    is_from_me: false,
                    timestamp: new Date(Date.now() - 3500000).toISOString(),
                    status: 'read',
                    type: 'text'
                },
                {
                    id: '3',
                    contact_id: contact.id,
                    content: 'Claro! Nossos cultos acontecem aos domingos às 10h e 18h.',
                    is_from_me: true,
                    timestamp: new Date(Date.now() - 3400000).toISOString(),
                    status: 'read',
                    type: 'text'
                },
            ])
            setIsLoading(false)
        }, 500)

        // Mark as read
        setContacts(prev => prev.map(c => 
            c.id === contact.id ? { ...c, unread_count: 0 } : c
        ))
    }

    // Handle sending message
    const handleSendMessage = async (content: string) => {
        if (!selectedContact || !content.trim()) return

        const newMessage: WhatsAppMessage = {
            id: Date.now().toString(),
            contact_id: selectedContact.id,
            content: content.trim(),
            is_from_me: true,
            timestamp: new Date().toISOString(),
            status: 'sent',
            type: 'text'
        }

        setMessages(prev => [...prev, newMessage])

        // Update contact's last message
        setContacts(prev => prev.map(c => 
            c.id === selectedContact.id 
                ? { ...c, last_message: content.trim(), last_message_time: new Date().toISOString() }
                : c
        ))

        // TODO: Actually send via Evolution API
        // Simulate delivery
        setTimeout(() => {
            setMessages(prev => prev.map(m => 
                m.id === newMessage.id ? { ...m, status: 'delivered' } : m
            ))
        }, 1000)
    }

    if (!isConnected) {
        return (
            <div className="h-[calc(100vh-16rem)] bg-[#111b21] rounded-2xl border border-[#2a3942] overflow-hidden flex items-center justify-center">
                <div className="text-center p-8">
                    <div className="w-20 h-20 rounded-full bg-[#00a884]/20 flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-10 h-10 text-[#00a884]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#e9edef] mb-2">WhatsApp Desconectado</h3>
                    <p className="text-[#8696a0] max-w-sm">
                        Conecte seu WhatsApp na aba "Conexão WhatsApp" para visualizar as conversas.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-[calc(100vh-16rem)] bg-[#111b21] rounded-2xl border border-[#2a3942] overflow-hidden">
            <div className="grid grid-cols-[380px_1fr] h-full">
                {/* Left: Conversation List */}
                <div className="border-r border-[#2a3942] overflow-hidden">
                    <WhatsAppConversationList
                        contacts={filteredContacts}
                        selectedContact={selectedContact}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onSelectContact={handleSelectContact}
                    />
                </div>

                {/* Right: Chat Area */}
                <div className="overflow-hidden bg-[#0b141a]">
                    {selectedContact ? (
                        <WhatsAppChatArea
                            contact={selectedContact}
                            messages={messages}
                            isLoading={isLoading}
                            onSendMessage={handleSendMessage}
                        />
                    ) : (
                        <WhatsAppEmptyState />
                    )}
                </div>
            </div>
        </div>
    )
}
