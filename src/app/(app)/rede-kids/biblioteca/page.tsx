import { Suspense } from 'react'
import { getLibraryCategories, getLibraryContent, getLibraryStats, seedDefaultLibraryCategories } from '@/actions/kids-library'
import { getProfile } from '@/actions/auth'
import { CategoryGrid, ContentCard, ContentForm } from '@/components/rede-kids/library'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Search,
  BookOpen,
  Star,
  Eye,
  FolderPlus,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function LibraryContent({
  categoryId,
  search,
}: {
  categoryId?: string
  search?: string
}) {
  const [categories, content, stats, profile] = await Promise.all([
    getLibraryCategories(),
    getLibraryContent({ category_id: categoryId, search }),
    getLibraryStats(),
    getProfile(),
  ])

  const isPastor = profile?.role === 'PASTOR' || profile?.kids_role === 'PASTORA_KIDS'
  const canCreate = isPastor || profile?.kids_role === 'DISCIPULADORA_KIDS' || profile?.kids_role === 'LEADER_KIDS'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Biblioteca Kids</h1>
          <p className="text-muted-foreground">
            Lições, histórias, músicas e atividades para as células
          </p>
        </div>
        {canCreate && (
          <div className="flex gap-2">
            {isPastor && categories.length === 0 && (
              <form action={async () => {
                'use server'
                await seedDefaultLibraryCategories()
              }}>
                <Button type="submit" variant="outline">
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Criar Categorias Padrão
                </Button>
              </form>
            )}
            <Link href="/rede-kids/biblioteca/novo">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Conteúdo
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalContent}</p>
                <p className="text-xs text-muted-foreground">Conteúdos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalCategories}</p>
                <p className="text-xs text-muted-foreground">Categorias</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Categories */}
      {categories.length > 0 && !categoryId && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Categorias</h2>
          <CategoryGrid categories={categories} />
        </div>
      )}

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <form>
            <Input
              name="busca"
              placeholder="Buscar conteúdos..."
              className="pl-9"
              defaultValue={search}
            />
          </form>
        </div>
      </div>

      {/* Content Grid */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="featured">Destaques</TabsTrigger>
          <TabsTrigger value="recent">Recentes</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {content.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {content.map((item) => (
                <ContentCard
                  key={item.id}
                  content={item}
                  showActions={isPastor}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum conteúdo encontrado</h3>
              <p className="text-muted-foreground">
                {search
                  ? 'Tente uma busca diferente'
                  : 'Comece adicionando lições e materiais à biblioteca'}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="featured" className="mt-4">
          {content.filter(c => c.is_featured).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {content
                .filter((c) => c.is_featured)
                .map((item) => (
                  <ContentCard
                    key={item.id}
                    content={item}
                    showActions={isPastor}
                  />
                ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum destaque</h3>
              <p className="text-muted-foreground">
                Marque conteúdos como destaque para aparecerem aqui
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {content.slice(0, 6).map((item) => (
              <ContentCard
                key={item.id}
                content={item}
                showActions={isPastor}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default async function BibliotecaPage({
  searchParams,
}: {
  searchParams: { categoria?: string; busca?: string }
}) {
  return (
    <div className="container mx-auto py-6">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <LibraryContent
          categoryId={searchParams.categoria}
          search={searchParams.busca}
        />
      </Suspense>
    </div>
  )
}
