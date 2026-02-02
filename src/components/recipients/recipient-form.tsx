'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createChurchRecipient, updateChurchRecipient } from '@/actions/recipients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormError } from '@/components/ui/form-error';
import { Loader2 } from 'lucide-react';

interface RecipientFormProps {
  recipient?: {
    name: string;
    email: string;
    document: string;
    bank_code: string;
    bank_name?: string;
    account_type: string;
    account_number: string;
    account_digit: string;
    branch_number: string;
    branch_digit?: string;
    holder_name: string;
    holder_document: string;
  } | null;
}

// Lista dos principais bancos brasileiros
const BANKS = [
  { code: '001', name: 'Banco do Brasil' },
  { code: '033', name: 'Santander' },
  { code: '104', name: 'Caixa Econômica Federal' },
  { code: '237', name: 'Bradesco' },
  { code: '341', name: 'Itaú' },
  { code: '077', name: 'Banco Inter' },
  { code: '260', name: 'Nu Pagamentos (Nubank)' },
  { code: '290', name: 'Pagseguro' },
  { code: '323', name: 'Mercado Pago' },
  { code: '336', name: 'Banco C6' },
  { code: '380', name: 'PicPay' },
  { code: '212', name: 'Banco Original' },
  { code: '655', name: 'Banco Votorantim' },
  { code: '041', name: 'Banrisul' },
  { code: '389', name: 'Banco Mercantil' },
  { code: '422', name: 'Banco Safra' },
  { code: '070', name: 'BRB - Banco de Brasília' },
  { code: '136', name: 'Unicred' },
  { code: '748', name: 'Sicredi' },
  { code: '756', name: 'Bancoob (Sicoob)' },
];

export function RecipientForm({ recipient }: RecipientFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: recipient?.name || '',
    email: recipient?.email || '',
    document: recipient?.document || '',
    bank_code: recipient?.bank_code || '',
    account_type: recipient?.account_type || 'checking',
    account_number: recipient?.account_number || '',
    account_digit: recipient?.account_digit || '',
    branch_number: recipient?.branch_number || '',
    branch_digit: recipient?.branch_digit || '',
    holder_name: recipient?.holder_name || '',
    holder_document: recipient?.holder_document || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (recipient) {
        // Update (only email and name can be updated)
        result = await updateChurchRecipient({
          name: formData.name,
          email: formData.email,
        });
      } else {
        // Create
        result = await createChurchRecipient({
          name: formData.name,
          email: formData.email,
          document: formData.document,
          bank_code: formData.bank_code,
          account_type: formData.account_type as 'checking' | 'savings',
          account_number: formData.account_number,
          account_digit: formData.account_digit,
          branch_number: formData.branch_number,
          branch_digit: formData.branch_digit,
          holder_name: formData.holder_name,
          holder_document: formData.holder_document,
        });
      }

      if (!result.success) {
        setError(result.error || 'Erro ao salvar recebedor');
        setLoading(false);
        return;
      }

      // Success - refresh page
      router.refresh();
    } catch (err) {
      console.error('Form error:', err);
      setError('Erro ao processar formulário');
      setLoading(false);
    }
  };

  const formatDocument = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      // CPF: 000.000.000-00
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      // CNPJ: 00.000.000/0000-00
      return numbers
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <FormError message={error} />}

      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Dados do Recebedor</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome / Razão Social *</Label>
            <Input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome da igreja ou representante"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@igreja.com"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="document">CPF/CNPJ *</Label>
            <Input
              id="document"
              type="text"
              required
              value={formatDocument(formData.document)}
              onChange={(e) => setFormData({ ...formData, document: e.target.value })}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              disabled={loading || !!recipient}
              maxLength={18}
            />
            {recipient && (
              <p className="text-xs text-muted-foreground">O documento não pode ser alterado</p>
            )}
          </div>

        </div>
      </div>

      {/* Bank Account Info - Only on create */}
      {!recipient && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Dados Bancários</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="bank_code">Banco *</Label>
              <select
                id="bank_code"
                required
                value={formData.bank_code}
                onChange={(e) => setFormData({ ...formData, bank_code: e.target.value })}
                disabled={loading}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-background [&>option]:text-foreground"
              >
                <option value="">Selecione o banco</option>
                {BANKS.map((bank) => (
                  <option key={bank.code} value={bank.code}>
                    {bank.code} - {bank.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_type">Tipo de Conta *</Label>
              <select
                id="account_type"
                required
                value={formData.account_type}
                onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                disabled={loading}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-background [&>option]:text-foreground"
              >
                <option value="checking">Corrente</option>
                <option value="savings">Poupança</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch_number">Agência *</Label>
              <div className="flex gap-2">
                <Input
                  id="branch_number"
                  type="text"
                  required
                  value={formData.branch_number}
                  onChange={(e) =>
                    setFormData({ ...formData, branch_number: e.target.value.replace(/\D/g, '') })
                  }
                  placeholder="0000"
                  disabled={loading}
                  maxLength={5}
                  className="flex-1"
                />
                <Input
                  type="text"
                  value={formData.branch_digit}
                  onChange={(e) =>
                    setFormData({ ...formData, branch_digit: e.target.value.replace(/\D/g, '') })
                  }
                  placeholder="Dígito"
                  disabled={loading}
                  maxLength={1}
                  className="w-20"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="account_number">Número da Conta *</Label>
              <div className="flex gap-2">
                <Input
                  id="account_number"
                  type="text"
                  required
                  value={formData.account_number}
                  onChange={(e) =>
                    setFormData({ ...formData, account_number: e.target.value.replace(/\D/g, '') })
                  }
                  placeholder="00000000"
                  disabled={loading}
                  maxLength={15}
                  className="flex-1"
                />
                <Input
                  type="text"
                  required
                  value={formData.account_digit}
                  onChange={(e) =>
                    setFormData({ ...formData, account_digit: e.target.value.replace(/\D/g, '') })
                  }
                  placeholder="Dígito *"
                  disabled={loading}
                  maxLength={2}
                  className="w-24"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Holder Info - Only on create */}
      {!recipient && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Dados do Titular da Conta</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="holder_name">Nome do Titular *</Label>
              <Input
                id="holder_name"
                type="text"
                required
                value={formData.holder_name}
                onChange={(e) => setFormData({ ...formData, holder_name: e.target.value })}
                placeholder="Nome completo do titular"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="holder_document">CPF/CNPJ do Titular *</Label>
              <Input
                id="holder_document"
                type="text"
                required
                value={formatDocument(formData.holder_document)}
                onChange={(e) => setFormData({ ...formData, holder_document: e.target.value })}
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                disabled={loading}
                maxLength={18}
              />
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" disabled={loading} className="min-w-[200px]">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {recipient ? 'Atualizando...' : 'Cadastrando...'}
            </>
          ) : (
            <>{recipient ? 'Atualizar Recebedor' : 'Cadastrar Recebedor'}</>
          )}
        </Button>
      </div>
    </form>
  );
}
