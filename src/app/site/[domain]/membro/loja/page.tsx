import { getProfile } from '@/actions/auth';
import { getProducts, getProductCategories } from '@/actions/products';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Package } from 'lucide-react';
import { StoreCatalog } from '@/components/store/store-catalog';
import Link from 'next/link';

export default async function MemberStorePage() {
  const profile = await getProfile();
  if (!profile) redirect('/login');

  // Get active products only
  const products = await getProducts({ status: 'active' });
  const categories = await getProductCategories();
  const activeCategories = categories.filter((c) => c.is_active);

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
      {/* Header */}
      <div>
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <ShoppingBag className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">Loja Virtual</h1>
            <p className="text-sm sm:text-base text-muted-foreground font-medium">Confira os produtos selecionados da nossa comunidade</p>
          </div>
          <Button variant="outline" asChild className="rounded-xl gap-2">
            <Link href="/membro/pedidos">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Meus Pedidos</span>
              <span className="sm:hidden">Pedidos</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div>
        {products.length === 0 ? (
          <div className="py-24 text-center bg-card border border-dashed border-border rounded-[3rem]">
            <Package className="w-20 h-20 mx-auto text-muted-foreground/10 mb-6" />
            <h3 className="text-2xl font-black text-foreground mb-2">Vitrine vazia</h3>
            <p className="text-muted-foreground font-medium">
              Em breve teremos produtos exclusivos disponíveis para você.
            </p>
          </div>
        ) : (
          <StoreCatalog products={products} categories={activeCategories} />
        )}
      </div>
    </div>
  );
}
