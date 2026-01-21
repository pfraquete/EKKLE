'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getSubscriptionInvoices,
  type SubscriptionInvoice,
} from '@/actions/subscriptions';

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('pt-BR');
}

function getStatusBadge(status: string) {
  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    paid: { label: 'Pago', variant: 'default' },
    pending: { label: 'Pendente', variant: 'outline' },
    failed: { label: 'Falhou', variant: 'destructive' },
    refunded: { label: 'Reembolsado', variant: 'secondary' },
    canceled: { label: 'Cancelado', variant: 'destructive' },
  };

  const config = statusConfig[status] || { label: status, variant: 'outline' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function getPaymentMethodLabel(method: string | null): string {
  if (!method) return '-';
  const labels: Record<string, string> = {
    credit_card: 'Cartão de Crédito',
    boleto: 'Boleto',
    pix: 'PIX',
  };
  return labels[method] || method;
}

export default function FaturasPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInvoices() {
      try {
        const data = await getSubscriptionInvoices();
        setInvoices(data);
      } catch (error) {
        console.error('Error loading invoices:', error);
      } finally {
        setLoading(false);
      }
    }
    loadInvoices();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push('/configuracoes/assinatura')}
        >
          ← Voltar para Assinatura
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Histórico de Faturas</h1>
        <p className="text-muted-foreground mt-2">
          Visualize todas as suas faturas e pagamentos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Faturas</CardTitle>
          <CardDescription>
            {invoices.length > 0
              ? `${invoices.length} fatura(s) encontrada(s)`
              : 'Nenhuma fatura encontrada'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Você ainda não possui faturas.</p>
              <p className="text-sm mt-2">
                As faturas aparecerão aqui após você assinar um plano.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Forma de Pagamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pago em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{formatDate(invoice.due_date || invoice.created_at)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(invoice.amount_cents)}
                    </TableCell>
                    <TableCell>{getPaymentMethodLabel(invoice.payment_method)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>{formatDate(invoice.paid_at)}</TableCell>
                    <TableCell className="text-right">
                      {invoice.boleto_url && invoice.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a
                            href={invoice.boleto_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Ver Boleto
                          </a>
                        </Button>
                      )}
                      {invoice.pix_qr_code && invoice.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(invoice.pix_qr_code!);
                            alert('Código PIX copiado!');
                          }}
                        >
                          Copiar PIX
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
