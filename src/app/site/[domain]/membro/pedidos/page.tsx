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
  items?: Array<{ id: string }>;
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
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700">
      {/* Header */}
      <div>
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">Meus Pedidos</h1>
            <p className="text-muted-foreground font-medium">Acompanhe suas aquisições e itens na nossa loja</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {orders.length === 0 ? (
          <div className="py-24 text-center bg-card border border-dashed border-border rounded-[3rem]">
            <ShoppingBag className="w-20 h-20 mx-auto text-muted-foreground/10 mb-6" />
            <h3 className="text-2xl font-black text-foreground mb-2">Nenhum pedido ainda</h3>
            <p className="text-muted-foreground mb-10 max-w-sm mx-auto font-medium">
              Você ainda não realizou nenhuma compra em nossa loja virtual.
            </p>
            <Link
              href="/membro/loja"
              className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-10 py-4 font-black uppercase tracking-widest text-xs hover:scale-105 transition-all duration-300 shadow-xl shadow-primary/20"
            >
              Explorar Loja
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map((order: Order) => (
              <Link key={order.id} href={`/membro/pedidos/${order.id}`} className="group">
                <div className="bg-card border border-border/50 p-8 rounded-[2rem] group-hover:shadow-2xl group-hover:border-primary/20 transition-all duration-500 relative overflow-hidden">
                  <div className="flex items-start justify-between relative z-10">
                    {/* Order Info */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-6">
                        <h3 className="font-black text-xl text-foreground">Pedido #{order.order_number}</h3>
                        <div className="flex gap-2">
                          <Badge className={`${getStatusColor(order.status)} border-none font-black uppercase tracking-[0.05em] text-[10px] px-3 py-1 rounded-full`}>
                            {getOrderStatusLabel(order.status)}
                          </Badge>
                          <Badge className={`${getPaymentStatusColor(order.payment_status)} border-none font-black uppercase tracking-[0.05em] text-[10px] px-3 py-1 rounded-full`}>
                            {order.payment_status === 'paid'
                              ? 'Pago'
                              : order.payment_status === 'pending'
                                ? 'Aguardando'
                                : order.payment_status === 'failed'
                                  ? 'Falhou'
                                  : order.payment_status}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                        <div className="space-y-2">
                          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                            <ChevronRight className="w-3.5 h-3.5 text-primary" />
                            {new Date(order.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                            })}
                            {' às '}
                            {new Date(order.created_at).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                            <ChevronRight className="w-3.5 h-3.5 text-primary" />
                            {getPaymentMethodLabel(order.payment_method)}
                          </p>
                          <div className="text-xs font-black uppercase tracking-widest text-primary pt-2">
                            {order.items?.length === 1
                              ? '1 item no pacote'
                              : `${order.items?.length || 0} itens no pacote`}
                          </div>
                        </div>

                        <div className="md:text-right">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Total Investido</p>
                          <p className="text-3xl font-black text-foreground">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(order.total_cents / 100)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="w-12 h-12 bg-muted/50 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 ml-6 self-center">
                      <ChevronRight className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Decorative Gradient */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
