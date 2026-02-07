'use client'

import { useState, useTransition, useEffect } from 'react'
import { X, CreditCard, QrCode, Loader2, Check, Copy, AlertCircle } from 'lucide-react'
import { createCellOffering, checkOfferingStatus } from '@/actions/cell-offerings'
import Image from 'next/image'

interface Profile {
    id: string
    full_name: string
    email: string | null
    phone: string | null
}

interface CellOfferingModalProps {
    profile: Profile
    onClose: () => void
}

type Step = 'amount' | 'method' | 'payment' | 'success'

export function CellOfferingModal({ profile, onClose }: CellOfferingModalProps) {
    const [step, setStep] = useState<Step>('amount')
    const [amount, setAmount] = useState('')
    const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix')
    const [document, setDocument] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    // PIX data
    const [pixQrCode, setPixQrCode] = useState<string | null>(null)
    const [pixQrCodeUrl, setPixQrCodeUrl] = useState<string | null>(null)
    const [offeringId, setOfferingId] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    // Card data
    const [cardNumber, setCardNumber] = useState('')
    const [cardHolder, setCardHolder] = useState('')
    const [cardExpiry, setCardExpiry] = useState('')
    const [cardCvv, setCardCvv] = useState('')
    const [billingZip, setBillingZip] = useState('')
    const [billingCity, setBillingCity] = useState('')
    const [billingState, setBillingState] = useState('')
    const [billingAddress, setBillingAddress] = useState('')

    const amountCents = Math.round(parseFloat(amount) * 100) || 0
    const platformFee = Math.floor(amountCents * 0.01)
    const cellAmount = amountCents - platformFee

    // Poll for PIX payment status
    useEffect(() => {
        if (step !== 'payment' || paymentMethod !== 'pix' || !offeringId) return

        const interval = setInterval(async () => {
            const result = await checkOfferingStatus(offeringId)
            if (result.success && result.data?.status === 'PAID') {
                setStep('success')
            }
        }, 3000)

        return () => clearInterval(interval)
    }, [step, paymentMethod, offeringId])

    const handleCopyPix = () => {
        if (pixQrCode) {
            navigator.clipboard.writeText(pixQrCode)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleSubmitAmount = (e: React.FormEvent) => {
        e.preventDefault()
        if (amountCents < 100) {
            setError('Valor mínimo é R$ 1,00')
            return
        }
        setError(null)
        setStep('method')
    }

    const handleSubmitPayment = async () => {
        setError(null)

        if (!document || document.replace(/\D/g, '').length < 11) {
            setError('CPF/CNPJ inválido')
            return
        }

        startTransition(async () => {
            try {
                const input: any = {
                    amount_cents: amountCents,
                    payment_method: paymentMethod,
                    customer: {
                        document: document.replace(/\D/g, ''),
                    },
                }

                if (paymentMethod === 'credit_card') {
                    const [expMonth, expYear] = cardExpiry.split('/').map(Number)
                    input.card = {
                        number: cardNumber.replace(/\s/g, ''),
                        holderName: cardHolder,
                        expMonth,
                        expYear: expYear < 100 ? 2000 + expYear : expYear,
                        cvv: cardCvv,
                        billingAddress: {
                            line1: billingAddress,
                            zipCode: billingZip.replace(/\D/g, ''),
                            city: billingCity,
                            state: billingState.toUpperCase(),
                        },
                    }
                }

                const result = await createCellOffering(input)

                if (!result.success) {
                    setError(result.error || 'Erro ao processar pagamento')
                    return
                }

                if (paymentMethod === 'pix') {
                    setPixQrCode(result.data?.pix_qr_code || null)
                    setPixQrCodeUrl(result.data?.pix_qr_code_url || null)
                    setOfferingId(result.data?.id || null)
                    setStep('payment')
                } else {
                    // Credit card - check if paid immediately
                    if (result.data?.status === 'PAID') {
                        setStep('success')
                    } else {
                        setError('Pagamento não foi aprovado')
                    }
                }
            } catch (err) {
                console.error('Payment error:', err)
                setError('Erro ao processar pagamento')
            }
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-card flex items-center justify-between p-6 border-b border-border z-10">
                    <h2 className="text-xl font-black text-foreground">Fazer Oferta</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-muted transition-colors"
                        aria-label="Fechar modal"
                    >
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Step: Amount */}
                {step === 'amount' && (
                    <form onSubmit={handleSubmitAmount} className="p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-foreground mb-2">
                                Valor da Oferta
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                                    R$
                                </span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="1"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0,00"
                                    className="w-full h-14 pl-12 pr-4 rounded-xl bg-background border border-border text-2xl font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        {amountCents > 0 && (
                            <div className="p-4 bg-muted/30 rounded-xl space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Taxa (1%)</span>
                                    <span className="text-muted-foreground">R$ {(platformFee / 100).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold">
                                    <span className="text-foreground">Para a Célula</span>
                                    <span className="text-primary">R$ {(cellAmount / 100).toFixed(2)}</span>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            Continuar
                        </button>
                    </form>
                )}

                {/* Step: Method */}
                {step === 'method' && (
                    <div className="p-6 space-y-5">
                        <div className="text-center mb-6">
                            <p className="text-2xl font-black text-foreground">
                                R$ {(amountCents / 100).toFixed(2)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Valor da oferta
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-foreground mb-3">
                                Forma de Pagamento
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('pix')}
                                    className={`p-4 rounded-xl border-2 transition-all ${
                                        paymentMethod === 'pix'
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:border-primary/50'
                                    }`}
                                >
                                    <QrCode className={`w-8 h-8 mx-auto mb-2 ${paymentMethod === 'pix' ? 'text-primary' : 'text-muted-foreground'}`} />
                                    <p className="font-bold text-foreground">PIX</p>
                                    <p className="text-xs text-muted-foreground">Instantâneo</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('credit_card')}
                                    className={`p-4 rounded-xl border-2 transition-all ${
                                        paymentMethod === 'credit_card'
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:border-primary/50'
                                    }`}
                                >
                                    <CreditCard className={`w-8 h-8 mx-auto mb-2 ${paymentMethod === 'credit_card' ? 'text-primary' : 'text-muted-foreground'}`} />
                                    <p className="font-bold text-foreground">Cartão</p>
                                    <p className="text-xs text-muted-foreground">Crédito</p>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-foreground mb-2">
                                CPF/CNPJ
                            </label>
                            <input
                                type="text"
                                value={document}
                                onChange={(e) => setDocument(e.target.value)}
                                placeholder="000.000.000-00"
                                className="w-full h-12 px-4 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                required
                            />
                        </div>

                        {/* Card Form */}
                        {paymentMethod === 'credit_card' && (
                            <div className="space-y-4 pt-4 border-t border-border">
                                <div>
                                    <label className="block text-sm font-bold text-foreground mb-2">
                                        Número do Cartão
                                    </label>
                                    <input
                                        type="text"
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(e.target.value)}
                                        placeholder="0000 0000 0000 0000"
                                        className="w-full h-12 px-4 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-foreground mb-2">
                                        Nome no Cartão
                                    </label>
                                    <input
                                        type="text"
                                        value={cardHolder}
                                        onChange={(e) => setCardHolder(e.target.value)}
                                        placeholder="NOME COMO NO CARTÃO"
                                        className="w-full h-12 px-4 rounded-xl bg-background border border-border text-foreground uppercase focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-bold text-foreground mb-2">
                                            Validade
                                        </label>
                                        <input
                                            type="text"
                                            value={cardExpiry}
                                            onChange={(e) => setCardExpiry(e.target.value)}
                                            placeholder="MM/AA"
                                            className="w-full h-12 px-4 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-foreground mb-2">
                                            CVV
                                        </label>
                                        <input
                                            type="text"
                                            value={cardCvv}
                                            onChange={(e) => setCardCvv(e.target.value)}
                                            placeholder="123"
                                            className="w-full h-12 px-4 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-border">
                                    <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">
                                        Endereço de Cobrança
                                    </p>
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={billingAddress}
                                            onChange={(e) => setBillingAddress(e.target.value)}
                                            placeholder="Endereço"
                                            className="w-full h-12 px-4 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <input
                                                type="text"
                                                value={billingZip}
                                                onChange={(e) => setBillingZip(e.target.value)}
                                                placeholder="CEP"
                                                className="w-full h-12 px-4 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            />
                                            <input
                                                type="text"
                                                value={billingCity}
                                                onChange={(e) => setBillingCity(e.target.value)}
                                                placeholder="Cidade"
                                                className="w-full h-12 px-4 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            />
                                            <input
                                                type="text"
                                                value={billingState}
                                                onChange={(e) => setBillingState(e.target.value)}
                                                placeholder="UF"
                                                maxLength={2}
                                                className="w-full h-12 px-4 rounded-xl bg-background border border-border text-foreground uppercase focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setStep('amount')}
                                className="flex-1 h-12 bg-muted text-foreground rounded-xl font-bold hover:bg-muted/80 transition-colors"
                            >
                                Voltar
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmitPayment}
                                disabled={isPending}
                                className="flex-1 h-12 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Processando...
                                    </>
                                ) : (
                                    'Pagar'
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step: PIX Payment */}
                {step === 'payment' && paymentMethod === 'pix' && (
                    <div className="p-6 space-y-5">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-1">Valor a pagar</p>
                            <p className="text-2xl font-black text-foreground">
                                R$ {(amountCents / 100).toFixed(2)}
                            </p>
                        </div>

                        {pixQrCodeUrl && (
                            <div className="bg-white p-4 rounded-xl mx-auto w-fit">
                                <Image
                                    src={pixQrCodeUrl}
                                    alt="QR Code PIX"
                                    width={200}
                                    height={200}
                                    className="mx-auto"
                                    unoptimized
                                />
                            </div>
                        )}

                        <div className="text-center space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Escaneie o QR Code ou copie o código
                            </p>
                            <button
                                onClick={handleCopyPix}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-105 active:scale-95 transition-all"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Copiado!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        Copiar código PIX
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Aguardando pagamento...
                        </div>
                    </div>
                )}

                {/* Step: Success */}
                {step === 'success' && (
                    <div className="p-8 text-center">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Check className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h3 className="text-2xl font-black text-foreground mb-2">
                            Oferta Recebida!
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            Obrigado por contribuir com a célula
                        </p>
                        <button
                            onClick={() => {
                                onClose()
                                window.location.reload()
                            }}
                            className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            Fechar
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
