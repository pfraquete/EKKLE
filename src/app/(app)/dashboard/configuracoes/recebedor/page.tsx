import { getProfile } from '@/actions/auth';
import { getChurchRecipient } from '@/actions/recipients';
import { redirect } from 'next/navigation';
import { RecipientForm } from '@/components/recipients/recipient-form';
import { Card } from '@/components/ui/card';
import { Banknote, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default async function RecipientConfigPage() {
  const profile = await getProfile();
  if (!profile) redirect('/login');
  if (profile.role !== 'PASTOR') redirect('/dashboard');

  const { recipient } = await getChurchRecipient();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Configuração de Recebedor</h1>
        <p className="text-muted-foreground mt-2">
          Configure a conta bancária para receber os pagamentos da loja virtual
        </p>
      </div>

      {/* Payment Split Info */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900">Como funciona o pagamento</h3>
            <p className="text-sm text-blue-700 mt-1">
              Todos os pagamentos da loja são divididos automaticamente: <strong>99% para a igreja</strong> e{' '}
              <strong>1% para a plataforma EKKLE</strong>. Os valores são transferidos diretamente para a conta
              bancária cadastrada.
            </p>
          </div>
        </div>
      </Card>

      {/* Status Card */}
      {recipient && recipient.status === 'active' ? (
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-900">Recebedor Configurado</h3>
              <p className="text-sm text-green-700 mt-1">
                Sua igreja está pronta para receber pagamentos. Os valores serão transferidos para a conta
                cadastrada automaticamente.
              </p>

              {/* Bank Account Details */}
              <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-3">Dados Bancários</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Banco:</span>
                    <p className="font-medium text-gray-900">
                      {recipient.bank_code}
                      {recipient.bank_name && ` - ${recipient.bank_name}`}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Agência:</span>
                    <p className="font-medium text-gray-900">
                      {recipient.branch_number}
                      {recipient.branch_digit && `-${recipient.branch_digit}`}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Conta:</span>
                    <p className="font-medium text-gray-900">
                      {recipient.account_number}-{recipient.account_digit} (
                      {recipient.account_type === 'checking' ? 'Corrente' : 'Poupança'})
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Titular:</span>
                    <p className="font-medium text-gray-900">{recipient.holder_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Transferência:</span>
                    <p className="font-medium text-gray-900">
                      {recipient.transfer_interval === 'daily'
                        ? 'Diária'
                        : recipient.transfer_interval === 'weekly'
                        ? 'Semanal'
                        : 'Mensal'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-900">Configuração Necessária</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Para receber pagamentos da loja, você precisa cadastrar uma conta bancária. Preencha o formulário
                abaixo com os dados da conta que receberá os pagamentos.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Form Card */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Banknote className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold">
            {recipient ? 'Atualizar Dados Bancários' : 'Cadastrar Conta Bancária'}
          </h2>
        </div>

        <RecipientForm recipient={recipient} />
      </Card>

      {/* Important Notes */}
      <Card className="p-6 bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-3">Informações Importantes</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>
              Os dados bancários são armazenados de forma segura pelo gateway de pagamento Pagar.me, em
              conformidade com as normas do Banco Central.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>
              Após configurar o recebedor, os dados bancários não poderão ser alterados. Para mudar de conta, será
              necessário criar um novo recebedor.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>
              O CPF/CNPJ do titular da conta deve ser o mesmo cadastrado na igreja ou de um representante legal.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>
              As transferências são processadas automaticamente de acordo com o intervalo escolhido (diário,
              semanal ou mensal).
            </span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
