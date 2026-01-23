import { getChurch } from '@/lib/get-church'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, User, LogOut, ShoppingBag, Package, Calendar, Home } from 'lucide-react'
import Image from 'next/image'
import { CartProvider } from '@/context/cart-context'
import { CartButton } from '@/components/store/cart-button'

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
      <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Church Name */}
            <Link href="/" className="flex items-center gap-3">
              {church.logo_url ? (
                <Image
                  src={church.logo_url}
                  alt={church.name}
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
              ) : (
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
                  {church.name[0]}
                </div>
              )}
              <span className="font-bold">{church.name}</span>
            </Link>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <CartButton />
              <span className="text-sm text-gray-600 hidden sm:block">
                {profile?.full_name || user.email}
              </span>
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-primary transition-colors"
              >
                Voltar ao Site
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar + Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-50 border-r hidden md:block">
          <nav className="p-4 space-y-2">
            <Link
              href="/membro"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white transition-colors"
            >
              <User className="w-5 h-5" />
              <span>Meu Perfil</span>
            </Link>
            <Link
              href="/membro/cursos"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white transition-colors"
            >
              <BookOpen className="w-5 h-5" />
              <span>Meus Cursos</span>
            </Link>
            <Link
              href="/membro/eventos"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white transition-colors"
            >
              <Calendar className="w-5 h-5" />
              <span>Meus Eventos</span>
            </Link>
            <Link
              href="/membro/celulas"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white transition-colors"
            >
              <Home className="w-5 h-5" />
              <span>Células</span>
            </Link>
            <Link
              href="/membro/loja"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Loja Virtual</span>
            </Link>
            <Link
              href="/membro/pedidos"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white transition-colors"
            >
              <Package className="w-5 h-5" />
              <span>Meus Pedidos</span>
            </Link>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white transition-colors text-red-600"
              >
                <LogOut className="w-5 h-5" />
                <span>Sair</span>
              </button>
            </form>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
    </CartProvider>
  )
}
