import { getProfile } from '@/actions/auth';
import { getCustomerOrders } from '@/actions/orders';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, ShoppingBag, ChevronRight } from 'lucide-react';
import { getOrderStatusLabel, getPaymentMethodLabel } from '@/lib/pagarme';

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total_cents: number;
  created_at: string;
}

export default async function OrdersListPage() {
  const profile = await getProfile();
  if (!profile) redirect('/login');

  const orders = await getCustomerOrders();

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      canceled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      canceled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Meus Pedidos</h1>
          </div>
          <p className="text-muted-foreground">Acompanhe seus pedidos realizados na loja</p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {orders.length === 0 ? (
          <Card className="p-12 text-center">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum pedido encontrado</h3>
            <p className="text-muted-foreground mb-6">
              Você ainda não realizou nenhuma compra na loja
            </p>
            <Link
              href="/membro/loja"
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-3 font-semibold hover:bg-primary/90 transition-colors"
            >
              Ir para a Loja
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order: Order) => (
              <Link key={order.id} href={`/membro/pedidos/${order.id}`}>
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    {/* Order Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">Pedido {order.order_number}</h3>
                        <Badge className={getStatusColor(order.status)}>
                          {getOrderStatusLabel(order.status)}
                        </Badge>
                        <Badge className={getPaymentStatusColor(order.payment_status)}>
                          {order.payment_status === 'paid'
                            ? 'Pago'
                            : order.payment_status === 'pending'
                            ? 'Aguardando Pagamento'
                            : order.payment_status === 'failed'
                            ? 'Pagamento Falhou'
                            : order.payment_status}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        {new Date(order.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {' • '}
                        {getPaymentMethodLabel(order.payment_method)}
                      </p>

                      {/* Items Preview */}
                      <div className="text-sm text-muted-foreground">
                        {order.items?.length === 1
                          ? '1 item'
                          : `${order.items?.length || 0} itens`}
                      </div>

                      {/* Total */}
                      <p className="text-xl font-bold text-primary mt-3">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(order.total_cents / 100)}
                      </p>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-6 h-6 text-muted-foreground" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
