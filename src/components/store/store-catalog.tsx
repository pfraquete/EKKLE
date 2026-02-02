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
    <div className="space-y-10">
      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 border ${selectedCategory === 'all'
                ? 'bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20 scale-105'
                : 'bg-card text-muted-foreground border-border hover:border-primary/50'
              }`}
          >
            Todos
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 border ${selectedCategory === category.id
                  ? 'bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20 scale-105'
                  : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="py-24 text-center bg-card border border-dashed border-border rounded-[3rem]">
          <Package className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
          <p className="text-muted-foreground font-medium">Nenhum produto nesta categoria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map((product) => {
            const primaryImage = product.images?.find((img) => img.is_primary);
            const imageUrl = primaryImage?.url || product.images?.[0]?.url;
            const isOutOfStock =
              product.track_inventory && product.stock_quantity <= 0 && !product.allow_backorder;

            return (
              <div
                key={product.id}
                className="group bg-card border border-border/50 rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:border-primary/20 transition-all duration-500 flex flex-col h-full"
              >
                {/* Image */}
                <Link href={`/membro/loja/${product.slug}`} className="relative h-64 bg-muted overflow-hidden">
                  {imageUrl ? (
                    <Image src={imageUrl} alt={product.name} fill className="object-cover group-hover:scale-110 transition-transform duration-1000" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="w-16 h-16 text-muted-foreground/10" />
                    </div>
                  )}
                  {product.is_featured && (
                    <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                      Destaque
                    </div>
                  )}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="bg-destructive text-destructive-foreground px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-2xl">
                        Esgotado
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-card to-transparent opacity-60" />
                </Link>

                {/* Content */}
                <div className="p-8 flex flex-col flex-1">
                  <div className="mb-6 flex-1">
                    <Link href={`/membro/loja/${product.slug}`}>
                      <h3 className="font-black text-xl text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight mb-2">
                        {product.name}
                      </h3>
                    </Link>

                    {product.category && (
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">{product.category.name}</p>
                    )}

                    {product.short_description && (
                      <p className="text-muted-foreground text-sm line-clamp-2 font-medium">
                        {product.short_description}
                      </p>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    {product.compare_at_price_cents && product.compare_at_price_cents > product.price_cents && (
                      <p className="text-xs text-muted-foreground line-through font-bold mb-1">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(product.compare_at_price_cents / 100)}
                      </p>
                    )}
                    <p className="text-3xl font-black text-foreground">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(product.price_cents / 100)}
                    </p>
                  </div>

                  {/* Add to Cart Button */}
                  <Button
                    className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/10 hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300"
                    onClick={() => handleAddToCart(product)}
                    disabled={isOutOfStock}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {isOutOfStock ? 'Esgotado' : 'Adicionar'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
