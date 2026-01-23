import { getProfile } from '@/actions/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { VisualEditor } from '@/components/branding/visual-editor'

export const metadata = {
    title: 'Editor Visual - Ekkle',
    description: 'Personalize o visual do site da sua igreja em tempo real',
}

export default async function VisualEditorPage() {
    const profile = await getProfile()

    if (!profile) {
        redirect('/login')
    }

    if (profile.role !== 'PASTOR') {
        redirect('/dashboard')
    }

    return (
        <div className="flex h-screen flex-col bg-background">
            {/* Header Area */}
            <div className="shrink-0 border-b border-border bg-card px-8 py-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/configuracoes/site"
                        className="rounded-full p-2 transition-colors hover:bg-muted"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Editor Visual do Site
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Personalize cores, fontes e seções com preview em tempo real
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 overflow-hidden bg-muted/30 p-6">
                <VisualEditor />
            </div>
        </div>
    )
}
