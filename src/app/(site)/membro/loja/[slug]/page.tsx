import { getProfile } from '@/actions/auth';
import { getProductBySlug } from '@/actions/products';
import { redirect, notFound } from 'next/navigation';
import { ProductDetails } from '@/components/store/product-details';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function ProductDetailsPage({ params }: { params: { slug: string } }) {
  const profile = await getProfile();
  if (!profile) redirect('/login');

  const product = await getProductBySlug(params.slug);
  if (!product || product.status !== 'active') notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/membro/loja">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para a Loja
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <ProductDetails product={product} />
      </div>
    </div>
  );
}
