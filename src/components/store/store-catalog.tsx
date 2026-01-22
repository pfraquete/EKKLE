'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Package } from 'lucide-react';
import { useCart } from '@/context/cart-context';

interface Product {
  id: string;
  name: string;
  slug: string;
  short_description?: string;
  price_cents: number;
  compare_at_price_cents?: number;
  stock_quantity: number;
  track_inventory: boolean;
  allow_backorder: boolean;
  is_featured: boolean;
  category?: {
    id: string;
    name: string;
  } | null;
  images?: Array<{
    url: string;
    is_primary: boolean;
  }>;
}

interface StoreCatalogProps {
  products: Product[];
  categories: Array<{
    id: string;
    name: string;
  }>;
}

export function StoreCatalog({ products, categories }: StoreCatalogProps) {
  const { addItem } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredProducts =
    selectedCategory === 'all'
      ? products
      : products.filter((p) => p.category?.id === selectedCategory);

  const handleAddToCart = (product: Product) => {
    const primaryImage = product.images?.find((img) => img.is_primary);
    const imageUrl = primaryImage?.url || product.images?.[0]?.url;

    addItem({
      product_id: product.id,
      name: product.name,
      price_cents: product.price_cents,
      image_url: imageUrl,
      stock_quantity: product.track_inventory ? product.stock_quantity : undefined,
      metadata: (product as any).metadata,
    });
  };

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            Todos
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>
      )}

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhum produto encontrado nesta categoria</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const primaryImage = product.images?.find((img) => img.is_primary);
            const imageUrl = primaryImage?.url || product.images?.[0]?.url;
            const isOutOfStock =
              product.track_inventory && product.stock_quantity <= 0 && !product.allow_backorder;

            return (
              <Card
                key={product.id}
                className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
              >
                {/* Image */}
                <Link href={`/membro/loja/${product.slug}`} className="relative h-48 bg-gray-100">
                  {imageUrl ? (
                    <Image src={imageUrl} alt={product.name} fill className="object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  {product.is_featured && (
                    <Badge className="absolute top-2 left-2 bg-yellow-500">Destaque</Badge>
                  )}
                  {isOutOfStock && (
                    <Badge className="absolute top-2 right-2 bg-red-500">Esgotado</Badge>
                  )}
                </Link>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                  <Link href={`/membro/loja/${product.slug}`}>
                    <h3 className="font-semibold text-lg mb-1 hover:text-primary line-clamp-2">
                      {product.name}
                    </h3>
                  </Link>

                  {product.category && (
                    <p className="text-xs text-muted-foreground mb-2">{product.category.name}</p>
                  )}

                  {product.short_description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {product.short_description}
                    </p>
                  )}

                  {/* Price */}
                  <div className="mb-4 mt-auto">
                    {product.compare_at_price_cents && product.compare_at_price_cents > product.price_cents && (
                      <p className="text-sm text-muted-foreground line-through">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(product.compare_at_price_cents / 100)}
                      </p>
                    )}
                    <p className="text-2xl font-bold text-primary">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(product.price_cents / 100)}
                    </p>
                  </div>

                  {/* Add to Cart Button */}
                  <Button
                    className="w-full"
                    onClick={() => handleAddToCart(product)}
                    disabled={isOutOfStock}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {isOutOfStock ? 'Esgotado' : 'Adicionar ao Carrinho'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
