'use client'

import { ParentalConsent } from '@/actions/kids-parental-consent'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  CheckCircle2,
  XCircle,
  Clock,
  LogIn,
  LogOut,
  Phone,
  Mail,
  AlertTriangle,
  Camera,
  Car,
  Waves,
  Pill,
} from 'lucide-react'
import { format, differenceInYears } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-yellow-500', icon: Clock },
  approved: { label: 'Aprovado', color: 'bg-green-500', icon: CheckCircle2 },
  rejected: { label: 'Rejeitado', color: 'bg-red-500', icon: XCircle },
  cancelled: { label: 'Cancelado', color: 'bg-gray-500', icon: XCircle },
}

interface ConsentCardProps {
  consent: ParentalConsent
  onCheckIn?: () => void
  onCheckOut?: () => void
  onApprove?: () => void
  onReject?: () => void
  showActions?: boolean
}

export function ConsentCard({
  consent,
  onCheckIn,
  onCheckOut,
  onApprove,
  onReject,
  showActions = true,
}: ConsentCardProps) {
  const status = statusConfig[consent.status]
  const StatusIcon = status.icon
  const age = consent.child?.birth_date
    ? differenceInYears(new Date(), new Date(consent.child.birth_date))
    : null

  const isCheckedIn = !!consent.checked_in_at
  const isCheckedOut = !!consent.checked_out_at

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={consent.child?.photo_url || undefined} />
              <AvatarFallback>
                {consent.child?.full_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{consent.child?.full_name}</h3>
              {age !== null && (
                <p className="text-sm text-muted-foreground">{age} anos</p>
              )}
            </div>
          </div>
          <Badge className={`${status.color} text-white`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-2 space-y-3">
        {/* Responsável */}
        <div className="text-sm">
          <p className="text-muted-foreground">Responsável</p>
          <p className="font-medium">{consent.parent_name}</p>
          {consent.relationship && (
            <p className="text-xs text-muted-foreground">({consent.relationship})</p>
          )}
        </div>

        {/* Contatos */}
        <div className="flex flex-wrap gap-2 text-xs">
          {consent.parent_phone && (
            <a
              href={`tel:${consent.parent_phone}`}
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <Phone className="h-3 w-3" />
              {consent.parent_phone}
            </a>
          )}
          {consent.parent_email && (
            <a
              href={`mailto:${consent.parent_email}`}
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <Mail className="h-3 w-3" />
              {consent.parent_email}
            </a>
          )}
        </div>

        {/* Permissões */}
        <div className="flex flex-wrap gap-1">
          {consent.allows_photos && (
            <Badge variant="outline" className="text-xs gap-1">
              <Camera className="h-3 w-3" /> Fotos
            </Badge>
          )}
          {consent.allows_transportation && (
            <Badge variant="outline" className="text-xs gap-1">
              <Car className="h-3 w-3" /> Transporte
            </Badge>
          )}
          {consent.allows_swimming && (
            <Badge variant="outline" className="text-xs gap-1">
              <Waves className="h-3 w-3" /> Piscina
            </Badge>
          )}
          {consent.allows_medication && (
            <Badge variant="outline" className="text-xs gap-1">
              <Pill className="h-3 w-3" /> Medicação
            </Badge>
          )}
        </div>

        {/* Alertas médicos */}
        {(consent.child?.allergies || consent.child?.medical_info || consent.medical_notes) && (
          <div className="p-2 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-1 text-yellow-700 text-xs font-medium mb-1">
              <AlertTriangle className="h-3 w-3" />
              Informações Médicas
            </div>
            {consent.child?.allergies && (
              <p className="text-xs text-yellow-800">
                <strong>Alergias:</strong> {consent.child.allergies}
              </p>
            )}
            {consent.child?.medical_info && (
              <p className="text-xs text-yellow-800">
                <strong>Condições:</strong> {consent.child.medical_info}
              </p>
            )}
            {consent.medical_notes && (
              <p className="text-xs text-yellow-800">
                <strong>Obs:</strong> {consent.medical_notes}
              </p>
            )}
          </div>
        )}

        {/* Status de Check-in/out */}
        {consent.status === 'approved' && (
          <div className="flex gap-2 text-xs">
            {isCheckedIn && (
              <div className="flex items-center gap-1 text-green-600">
                <LogIn className="h-3 w-3" />
                Check-in: {format(new Date(consent.checked_in_at!), 'HH:mm', { locale: ptBR })}
              </div>
            )}
            {isCheckedOut && (
              <div className="flex items-center gap-1 text-blue-600">
                <LogOut className="h-3 w-3" />
                Check-out: {format(new Date(consent.checked_out_at!), 'HH:mm', { locale: ptBR })}
                {consent.checkout_person_name && (
                  <span className="text-muted-foreground">
                    ({consent.checkout_person_name})
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>

      {showActions && (
        <CardFooter className="pt-2 border-t gap-2">
          {consent.status === 'pending' && (
            <>
              <Button size="sm" variant="default" onClick={onApprove} className="flex-1">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Aprovar
              </Button>
              <Button size="sm" variant="outline" onClick={onReject}>
                <XCircle className="h-4 w-4 mr-1" />
                Rejeitar
              </Button>
            </>
          )}
          {consent.status === 'approved' && !isCheckedIn && (
            <Button size="sm" variant="default" onClick={onCheckIn} className="flex-1">
              <LogIn className="h-4 w-4 mr-1" />
              Check-in
            </Button>
          )}
          {consent.status === 'approved' && isCheckedIn && !isCheckedOut && (
            <Button size="sm" variant="default" onClick={onCheckOut} className="flex-1">
              <LogOut className="h-4 w-4 mr-1" />
              Check-out
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
