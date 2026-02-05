'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Check, 
  X, 
  Clock, 
  DollarSign, 
  GraduationCap, 
  Calendar,
  User,
  Mail,
  Phone,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  getPendingCourseCashPayments, 
  confirmCourseCashPayment, 
  rejectCourseCashPayment 
} from '@/actions/course-payments';
import { 
  getPendingCashPayments, 
  confirmCashPayment, 
  rejectCashPayment 
} from '@/actions/event-payments';

interface Payment {
  id: string;
  amount_cents: number;
  created_at: string;
  expires_at: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
  };
  course?: {
    id: string;
    title: string;
  };
  event?: {
    id: string;
    title: string;
    start_date: string;
  };
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(cents / 100);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getTimeRemaining(expiresAt: string) {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires.getTime() - now.getTime();
  
  if (diff <= 0) return { expired: true, text: 'Expirado' };
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { 
    expired: false, 
    text: `${hours}h ${minutes}min restantes`,
    hours
  };
}

function PaymentRow({ 
  payment, 
  type, 
  onConfirm, 
  onReject 
}: { 
  payment: Payment; 
  type: 'course' | 'event';
  onConfirm: (id: string) => Promise<void>;
  onReject: (id: string, reason?: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const [rejectReason, setRejectReason] = useState('');
  const timeRemaining = getTimeRemaining(payment.expires_at);
  
  const handleConfirm = () => {
    startTransition(async () => {
      await onConfirm(payment.id);
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      await onReject(payment.id, rejectReason);
      setRejectReason('');
    });
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span className="font-medium">{payment.user.full_name}</span>
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Mail className="h-3 w-3" />
            {payment.user.email}
          </span>
          {payment.user.phone && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {payment.user.phone}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          {type === 'course' && payment.course && (
            <>
              <Badge variant="outline" className="w-fit">
                <GraduationCap className="h-3 w-3 mr-1" />
                Curso
              </Badge>
              <span className="font-medium">{payment.course.title}</span>
            </>
          )}
          {type === 'event' && payment.event && (
            <>
              <Badge variant="outline" className="w-fit">
                <Calendar className="h-3 w-3 mr-1" />
                Evento
              </Badge>
              <span className="font-medium">{payment.event.title}</span>
              <span className="text-sm text-muted-foreground">
                {new Date(payment.event.start_date).toLocaleDateString('pt-BR')}
              </span>
            </>
          )}
        </div>
      </TableCell>
      <TableCell>
        <span className="font-bold text-lg">
          {formatCurrency(payment.amount_cents)}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">
            Registrado em {formatDate(payment.created_at)}
          </span>
          <Badge 
            variant={timeRemaining.expired ? 'destructive' : timeRemaining.hours && timeRemaining.hours < 12 ? 'secondary' : 'outline'}
            className="w-fit"
          >
            <Clock className="h-3 w-3 mr-1" />
            {timeRemaining.text}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Check className="h-4 w-4 mr-1" />
                Confirmar
              </>
            )}
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                size="sm" 
                variant="destructive"
                disabled={isPending}
              >
                <X className="h-4 w-4 mr-1" />
                Rejeitar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Rejeitar Pagamento</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja rejeitar este pagamento? 
                  A inscrição será cancelada.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
                <Label htmlFor="reason">Motivo (opcional)</Label>
                <Input
                  id="reason"
                  placeholder="Ex: Pagamento não recebido"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleReject}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Rejeitar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function ConfirmacoesPagamentosPage() {
  const [coursePayments, setCoursePayments] = useState<Payment[]>([]);
  const [eventPayments, setEventPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const [courseResult, eventResult] = await Promise.all([
        getPendingCourseCashPayments(),
        getPendingCashPayments()
      ]);

      if (courseResult.payments) {
        setCoursePayments(courseResult.payments as Payment[]);
      }
      if (eventResult.payments) {
        setEventPayments(eventResult.payments as Payment[]);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error('Erro ao carregar pagamentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleConfirmCourse = async (paymentId: string) => {
    const result = await confirmCourseCashPayment(paymentId);
    if (result.success) {
      toast.success(result.message);
      loadPayments();
    } else {
      toast.error(result.error);
    }
  };

  const handleRejectCourse = async (paymentId: string, reason?: string) => {
    const result = await rejectCourseCashPayment(paymentId, reason);
    if (result.success) {
      toast.success(result.message);
      loadPayments();
    } else {
      toast.error(result.error);
    }
  };

  const handleConfirmEvent = async (paymentId: string) => {
    const result = await confirmCashPayment(paymentId);
    if (result.success) {
      toast.success(result.message);
      loadPayments();
    } else {
      toast.error(result.error);
    }
  };

  const handleRejectEvent = async (paymentId: string, reason?: string) => {
    const result = await rejectCashPayment(paymentId, reason);
    if (result.success) {
      toast.success(result.message);
      loadPayments();
    } else {
      toast.error(result.error);
    }
  };

  const totalPending = coursePayments.length + eventPayments.length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Confirmação de Pagamentos</h1>
          <p className="text-muted-foreground">
            Confirme os pagamentos em dinheiro realizados na igreja
          </p>
        </div>
        {totalPending > 0 && (
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <AlertTriangle className="h-5 w-5 mr-2" />
            {totalPending} aguardando confirmação
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : totalPending === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Nenhum pagamento pendente</h3>
              <p className="text-muted-foreground">
                Todos os pagamentos em dinheiro foram processados
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">
              Todos ({totalPending})
            </TabsTrigger>
            <TabsTrigger value="courses">
              <GraduationCap className="h-4 w-4 mr-1" />
              Cursos ({coursePayments.length})
            </TabsTrigger>
            <TabsTrigger value="events">
              <Calendar className="h-4 w-4 mr-1" />
              Eventos ({eventPayments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pagamentos Pendentes</CardTitle>
                <CardDescription>
                  Confirme ou rejeite os pagamentos em dinheiro. 
                  Pagamentos não confirmados em 72 horas serão cancelados automaticamente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Membro</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coursePayments.map((payment) => (
                      <PaymentRow
                        key={payment.id}
                        payment={payment}
                        type="course"
                        onConfirm={handleConfirmCourse}
                        onReject={handleRejectCourse}
                      />
                    ))}
                    {eventPayments.map((payment) => (
                      <PaymentRow
                        key={payment.id}
                        payment={payment}
                        type="event"
                        onConfirm={handleConfirmEvent}
                        onReject={handleRejectEvent}
                      />
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses">
            <Card>
              <CardHeader>
                <CardTitle>Pagamentos de Cursos</CardTitle>
              </CardHeader>
              <CardContent>
                {coursePayments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum pagamento de curso pendente
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Membro</TableHead>
                        <TableHead>Curso</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Prazo</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coursePayments.map((payment) => (
                        <PaymentRow
                          key={payment.id}
                          payment={payment}
                          type="course"
                          onConfirm={handleConfirmCourse}
                          onReject={handleRejectCourse}
                        />
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>Pagamentos de Eventos</CardTitle>
              </CardHeader>
              <CardContent>
                {eventPayments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum pagamento de evento pendente
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Membro</TableHead>
                        <TableHead>Evento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Prazo</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eventPayments.map((payment) => (
                        <PaymentRow
                          key={payment.id}
                          payment={payment}
                          type="event"
                          onConfirm={handleConfirmEvent}
                          onReject={handleRejectEvent}
                        />
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
