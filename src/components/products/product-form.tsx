'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProduct, updateProduct } from '@/actions/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FormError } from '@/components/ui/form-error';
import { Card } from '@/components/ui/card';
import { Loader2, DollarSign, Package, Tag, BarChart } from 'lucide-react';

interface ProductFormProps {
  product?: {
    id: string;
    name: string;
    description?: string;
    short_description?: string;
    category_id?: string;
    price_cents: number;
    compare_at_price_cents?: number;
    sku?: string;
    stock_quantity: number;
    track_inventory: boolean;
    allow_backorder: boolean;
    status: string;
    is_featured: boolean;
    meta_title?: string;
    meta_description?: string;
  } | null;
  categories: Array<{
    id: string;
    name: string;
  }>;
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    short_description: product?.short_description || '',
    category_id: product?.category_id || '',
    price: product ? (product.price_cents / 100).toFixed(2) : '',
    compare_at_price: product?.compare_at_price_cents
      ? (product.compare_at_price_cents / 100).toFixed(2)
      : '',
    sku: product?.sku || '',
    stock_quantity: product?.stock_quantity?.toString() || '0',
    track_inventory: product?.track_inventory ?? true,
    allow_backorder: product?.allow_backorder ?? false,
    status: product?.status || 'draft',
    is_featured: product?.is_featured ?? false,
    meta_title: product?.meta_title || '',
    meta_description: product?.meta_description || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Convert price to cents
      const priceCents = Math.round(parseFloat(formData.price || '0') * 100);
      const compareAtPriceCents = formData.compare_at_price
        ? Math.round(parseFloat(formData.compare_at_price) * 100)
        : null;

      const data = {
        name: formData.name,
        description: formData.description || null,
        short_description: formData.short_description || null,
        category_id: formData.category_id || null,
        price_cents: priceCents,
        compare_at_price_cents: compareAtPriceCents,
        sku: formData.sku || null,
        stock_quantity: parseInt(formData.stock_quantity),
        track_inventory: formData.track_inventory,
        allow_backorder: formData.allow_backorder,
        status: formData.status as 'draft' | 'active' | 'inactive',
        is_featured: formData.is_featured,
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
      };

      let result;
      if (product) {
        result = await updateProduct(product.id, data);
      } else {
        result = await createProduct(data);
      }

      if (!result.success) {
        setError(result.error || 'Erro ao salvar produto');
        setLoading(false);
        return;
      }

      // Success - redirect
      router.push('/dashboard/loja');
      router.refresh();
    } catch (err) {
      console.error('Form error:', err);
      setError('Erro ao processar formulário');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <FormError message={error} />}

      {/* Basic Info */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Tag className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Informações Básicas</h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Produto *</Label>
            <Input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Livro de Orações"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="short_description">Descrição Curta</Label>
            <Textarea
              id="short_description"
              value={formData.short_description}
              onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
              placeholder="Breve resumo do produto (1-2 linhas)"
              disabled={loading}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição Completa</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição detalhada do produto"
              disabled={loading}
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category_id">Categoria</Label>
            <Select
              id="category_id"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              disabled={loading}
            >
              <option value="">Sem categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {/* Pricing */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Preços</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Preço *</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">R$</span>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                disabled={loading}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="compare_at_price">Preço Anterior (Opcional)</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">R$</span>
              <Input
                id="compare_at_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.compare_at_price}
                onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })}
                placeholder="0.00"
                disabled={loading}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Será mostrado riscado para indicar desconto
            </p>
          </div>
        </div>
      </Card>

      {/* Inventory */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Estoque</h2>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU (Código)</Label>
              <Input
                id="sku"
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="Ex: LIVRO-001"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock_quantity">Quantidade em Estoque</Label>
              <Input
                id="stock_quantity"
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                placeholder="0"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="track_inventory"
              checked={formData.track_inventory}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, track_inventory: checked as boolean })
              }
              disabled={loading}
            />
            <Label htmlFor="track_inventory" className="cursor-pointer">
              Rastrear estoque (reduzir automaticamente ao vender)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="allow_backorder"
              checked={formData.allow_backorder}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, allow_backorder: checked as boolean })
              }
              disabled={loading}
            />
            <Label htmlFor="allow_backorder" className="cursor-pointer">
              Permitir venda sem estoque
            </Label>
          </div>
        </div>
      </Card>

      {/* Status */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Status e Visibilidade</h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              disabled={loading}
            >
              <option value="draft">Rascunho (não visível na loja)</option>
              <option value="active">Ativo (visível na loja)</option>
              <option value="inactive">Inativo (não visível)</option>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_featured"
              checked={formData.is_featured}
              onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked as boolean })}
              disabled={loading}
            />
            <Label htmlFor="is_featured" className="cursor-pointer">
              Produto em destaque (aparece na página inicial)
            </Label>
          </div>
        </div>
      </Card>

      {/* SEO (Optional) */}
      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">SEO (Opcional)</h2>
          <p className="text-sm text-muted-foreground">Otimize para mecanismos de busca</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meta_title">Título SEO</Label>
            <Input
              id="meta_title"
              type="text"
              value={formData.meta_title}
              onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
              placeholder="Título para Google (deixe vazio para usar o nome do produto)"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta_description">Descrição SEO</Label>
            <Textarea
              id="meta_description"
              value={formData.meta_description}
              onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
              placeholder="Descrição para Google (150-160 caracteres)"
              disabled={loading}
              rows={2}
            />
          </div>
        </div>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="min-w-[150px]">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>{product ? 'Atualizar Produto' : 'Criar Produto'}</>
          )}
        </Button>
      </div>
    </form>
  );
}
