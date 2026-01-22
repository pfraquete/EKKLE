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
        <div className="flex flex-col h-screen bg-white">
            {/* Header Area */}
            <div className="px-8 py-4 border-b flex items-center justify-between bg-card shrink-0">
                <div className="flex items-center gap-4">
                    <Link
                        href="/configuracoes/site"
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
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
            <div className="flex-1 overflow-hidden p-6 bg-gray-50/50">
                <VisualEditor />
            </div>
        </div>
    )
}
