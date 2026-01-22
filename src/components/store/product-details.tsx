'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Package, Check, Minus, Plus } from 'lucide-react';
import { useCart } from '@/context/cart-context';

interface ProductDetailsProps {
  product: {
    id: string;
    name: string;
    description?: string;
    short_description?: string;
    price_cents: number;
    compare_at_price_cents?: number;
    stock_quantity: number;
    track_inventory: boolean;
    allow_backorder: boolean;
    is_featured: boolean;
    sku?: string;
    category?: {
      name: string;
    } | null;
    images?: Array<{
      url: string;
      alt_text?: string;
      is_primary: boolean;
    }>;
  };
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const { addItem, items } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [justAdded, setJustAdded] = useState(false);

  const images = product.images || [];
  const displayImages = images.length > 0 ? images : [{ url: '', alt_text: product.name, is_primary: true }];

  const isOutOfStock =
    product.track_inventory && product.stock_quantity <= 0 && !product.allow_backorder;

  const cartItem = items.find((item) => item.product_id === product.id);
  const currentCartQuantity = cartItem?.quantity || 0;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        product_id: product.id,
        name: product.name,
        price_cents: product.price_cents,
        image_url: displayImages[selectedImage].url || undefined,
        stock_quantity: product.track_inventory ? product.stock_quantity : undefined,
      });
    }

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const maxQuantity = product.track_inventory
    ? product.stock_quantity - currentCartQuantity
    : 99;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Images */}
      <div className="space-y-4">
        {/* Main Image */}
        <Card className="overflow-hidden">
          <div className="relative aspect-square bg-gray-100">
            {displayImages[selectedImage].url ? (
              <Image
                src={displayImages[selectedImage].url}
                alt={displayImages[selectedImage].alt_text || product.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Package className="w-32 h-32 text-gray-400" />
              </div>
            )}
            {product.is_featured && (
              <Badge className="absolute top-4 left-4 bg-yellow-500">Destaque</Badge>
            )}
            {isOutOfStock && (
              <Badge className="absolute top-4 right-4 bg-red-500">Esgotado</Badge>
            )}
          </div>
        </Card>

        {/* Thumbnail Gallery */}
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {images.map((image, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`relative aspect-square bg-gray-100 rounded border-2 transition-all ${
                  selectedImage === idx
                    ? 'border-primary'
                    : 'border-transparent hover:border-gray-300'
                }`}
              >
                {image.url ? (
                  <Image
                    src={image.url}
                    alt={image.alt_text || product.name}
                    fill
                    className="object-cover rounded"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-6">
        {/* Header */}
        <div>
          {product.category && (
            <p className="text-sm text-muted-foreground mb-2">{product.category.name}</p>
          )}
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          {product.short_description && (
            <p className="text-muted-foreground text-lg">{product.short_description}</p>
          )}
        </div>

        {/* Price */}
        <Card className="p-6">
          <div>
            {product.compare_at_price_cents && product.compare_at_price_cents > product.price_cents && (
              <div className="flex items-center gap-2 mb-2">
                <p className="text-lg text-muted-foreground line-through">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(product.compare_at_price_cents / 100)}
                </p>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {Math.round(
                    ((product.compare_at_price_cents - product.price_cents) /
                      product.compare_at_price_cents) *
                      100
                  )}
                  % OFF
                </Badge>
              </div>
            )}
            <p className="text-4xl font-bold text-primary">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(product.price_cents / 100)}
            </p>
          </div>
        </Card>

        {/* Stock Info */}
        {product.track_inventory && (
          <div className="flex items-center gap-2 text-sm">
            {product.stock_quantity > 0 ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-green-600 font-medium">
                  {product.stock_quantity} {product.stock_quantity === 1 ? 'unidade' : 'unidades'}{' '}
                  disponível
                  {product.stock_quantity > 1 ? 'is' : ''}
                </span>
              </>
            ) : product.allow_backorder ? (
              <span className="text-orange-600 font-medium">
                Produto sob encomenda
              </span>
            ) : (
              <span className="text-red-600 font-medium">Fora de estoque</span>
            )}
          </div>
        )}

        {/* Quantity Selector & Add to Cart */}
        {!isOutOfStock && (
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Quantidade</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    disabled={quantity >= maxQuantity}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleAddToCart}
                disabled={maxQuantity <= 0}
              >
                {justAdded ? (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Adicionado ao Carrinho!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Adicionar ao Carrinho
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Description */}
        {product.description && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-3">Descrição</h2>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{product.description}</p>
            </div>
          </Card>
        )}

        {/* Additional Info */}
        {product.sku && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-3">Informações Adicionais</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <dt className="text-muted-foreground">SKU:</dt>
              <dd className="font-medium">{product.sku}</dd>
            </dl>
          </Card>
        )}
      </div>
    </div>
  );
}
