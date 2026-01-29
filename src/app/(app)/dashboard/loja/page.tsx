import { getProfile } from '@/actions/auth';
import { getProducts } from '@/actions/products';
import { getChurchRecipient } from '@/actions/recipients';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Package } from 'lucide-react';
import { ProductCard } from '@/components/products/product-card';

export default async function ProductsListPage() {
  const profile = await getProfile();
  if (!profile) redirect('/login');
  if (profile.role !== 'PASTOR') redirect('/dashboard');

  // Check if recipient is configured
  const { recipient } = await getChurchRecipient();
  const isRecipientConfigured = recipient && recipient.status === 'active';

  // Get products
  const products = await getProducts();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="w-8 h-8" />
            Loja Virtual
          </h1>
          <p className="text-muted-foreground mt-2">Gerencie os produtos da sua loja</p>
        </div>

        {isRecipientConfigured && (
          <Link href="/dashboard/loja/novo">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </Link>
        )}
      </div>


      {/* Stats */}
      {isRecipientConfigured && products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total de Produtos</div>
            <div className="text-2xl font-bold mt-1">{products.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Produtos Ativos</div>
            <div className="text-2xl font-bold mt-1 text-green-600">
              {products.filter((p) => p.status === 'active').length}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Rascunhos</div>
            <div className="text-2xl font-bold mt-1 text-gray-600">
              {products.filter((p) => p.status === 'draft').length}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Sem Estoque</div>
            <div className="text-2xl font-bold mt-1 text-red-600">
              {products.filter((p) => p.status === 'out_of_stock').length}
            </div>
          </Card>
        </div>
      )}

      {/* Products Grid */}
      {products.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Nenhum produto cadastrado</h3>
          <p className="text-muted-foreground mb-6">
            {isRecipientConfigured
              ? 'Comece adicionando produtos à sua loja virtual'
              : 'Configure a conta bancária em Configurações > Pagamentos para começar a vender'}
          </p>
          {isRecipientConfigured && (
            <Link href="/dashboard/loja/novo">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Produto
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
