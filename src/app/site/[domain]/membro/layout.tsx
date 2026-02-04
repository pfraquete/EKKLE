import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogOut } from 'lucide-react'
import Image from 'next/image'
import { CartProvider } from '@/context/cart-context'
import { CartButton } from '@/components/store/cart-button'
import { SidebarNav } from '@/components/membro/sidebar-nav'
import { MemberMobileNav } from '@/components/membro/mobile-nav'
import { ImpersonationWrapper } from '@/components/admin/impersonation-wrapper'

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

  // Get user profile - use maybeSingle to avoid PGRST116 error when profile doesn't exist
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('[MembroLayout] Error fetching profile:', profileError)
    redirect('/login')
  }

  return (
    <CartProvider>
      {/* Impersonation Banner */}
      <ImpersonationWrapper />

      <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
        {/* Header */}
        <header className="border-b border-border/40 bg-background/95 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-3">
              {/* Logo and Church Name */}
              <Link href="/" className="flex items-center gap-2 sm:gap-4 group min-w-0 flex-1">
                {church.logo_url ? (
                  <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg group-hover:scale-105 transition-all duration-300 border border-white/10 flex-shrink-0">
                    <Image
                      src={church.logo_url}
                      alt={church.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-primary font-black border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 flex-shrink-0">
                    {church.name[0]}
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="font-black text-base sm:text-xl tracking-tighter uppercase leading-none mb-0.5 truncate">{church.name}</span>
                  <span className="text-xs sm:text-xs font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-primary/80 hidden sm:block">Membro</span>
                </div>
              </Link>

              {/* User Menu */}
              <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 flex-shrink-0">
                <CartButton />
                <div className="flex items-center gap-2 sm:gap-5 pl-2 sm:pl-6 border-l border-border/50">
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-black text-foreground leading-none mb-1">
                      {profile?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
                    </p>
                    <div className="flex items-center justify-end gap-1.5 opacity-60">
                      <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                      <p className="text-xs uppercase font-black tracking-widest text-muted-foreground">Online</p>
                    </div>
                  </div>
                  <Link
                    href="/"
                    className="p-2.5 sm:p-3 bg-muted/30 rounded-xl sm:rounded-2xl text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 group"
                    title="Explorar Site Público"
                  >
                    <LogOut className="w-4 h-4 sm:w-5 sm:h-5 rotate-180 group-hover:scale-110 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Sidebar + Content */}
        <div className="flex-1 flex max-w-[1600px] mx-auto w-full">
          {/* Sidebar - Desktop only */}
          <aside className="w-80 hidden lg:block py-12 px-8">
            <SidebarNav profile={profile} />
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-12 pb-24 lg:pb-12 overflow-y-auto">
            {children}
          </main>
        </div>

        {/* Mobile Navigation */}
        <MemberMobileNav profile={profile} />
      </div>
    </CartProvider>
  )
}
