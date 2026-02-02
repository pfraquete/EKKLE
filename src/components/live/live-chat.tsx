'use client'

import { useState, useEffect, useRef, FormEvent } from 'react'
import { Send, Trash2, Pin, MessageSquareOff, MoreVertical, ShieldCheck, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  LiveChatMessage,
  sendChatMessage,
  getChatMessages,
  deleteChatMessage,
  togglePinMessage,
} from '@/actions/live-streams'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Profile = {
  id: string
  role: string
  full_name: string
  photo_url: string | null
}

type LiveChatProps = {
  streamId: string
  churchId: string
  chatEnabled: boolean
  isLive: boolean
  profile: Profile
}

export function LiveChat({ streamId, churchId, chatEnabled, isLive, profile }: LiveChatProps) {
  const [messages, setMessages] = useState<LiveChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const isPastor = profile.role === 'PASTOR'

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      const initialMessages = await getChatMessages(streamId)
      setMessages(initialMessages)
    }
    loadMessages()
  }, [streamId])

  // Subscribe to realtime updates
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`live-chat-${streamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chat_messages',
          filter: `live_stream_id=eq.${streamId}`,
        },
        async (payload) => {
          // Fetch the full message with profile info
          const { data } = await supabase
            .from('live_chat_messages')
            .select(`
              *,
              profile:profiles(id, full_name, photo_url, role)
            `)
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setMessages((prev) => [...prev, data as LiveChatMessage])
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'live_chat_messages',
          filter: `live_stream_id=eq.${streamId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id
                ? { ...msg, ...payload.new }
                : msg
            )
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'live_chat_messages',
          filter: `live_stream_id=eq.${streamId}`,
        },
        (payload) => {
          setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [streamId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [messages])

  const handleSend = async (e: FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || sending || !chatEnabled || !isLive) return

    setSending(true)
    const result = await sendChatMessage(streamId, newMessage)
    setSending(false)

    if (result.success) {
      setNewMessage('')
    }
  }

  const handleDelete = async (messageId: string) => {
    await deleteChatMessage(messageId)
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
    setMenuOpen(null)
  }

  const handlePin = async (messageId: string) => {
    const result = await togglePinMessage(messageId)
    if (result.success) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, is_pinned: result.isPinned ?? !msg.is_pinned }
            : msg
        )
      )
    }
    setMenuOpen(null)
  }

  // Get pinned messages
  const pinnedMessages = messages.filter((msg) => msg.is_pinned && !msg.is_deleted)

  // Get regular messages (not deleted)
  const regularMessages = messages.filter((msg) => !msg.is_deleted)

  if (!chatEnabled) {
    return (
      <div className="bg-card rounded-[2.5rem] border border-border/50 shadow-2xl h-full flex flex-col">
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-2">
            <MessageSquareOff className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-black text-xs uppercase tracking-[0.2em] text-foreground">
              Chat
            </h2>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <MessageSquareOff className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Chat desabilitado</p>
            <p className="text-muted-foreground/60 text-sm mt-1">
              O pastor desativou o chat para esta transmissao
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-[2.5rem] border border-border/50 shadow-2xl h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-xs uppercase tracking-[0.2em] text-foreground">
            Chat ao Vivo
          </h2>
          <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">
            {regularMessages.length} mensagens
          </div>
        </div>
      </div>

      {/* Pinned Messages */}
      {pinnedMessages.length > 0 && (
        <div className="p-4 border-b border-border/50 bg-primary/5">
          <div className="flex items-center gap-2 mb-3">
            <Pin className="w-3 h-3 text-primary" />
            <span className="text-xs font-black uppercase tracking-widest text-primary">
              Fixadas
            </span>
          </div>
          {pinnedMessages.map((msg) => (
            <div key={msg.id} className="bg-background/50 rounded-xl p-3 mb-2 last:mb-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-xs text-foreground">
                  {msg.profile?.full_name || 'Anonimo'}
                </span>
                {msg.profile?.role === 'PASTOR' && (
                  <ShieldCheck className="w-3 h-3 text-primary" />
                )}
              </div>
              <p className="text-sm text-foreground/90">{msg.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
      >
        {regularMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground/60 text-sm">
                Seja o primeiro a enviar uma mensagem!
              </p>
            </div>
          </div>
        ) : (
          regularMessages.map((msg) => (
            <div
              key={msg.id}
              className={`group relative flex gap-3 ${
                msg.profile_id === profile.id ? 'flex-row-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  msg.profile?.role === 'PASTOR'
                    ? 'bg-primary text-primary-foreground'
                    : msg.profile?.role === 'LEADER'
                    ? 'bg-amber-500/20 text-amber-500'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {msg.profile?.photo_url ? (
                  <img
                    src={msg.profile.photo_url}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : msg.profile?.role === 'PASTOR' ? (
                  <ShieldCheck className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>

              {/* Message */}
              <div
                className={`flex-1 max-w-[80%] ${
                  msg.profile_id === profile.id ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`rounded-2xl px-4 py-2 ${
                    msg.profile_id === profile.id
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-muted'
                  }`}
                >
                  {/* Name & Badge */}
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={`font-bold text-xs ${
                        msg.profile_id === profile.id
                          ? 'text-primary-foreground/80'
                          : 'text-foreground'
                      }`}
                    >
                      {msg.profile?.full_name || 'Anonimo'}
                    </span>
                    {msg.profile?.role === 'PASTOR' && msg.profile_id !== profile.id && (
                      <span className="text-xs font-black uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        Pastor
                      </span>
                    )}
                    {msg.profile?.role === 'LEADER' && msg.profile_id !== profile.id && (
                      <span className="text-xs font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        Lider
                      </span>
                    )}
                  </div>

                  {/* Message Text */}
                  <p
                    className={`text-sm break-words ${
                      msg.profile_id === profile.id
                        ? 'text-primary-foreground'
                        : 'text-foreground/90'
                    }`}
                  >
                    {msg.message}
                  </p>

                  {/* Time */}
                  <span
                    className={`text-xs mt-1 block ${
                      msg.profile_id === profile.id
                        ? 'text-primary-foreground/60 text-right'
                        : 'text-muted-foreground/60'
                    }`}
                  >
                    {formatDistanceToNow(new Date(msg.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
              </div>

              {/* Actions Menu */}
              {(isPastor || msg.profile_id === profile.id) && (
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === msg.id ? null : msg.id)}
                      className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>

                    {menuOpen === msg.id && (
                      <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg py-1 z-10 min-w-[140px]">
                        {isPastor && (
                          <button
                            onClick={() => handlePin(msg.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors"
                          >
                            <Pin className="w-3.5 h-3.5" />
                            {msg.is_pinned ? 'Desafixar' : 'Fixar'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(msg.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border/50">
        {isLive ? (
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Envie uma mensagem..."
              maxLength={500}
              className="flex-1 bg-muted border-0 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="text-center py-2">
            <p className="text-muted-foreground/60 text-sm">
              Chat disponivel apenas durante transmissoes ao vivo
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
