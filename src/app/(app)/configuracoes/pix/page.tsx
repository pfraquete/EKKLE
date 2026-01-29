import { getProfile } from '@/actions/auth'
import { getChurchPix } from '@/actions/church-pix'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, QrCode, Info } from 'lucide-react'
import { PixConfigForm } from '@/components/pix/pix-config-form'

export default async function ConfiguracoesPixPage() {
    const profile = await getProfile()

    if (!profile || profile.role !== 'PASTOR') {
        redirect('/dashboard')
    }

    const pixResult = await getChurchPix()
    const pixData = pixResult.success ? pixResult.data : null

    return (
        <div className="space-y-8 p-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <Link
                    href="/configuracoes"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium mb-2 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">Configuração PIX</h1>
                <p className="text-muted-foreground">
                    Configure a chave PIX para receber dízimos e ofertas
                </p>
            </div>

            {/* Info Card */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5">
                <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                        <Info className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground mb-1">Como funciona</h3>
                        <p className="text-sm text-muted-foreground">
                            A chave PIX configurada será exibida na página de dízimos para que os membros
                            possam fazer transferências diretamente para a igreja. O QR Code é gerado
                            automaticamente para facilitar o pagamento.
                        </p>
                    </div>
                </div>
            </div>

            {/* Config Form */}
            <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <QrCode className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground">Chave PIX da Igreja</h3>
                            <p className="text-sm text-muted-foreground">
                                {pixData?.pix_key ? 'Chave configurada' : 'Nenhuma chave configurada'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="p-6">
                    <PixConfigForm
                        initialPixKey={pixData?.pix_key || ''}
                        initialPixKeyType={pixData?.pix_key_type || 'cpf'}
                    />
                </div>
            </div>
        </div>
    )
}
