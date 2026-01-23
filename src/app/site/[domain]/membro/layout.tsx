import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogOut } from 'lucide-react'
import Image from 'next/image'
import { CartProvider } from '@/context/cart-context'
import { CartButton } from '@/components/store/cart-button'
import { SidebarNav } from '@/components/membro/sidebar-nav'

export default async function MembroLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const church = await getChurch()
  const supabase = await createClient()

  if (!church) {
    redirect('/')
  }

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
        {/* Header */}
        <header className="border-b border-border/40 bg-background/60 backdrop-blur-2xl sticky top-0 z-50">
          <div className="container mx-auto px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Logo and Church Name */}
              <Link href="/" className="flex items-center gap-4 group">
                {church.logo_url ? (
                  <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-2xl group-hover:scale-110 transition-all duration-500 border border-white/10">
                    <Image
                      src={church.logo_url}
                      alt={church.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    {church.name[0]}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-black text-xl tracking-tighter uppercase whitespace-nowrap leading-none mb-0.5">{church.name}</span>
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/80">Ambiente de Membro</span>
                </div>
              </Link>

              {/* User Menu */}
              <div className="flex items-center gap-6">
                <CartButton />
                <div className="flex items-center gap-5 pl-6 border-l border-border/50">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-black text-foreground leading-none mb-1">
                      {profile?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
                    </p>
                    <div className="flex items-center justify-end gap-1.5 opacity-60">
                      <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                      <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground">Online</p>
                    </div>
                  </div>
                  <Link
                    href="/"
                    className="p-3 bg-muted/30 rounded-2xl text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:shadow-xl hover:shadow-primary/20 transition-all duration-500 group"
                    title="Explorar Site Público"
                  >
                    <LogOut className="w-5 h-5 rotate-180 group-hover:scale-110 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Sidebar + Content */}
        <div className="flex-1 flex max-w-[1600px] mx-auto w-full">
          {/* Sidebar */}
          <aside className="w-80 hidden lg:block py-12 px-8">
            <SidebarNav />
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </CartProvider>
  )
}
