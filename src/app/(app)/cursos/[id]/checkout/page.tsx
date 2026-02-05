'use client';

import { useState, useEffect, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  QrCode, 
  Banknote, 
  GraduationCap,
  ArrowLeft,
  Loader2,
  Check,
  Copy,
  Clock,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { createCoursePayment, checkCoursePaymentStatus, getCoursePayment } from '@/actions/course-payments';

interface Course {
  id: string;
  title: string;
  description: string;
  price_cents: number;
  is_paid: boolean;
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(cents / 100);
}

function formatCPF(value: string) {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 11) {
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

function formatPhone(value: string) {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}

export default function CourseCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | 'cash'>('pix');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    document: '',
    phone: '',
    cardNumber: '',
    cardHolder: '',
    cardExpMonth: '',
    cardExpYear: '',
    cardCvv: ''
  });

  // PIX state
  const [pixData, setPixData] = useState<{
    qr_code: string;
    qr_code_url?: string;
    order_id: string;
    expires_at?: string;
  } | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);

  // Cash payment state
  const [cashPaymentSuccess, setCashPaymentSuccess] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    async function loadCourse() {
      try {
        const response = await fetch(`/api/courses/${courseId}`);
        if (response.ok) {
          const data = await response.json();
          setCourse(data);
        } else {
          toast.error('Curso não encontrado');
          router.push('/cursos');
        }
      } catch (error) {
        console.error('Error loading course:', error);
        toast.error('Erro ao carregar curso');
      } finally {
        setLoading(false);
      }
    }
    loadCourse();
  }, [courseId, router]);

  // Poll for PIX payment
  useEffect(() => {
    if (!pixData?.order_id) return;

    const interval = setInterval(async () => {
      setCheckingPayment(true);
      const result = await checkCoursePaymentStatus(pixData.order_id);
      setCheckingPayment(false);

      if (result.paid) {
        toast.success('Pagamento confirmado! Você já pode acessar o curso.');
        router.push(`/cursos/${courseId}`);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [pixData?.order_id, courseId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.document) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    startTransition(async () => {
      try {
        const input: any = {
          course_id: courseId,
          payment_method: paymentMethod,
          customer: {
            name: formData.name,
            email: formData.email,
            document: formData.document.replace(/\D/g, ''),
            phone: formData.phone.replace(/\D/g, '')
          }
        };

        if (paymentMethod === 'credit_card') {
          input.card = {
            number: formData.cardNumber.replace(/\s/g, ''),
            holder_name: formData.cardHolder,
            exp_month: parseInt(formData.cardExpMonth),
            exp_year: parseInt(formData.cardExpYear),
            cvv: formData.cardCvv
          };
        }

        const result = await createCoursePayment(input);

        if (!result.success) {
          toast.error(result.error || 'Erro ao processar pagamento');
          return;
        }

        if (result.paid) {
          toast.success('Pagamento confirmado! Você já pode acessar o curso.');
          router.push(`/cursos/${courseId}`);
          return;
        }

        if (paymentMethod === 'pix' && result.pix_qr_code) {
          setPixData({
            qr_code: result.pix_qr_code,
            qr_code_url: result.pix_qr_code_url,
            order_id: result.order_id,
            expires_at: result.pix_expires_at
          });
          toast.success('QR Code gerado! Escaneie para pagar.');
        }

        if (paymentMethod === 'cash') {
          setCashPaymentSuccess(true);
          setExpiresAt(result.expires_at ?? null);
          toast.success(result.message);
        }
      } catch (error) {
        console.error('Payment error:', error);
        toast.error('Erro ao processar pagamento');
      }
    });
  };

  const copyPixCode = () => {
    if (pixData?.qr_code) {
      navigator.clipboard.writeText(pixData.qr_code);
      toast.success('Código PIX copiado!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!course) {
    return null;
  }

  // Show PIX QR Code
  if (pixData) {
    return (
      <div className="container max-w-lg mx-auto py-8 space-y-6">
        <Button variant="ghost" onClick={() => setPixData(null)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Pagamento via PIX</CardTitle>
            <CardDescription>
              Escaneie o QR Code ou copie o código para pagar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {pixData.qr_code_url && (
              <div className="flex justify-center">
                <img 
                  src={pixData.qr_code_url} 
                  alt="QR Code PIX" 
                  className="w-48 h-48"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Código Copia e Cola</Label>
              <div className="flex gap-2">
                <Input 
                  value={pixData.qr_code} 
                  readOnly 
                  className="font-mono text-xs"
                />
                <Button onClick={copyPixCode} variant="outline">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Valor a pagar</p>
              <p className="text-2xl font-bold">{formatCurrency(course.price_cents)}</p>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              {checkingPayment ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verificando pagamento...
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4" />
                  Aguardando pagamento...
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show cash payment success
  if (cashPaymentSuccess) {
    return (
      <div className="container max-w-lg mx-auto py-8 space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <CardTitle>Inscrição Registrada!</CardTitle>
            <CardDescription>
              Aguardando confirmação do pagamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Próximos passos:</p>
                  <ol className="text-sm text-amber-700 mt-2 space-y-1 list-decimal list-inside">
                    <li>Compareça à igreja para efetuar o pagamento</li>
                    <li>O valor é de <strong>{formatCurrency(course.price_cents)}</strong></li>
                    <li>Após o pagamento, a igreja confirmará sua inscrição</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Prazo para pagamento</p>
              <p className="font-bold text-lg">72 horas</p>
              {expiresAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Até {new Date(expiresAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </div>

            <p className="text-sm text-center text-muted-foreground">
              Após a confirmação do pagamento, você receberá acesso ao curso.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => router.push('/cursos')}
            >
              Voltar para Cursos
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 space-y-6">
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <div className="grid gap-6 md:grid-cols-5">
        {/* Course Summary */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-lg">{course.title}</CardTitle>
            <CardDescription className="line-clamp-2">
              {course.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4" />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total</span>
              <span className="text-2xl font-bold">
                {formatCurrency(course.price_cents)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Finalizar Inscrição</CardTitle>
            <CardDescription>
              Escolha a forma de pagamento e preencha seus dados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Payment Method */}
              <div className="space-y-3">
                <Label>Forma de Pagamento</Label>
                <RadioGroup 
                  value={paymentMethod} 
                  onValueChange={(v) => setPaymentMethod(v as any)}
                  className="grid grid-cols-3 gap-3"
                >
                  <Label 
                    htmlFor="pix" 
                    className={`flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === 'pix' ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                    }`}
                  >
                    <RadioGroupItem value="pix" id="pix" className="sr-only" />
                    <QrCode className="h-6 w-6" />
                    <span className="text-sm font-medium">PIX</span>
                  </Label>
                  <Label 
                    htmlFor="credit_card" 
                    className={`flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === 'credit_card' ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                    }`}
                  >
                    <RadioGroupItem value="credit_card" id="credit_card" className="sr-only" />
                    <CreditCard className="h-6 w-6" />
                    <span className="text-sm font-medium">Cartão</span>
                  </Label>
                  <Label 
                    htmlFor="cash" 
                    className={`flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === 'cash' ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                    }`}
                  >
                    <RadioGroupItem value="cash" id="cash" className="sr-only" />
                    <Banknote className="h-6 w-6" />
                    <span className="text-sm font-medium">Na Igreja</span>
                  </Label>
                </RadioGroup>
              </div>

              <Separator />

              {/* Customer Data */}
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Seu nome"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="document">CPF/CNPJ *</Label>
                    <Input
                      id="document"
                      value={formData.document}
                      onChange={(e) => setFormData({ ...formData, document: formatCPF(e.target.value) })}
                      placeholder="000.000.000-00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
              </div>

              {/* Credit Card Fields */}
              {paymentMethod === 'credit_card' && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Número do Cartão</Label>
                      <Input
                        id="cardNumber"
                        value={formData.cardNumber}
                        onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                        placeholder="0000 0000 0000 0000"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardHolder">Nome no Cartão</Label>
                      <Input
                        id="cardHolder"
                        value={formData.cardHolder}
                        onChange={(e) => setFormData({ ...formData, cardHolder: e.target.value.toUpperCase() })}
                        placeholder="NOME COMO NO CARTÃO"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cardExpMonth">Mês</Label>
                        <Input
                          id="cardExpMonth"
                          value={formData.cardExpMonth}
                          onChange={(e) => setFormData({ ...formData, cardExpMonth: e.target.value })}
                          placeholder="MM"
                          maxLength={2}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cardExpYear">Ano</Label>
                        <Input
                          id="cardExpYear"
                          value={formData.cardExpYear}
                          onChange={(e) => setFormData({ ...formData, cardExpYear: e.target.value })}
                          placeholder="AAAA"
                          maxLength={4}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cardCvv">CVV</Label>
                        <Input
                          id="cardCvv"
                          value={formData.cardCvv}
                          onChange={(e) => setFormData({ ...formData, cardCvv: e.target.value })}
                          placeholder="000"
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Cash Payment Info */}
              {paymentMethod === 'cash' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Banknote className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800">Pagamento na Igreja</p>
                      <p className="text-amber-700 mt-1">
                        Sua inscrição ficará pendente até que o pagamento seja confirmado pela igreja. 
                        Você tem até <strong>72 horas</strong> para efetuar o pagamento.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : paymentMethod === 'cash' ? (
                  'Registrar Inscrição'
                ) : (
                  `Pagar ${formatCurrency(course.price_cents)}`
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
