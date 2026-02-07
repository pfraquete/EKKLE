import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BibleReader } from '@/components/bible/bible-reader'
import { Suspense } from 'react'

export default async function BibleReaderPage() {
  const church = await getChurch()
  const supabase = await createClient()

  if (!church) {
    redirect('/')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/membro/biblia-oracao">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">
            Ler Bíblia
          </h1>
          <p className="text-sm text-muted-foreground">
            Leitura livre da Palavra de Deus
          </p>
        </div>
      </div>

      {/* Bible Reader Component */}
      <Suspense fallback={
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }>
        <BibleReader />
      </Suspense>
    </div>
  )
}
