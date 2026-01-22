import { getProfile } from '@/actions/auth';
import { getOrder } from '@/actions/orders';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Package,
  ChevronRight,
  CheckCircle,
  Clock,
  XCircle,
  Copy,
  ArrowLeft,
} from 'lucide-react';
import { getOrderStatusLabel, getPaymentMethodLabel } from '@/lib/pagarme';

export default async function OrderDetailsPage({ params }: { params: { id: string } }) {
  const profile = await getProfile();
  if (!profile) redirect('/login');

  const order = await getOrder(params.id);
  if (!order) notFound();

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

  const payment = order.payments?.[0];
  const isPending = order.payment_status === 'pending';
  const isPaid = order.payment_status === 'paid';
  const isFailed = order.payment_status === 'failed';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/membro/pedidos">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Meus Pedidos
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Status Banner */}
        {isPaid && (
          <Card className="p-6 bg-green-50 border-green-200 mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">Pedido Confirmado!</h3>
                <p className="text-sm text-green-700 mt-1">
                  Seu pagamento foi aprovado e o pedido está sendo preparado.
                </p>
              </div>
            </div>
          </Card>
        )}

        {isPending && (
          <Card className="p-6 bg-yellow-50 border-yellow-200 mb-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-yellow-900">Aguardando Pagamento</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Complete o pagamento para confirmar seu pedido.
                </p>
              </div>
            </div>
          </Card>
        )}

        {isFailed && (
          <Card className="p-6 bg-red-50 border-red-200 mb-6">
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Pagamento Falhou</h3>
                <p className="text-sm text-red-700 mt-1">
                  Houve um problema com o pagamento. Tente novamente.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* PIX QR Code */}
        {isPending && order.payment_method === 'pix' && payment?.pix_qr_code && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Pagar com PIX</h2>

            <div className="space-y-4">
              {payment.pix_qr_code_url && (
                <div className="flex justify-center">
                  <Image
                    src={payment.pix_qr_code_url}
                    alt="QR Code PIX"
                    width={250}
                    height={250}
                    className="border-4 border-gray-200 rounded"
                  />
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Ou copie o código PIX abaixo:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={payment.pix_qr_code}
                    className="flex-1 px-3 py-2 border rounded text-sm font-mono"
                  />
                  <Button
                    onClick={() => navigator.clipboard.writeText(payment.pix_qr_code || '')}
                    variant="outline"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Como pagar:</h3>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Abra o app do seu banco</li>
                  <li>Escolha pagar com PIX</li>
                  <li>Escaneie o QR Code ou cole o código copiado</li>
                  <li>Confirme o pagamento</li>
                  <li>Pronto! Seu pedido será confirmado automaticamente</li>
                </ol>
              </div>
            </div>
          </Card>
        )}

        {/* Order Details */}
        <Card className="p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Pedido {order.order_number}</h2>
              <p className="text-sm text-muted-foreground">
                {new Date(order.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <Badge className={getStatusColor(order.status)}>
              {getOrderStatusLabel(order.status)}
            </Badge>
          </div>

          {/* Customer Info */}
          <div className="mb-6 pb-6 border-b">
            <h3 className="font-semibold mb-3">Informações do Cliente</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Nome:</span>
                <p className="font-medium">{order.customer_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <p className="font-medium">{order.customer_email}</p>
              </div>
              {order.customer_phone && (
                <div>
                  <span className="text-muted-foreground">Telefone:</span>
                  <p className="font-medium">{order.customer_phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="mb-6 pb-6 border-b">
            <h3 className="font-semibold mb-3">Informações de Pagamento</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Forma de Pagamento:</span>
                <p className="font-medium">{getPaymentMethodLabel(order.payment_method)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status do Pagamento:</span>
                <p className="font-medium">
                  {order.payment_status === 'paid'
                    ? 'Pago'
                    : order.payment_status === 'pending'
                    ? 'Pendente'
                    : order.payment_status === 'failed'
                    ? 'Falhou'
                    : order.payment_status}
                </p>
              </div>
              {order.paid_at && (
                <div>
                  <span className="text-muted-foreground">Pago em:</span>
                  <p className="font-medium">
                    {new Date(order.paid_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="font-semibold mb-3">Itens do Pedido</h3>
            <div className="space-y-3">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Quantidade: {item.quantity} x{' '}
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(item.unit_price_cents / 100)}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(item.total_cents / 100)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Order Summary */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Resumo do Pedido</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(order.subtotal_cents / 100)}
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t text-lg font-bold">
              <span>Total:</span>
              <span className="text-primary">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(order.total_cents / 100)}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
