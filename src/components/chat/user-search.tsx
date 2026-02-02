'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, User, Loader2 } from 'lucide-react'
import { searchUsers, UserSearchResult, getOrCreateConversation } from '@/actions/direct-messages'
import { useRouter } from 'next/navigation'

interface UserSearchProps {
    basePath: string
    onClose?: () => void
}

export function UserSearch({ basePath, onClose }: UserSearchProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<UserSearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [starting, setStarting] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    // Search users with debounce
    useEffect(() => {
        if (query.length < 2) {
            setResults([])
            return
        }

        const timeout = setTimeout(async () => {
            setLoading(true)
            const users = await searchUsers(query)
            setResults(users)
            setLoading(false)
        }, 300)

        return () => clearTimeout(timeout)
    }, [query])

    const handleStartConversation = async (userId: string) => {
        setStarting(userId)
        const conversation = await getOrCreateConversation(userId)
        if (conversation) {
            router.push(`${basePath}/${conversation.id}`)
            onClose?.()
        }
        setStarting(null)
    }

    return (
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
            {/* Search Header */}
            <div className="p-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar por nome ou @nickname..."
                            className="w-full bg-muted border-0 rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-background rounded-lg transition-colors"
                            >
                                <X className="w-3 h-3 text-muted-foreground" />
                            </button>
                        )}
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto">
                {loading ? (
                    <div className="p-8 text-center">
                        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin mx-auto" />
                        <p className="text-sm text-muted-foreground mt-2">Buscando...</p>
                    </div>
                ) : results.length === 0 && query.length >= 2 ? (
                    <div className="p-8 text-center">
                        <User className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                            Nenhum utilizador encontrado
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                            Tente buscar por outro nome ou nickname
                        </p>
                    </div>
                ) : results.length === 0 ? (
                    <div className="p-8 text-center">
                        <Search className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                            Digite pelo menos 2 caracteres
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/50">
                        {results.map((user) => (
                            <button
                                key={user.id}
                                onClick={() => handleStartConversation(user.id)}
                                disabled={starting === user.id}
                                className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
                            >
                                {/* Avatar */}
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                    {user.photo_url ? (
                                        <img
                                            src={user.photo_url}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-5 h-5 text-muted-foreground" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-foreground truncate">
                                        {user.full_name}
                                    </p>
                                    {user.nickname && (
                                        <p className="text-xs text-primary font-medium">
                                            @{user.nickname}
                                        </p>
                                    )}
                                    {user.church_name && (
                                        <p className="text-xs text-muted-foreground truncate">
                                            {user.church_name}
                                        </p>
                                    )}
                                </div>

                                {/* Loading indicator */}
                                {starting === user.id && (
                                    <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
