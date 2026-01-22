import { getProfile } from '@/actions/auth';
import { getProducts, getProductCategories } from '@/actions/products';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Package, Filter } from 'lucide-react';
import { StoreCatalog } from '@/components/store/store-catalog';

export default async function MemberStorePage() {
  const profile = await getProfile();
  if (!profile) redirect('/login');

  // Get active products only
  const products = await getProducts({ status: 'active' });
  const categories = await getProductCategories();
  const activeCategories = categories.filter((c) => c.is_active);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingBag className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Loja Virtual</h1>
          </div>
          <p className="text-muted-foreground">
            Confira os produtos disponíveis e faça seu pedido
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {products.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum produto disponível</h3>
            <p className="text-muted-foreground">
              Em breve teremos produtos disponíveis na loja
            </p>
          </Card>
        ) : (
          <StoreCatalog products={products} categories={activeCategories} />
        )}
      </div>
    </div>
  );
}
