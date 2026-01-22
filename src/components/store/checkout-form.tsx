'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Profile } from '@/actions/auth';
import { createCheckoutOrder } from '@/actions/orders';
import { useCart } from '@/context/cart-context';
import { useChurchNavigation } from '@/hooks/use-church-navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormError } from '@/components/ui/form-error';
import {
  Loader2,
  CreditCard,
  QrCode,
  User,
  MapPin,
  Package,
  ShoppingBag,
} from 'lucide-react';

interface CheckoutFormProps {
  profile: Pick<Profile, 'id' | 'full_name' | 'email' | 'phone'>;
}

export function CheckoutForm({ profile }: CheckoutFormProps) {
  const { push } = useChurchNavigation();
  const { items, totalCents, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix'>('pix');

  const [customerData, setCustomerData] = useState({
    name: profile.full_name || '',
    email: profile.email || '',
    phone: profile.phone || '',
    document: '',
  });

  const [cardData, setCardData] = useState({
    number: '',
    holderName: '',
    expMonth: '',
    expYear: '',
    cvv: '',
    zipCode: '',
    line1: '',
    city: '',
    state: '',
  });

  if (items.length === 0) {
    return (
      <Card className="p-12 text-center">
        <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Carrinho Vazio</h3>
        <p className="text-muted-foreground mb-6">
          Adicione produtos ao carrinho antes de finalizar a compra
        </p>
        <Button onClick={() => push('/membro/loja')}>Ir para a Loja</Button>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await createCheckoutOrder({
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
        customer: customerData,
        payment_method: paymentMethod,
        card:
          paymentMethod === 'credit_card'
            ? {
                number: cardData.number,
                holderName: cardData.holderName,
                expMonth: parseInt(cardData.expMonth),
                expYear: parseInt(cardData.expYear),
                cvv: cardData.cvv,
                billingAddress: {
                  line1: cardData.line1,
                  zipCode: cardData.zipCode,
                  city: cardData.city,
                  state: cardData.state,
                },
              }
            : undefined,
      });

      if (!result.success) {
        setError(result.error || 'Erro ao processar pedido');
        setLoading(false);
        return;
      }

      // Success - clear cart and redirect
      clearCart();
      push(`/membro/pedidos/${result.order.id}`);
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Erro ao processar checkout');
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    return value
      .replace(/\s/g, '')
      .replace(/(\d{4})/g, '$1 ')
      .trim();
  };

  const formatDocument = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      return numbers
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d)/, '($1) $2-$3');
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d)/, '($1) $2-$3');
    }
  };

  const formatCEP = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2');
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column - Forms */}
      <div className="lg:col-span-2 space-y-6">
        {error && <FormError message={error} />}

        {/* Customer Info */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Dados do Cliente</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                required
                value={customerData.name}
                onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                required
                value={customerData.email}
                onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                required
                value={formatPhone(customerData.phone)}
                onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                placeholder="(11) 98765-4321"
                disabled={loading}
                maxLength={15}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document">CPF/CNPJ *</Label>
              <Input
                id="document"
                required
                value={formatDocument(customerData.document)}
                onChange={(e) => setCustomerData({ ...customerData, document: e.target.value })}
                placeholder="000.000.000-00"
                disabled={loading}
                maxLength={18}
              />
            </div>
          </div>
        </Card>

        {/* Payment Method Selection */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Forma de Pagamento</h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setPaymentMethod('pix')}
              className={`p-4 border-2 rounded-lg transition-all ${
                paymentMethod === 'pix'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              disabled={loading}
            >
              <QrCode className="w-8 h-8 mx-auto mb-2" />
              <p className="font-semibold">PIX</p>
              <p className="text-xs text-muted-foreground">Aprovação imediata</p>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('credit_card')}
              className={`p-4 border-2 rounded-lg transition-all ${
                paymentMethod === 'credit_card'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              disabled={loading}
            >
              <CreditCard className="w-8 h-8 mx-auto mb-2" />
              <p className="font-semibold">Cartão de Crédito</p>
              <p className="text-xs text-muted-foreground">Pagamento seguro</p>
            </button>
          </div>

          {/* Credit Card Form */}
          {paymentMethod === 'credit_card' && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Número do Cartão *</Label>
                <Input
                  id="cardNumber"
                  required
                  value={formatCardNumber(cardData.number)}
                  onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                  placeholder="1234 5678 9012 3456"
                  disabled={loading}
                  maxLength={19}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="holderName">Nome no Cartão *</Label>
                <Input
                  id="holderName"
                  required
                  value={cardData.holderName}
                  onChange={(e) =>
                    setCardData({ ...cardData, holderName: e.target.value.toUpperCase() })
                  }
                  placeholder="NOME COMO ESTÁ NO CARTÃO"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expMonth">Mês *</Label>
                  <Input
                    id="expMonth"
                    required
                    value={cardData.expMonth}
                    onChange={(e) =>
                      setCardData({ ...cardData, expMonth: e.target.value.replace(/\D/g, '') })
                    }
                    placeholder="MM"
                    disabled={loading}
                    maxLength={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expYear">Ano *</Label>
                  <Input
                    id="expYear"
                    required
                    value={cardData.expYear}
                    onChange={(e) =>
                      setCardData({ ...cardData, expYear: e.target.value.replace(/\D/g, '') })
                    }
                    placeholder="AAAA"
                    disabled={loading}
                    maxLength={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV *</Label>
                  <Input
                    id="cvv"
                    required
                    value={cardData.cvv}
                    onChange={(e) =>
                      setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '') })
                    }
                    placeholder="123"
                    disabled={loading}
                    maxLength={4}
                  />
                </div>
              </div>

              {/* Billing Address */}
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Endereço de Cobrança</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="line1">Endereço *</Label>
                    <Input
                      id="line1"
                      required
                      value={cardData.line1}
                      onChange={(e) => setCardData({ ...cardData, line1: e.target.value })}
                      placeholder="Rua, Número, Complemento"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">CEP *</Label>
                    <Input
                      id="zipCode"
                      required
                      value={formatCEP(cardData.zipCode)}
                      onChange={(e) => setCardData({ ...cardData, zipCode: e.target.value })}
                      placeholder="00000-000"
                      disabled={loading}
                      maxLength={9}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      required
                      value={cardData.city}
                      onChange={(e) => setCardData({ ...cardData, city: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">Estado *</Label>
                    <Input
                      id="state"
                      required
                      value={cardData.state.toUpperCase()}
                      onChange={(e) =>
                        setCardData({
                          ...cardData,
                          state: e.target.value.replace(/[^A-Z]/gi, ''),
                        })
                      }
                      placeholder="SP"
                      disabled={loading}
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PIX Instructions */}
          {paymentMethod === 'pix' && (
            <div className="pt-4 border-t">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Como funciona o PIX:</h3>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Finalize o pedido</li>
                  <li>Copie o código PIX ou escaneie o QR Code</li>
                  <li>Abra o app do seu banco e faça o pagamento</li>
                  <li>O pedido será confirmado automaticamente em alguns segundos</li>
                </ol>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Right Column - Order Summary */}
      <div className="lg:col-span-1">
        <Card className="p-6 sticky top-4">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Resumo do Pedido</h2>
          </div>

          {/* Items */}
          <div className="space-y-3 mb-4 pb-4 border-b">
            {items.map((item) => (
              <div key={item.product_id} className="flex gap-3">
                <div className="relative w-16 h-16 flex-shrink-0 bg-gray-100 rounded">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover rounded"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-2">{item.name}</p>
                  <p className="text-sm text-muted-foreground">Qtd: {item.quantity}</p>
                  <p className="text-sm font-semibold text-primary">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format((item.price_cents * item.quantity) / 100)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span className="text-primary">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(totalCents / 100)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Pagamento dividido: 99% para a igreja, 1% para a plataforma
            </p>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processando...
              </>
            ) : (
              <>Finalizar Compra</>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Pagamento seguro processado pelo Pagar.me
          </p>
        </Card>
      </div>
    </form>
  );
}
