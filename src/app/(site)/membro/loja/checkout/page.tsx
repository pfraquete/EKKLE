import { getProfile } from '@/actions/auth';
import { redirect } from 'next/navigation';
import { CheckoutForm } from '@/components/store/checkout-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function CheckoutPage() {
  const profile = await getProfile();
  if (!profile) redirect('/login');

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
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>
        <CheckoutForm profile={profile} />
      </div>
    </div>
  );
}
