'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { deleteProduct, updateProduct } from '@/actions/products';
import { Edit, Trash2, Eye, EyeOff, Package } from 'lucide-react';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price_cents: number;
    stock_quantity: number;
    status: string;
    is_featured: boolean;
    track_inventory: boolean;
    sales_count: number;
    images?: Array<{
      url: string;
      is_primary: boolean;
    }>;
    category?: {
      name: string;
    } | null;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const primaryImage = product.images?.find((img) => img.is_primary);
  const imageUrl = primaryImage?.url || product.images?.[0]?.url;

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    draft: 'bg-gray-100 text-gray-800',
    inactive: 'bg-red-100 text-red-800',
    out_of_stock: 'bg-orange-100 text-orange-800',
  };

  const statusLabels = {
    active: 'Ativo',
    draft: 'Rascunho',
    inactive: 'Inativo',
    out_of_stock: 'Sem Estoque',
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    setLoading(true);
    const result = await deleteProduct(product.id);

    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || 'Erro ao excluir produto');
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    setLoading(true);
    const newStatus = product.status === 'active' ? 'inactive' : 'active';

    const result = await updateProduct(product.id, { status: newStatus as 'active' | 'inactive' | 'draft' });

    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || 'Erro ao atualizar status');
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <Link href={`/dashboard/loja/${product.id}`}>
        <div className="relative h-48 bg-gray-100">
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
          <Badge className={`absolute top-2 right-2 ${statusColors[product.status as keyof typeof statusColors]}`}>
            {statusLabels[product.status as keyof typeof statusLabels]}
          </Badge>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link href={`/dashboard/loja/${product.id}`}>
          <h3 className="font-semibold text-lg mb-1 hover:text-primary line-clamp-2">{product.name}</h3>
        </Link>

        {product.category && (
          <p className="text-xs text-muted-foreground mb-2">{product.category.name}</p>
        )}

        {/* Price */}
        <p className="text-2xl font-bold text-primary mb-3">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(product.price_cents / 100)}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <span>
            {product.track_inventory ? `Estoque: ${product.stock_quantity}` : 'Estoque não rastreado'}
          </span>
          <span>Vendas: {product.sales_count}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/loja/${product.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleStatus}
            disabled={loading || product.status === 'out_of_stock'}
            title={product.status === 'active' ? 'Desativar' : 'Ativar'}
          >
            {product.status === 'active' ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={loading}
            className="text-red-600 hover:text-red-700"
            title="Excluir"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
