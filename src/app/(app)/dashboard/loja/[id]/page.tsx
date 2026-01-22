import { getProfile } from '@/actions/auth';
import { getProduct, getProductCategories } from '@/actions/products';
import { redirect, notFound } from 'next/navigation';
import { ProductForm } from '@/components/products/product-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getProfile();
  if (!profile) redirect('/login');
  if (profile.role !== 'PASTOR') redirect('/dashboard');

  const product = await getProduct(id);
  if (!product) notFound();

  const categories = await getProductCategories();

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/loja">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editar Produto</h1>
          <p className="text-muted-foreground mt-1">{product.name}</p>
        </div>
      </div>

      {/* Form */}
      <ProductForm product={product} categories={categories} />
    </div>
  );
}
