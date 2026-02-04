'use client'

import { useState } from 'react'
import { createParentalConsent } from '@/actions/kids-parental-consent'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface Child {
  id: string
  full_name: string
  parent_name?: string | null
  parent_phone?: string | null
  parent_email?: string | null
}

interface ConsentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  children: Child[]
  onSuccess?: () => void
}

const relationships = [
  { value: 'pai', label: 'Pai' },
  { value: 'mae', label: 'Mãe' },
  { value: 'avo', label: 'Avó/Avô' },
  { value: 'tio', label: 'Tio/Tia' },
  { value: 'responsavel', label: 'Responsável Legal' },
  { value: 'outro', label: 'Outro' },
]

export function ConsentForm({
  open,
  onOpenChange,
  eventId,
  children,
  onSuccess,
}: ConsentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedChildId, setSelectedChildId] = useState('')
  const [parentName, setParentName] = useState('')
  const [parentCpf, setParentCpf] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [relationship, setRelationship] = useState('')
  const [medicalNotes, setMedicalNotes] = useState('')
  const [emergencyContactName, setEmergencyContactName] = useState('')
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('')
  const [allowsPhotos, setAllowsPhotos] = useState(true)
  const [allowsTransportation, setAllowsTransportation] = useState(true)
  const [allowsSwimming, setAllowsSwimming] = useState(false)
  const [allowsMedication, setAllowsMedication] = useState(false)
  const [medicationInstructions, setMedicationInstructions] = useState('')
  const { toast } = useToast()

  // Auto-fill parent info when child is selected
  const handleChildSelect = (childId: string) => {
    setSelectedChildId(childId)
    const child = children.find(c => c.id === childId)
    if (child) {
      if (child.parent_name) setParentName(child.parent_name)
      if (child.parent_phone) setParentPhone(child.parent_phone)
      if (child.parent_email) setParentEmail(child.parent_email)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await createParentalConsent({
        event_id: eventId,
        child_id: selectedChildId,
        parent_name: parentName,
        parent_cpf: parentCpf || null,
        parent_phone: parentPhone || null,
        parent_email: parentEmail || null,
        relationship: relationship || null,
        medical_notes: medicalNotes || null,
        emergency_contact_name: emergencyContactName || null,
        emergency_contact_phone: emergencyContactPhone || null,
        allows_photos: allowsPhotos,
        allows_transportation: allowsTransportation,
        allows_swimming: allowsSwimming,
        allows_medication: allowsMedication,
        medication_instructions: medicationInstructions || null,
      })

      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: 'Autorização criada com sucesso',
        })
        onOpenChange(false)
        onSuccess?.()
        // Reset form
        resetForm()
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Não foi possível criar autorização',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedChildId('')
    setParentName('')
    setParentCpf('')
    setParentPhone('')
    setParentEmail('')
    setRelationship('')
    setMedicalNotes('')
    setEmergencyContactName('')
    setEmergencyContactPhone('')
    setAllowsPhotos(true)
    setAllowsTransportation(true)
    setAllowsSwimming(false)
    setAllowsMedication(false)
    setMedicationInstructions('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Autorização Parental</DialogTitle>
          <DialogDescription>
            Preencha os dados do responsável para autorizar a participação da criança no evento
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seleção da Criança */}
          <div className="space-y-2">
            <Label htmlFor="child">Criança *</Label>
            <Select value={selectedChildId} onValueChange={handleChildSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a criança" />
              </SelectTrigger>
              <SelectContent>
                {children.map(child => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dados do Responsável */}
          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="font-medium">Dados do Responsável</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parentName">Nome Completo *</Label>
                <Input
                  id="parentName"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="relationship">Parentesco</Label>
                <Select value={relationship} onValueChange={setRelationship}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationships.map(rel => (
                      <SelectItem key={rel.value} value={rel.value}>
                        {rel.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parentCpf">CPF</Label>
                <Input
                  id="parentCpf"
                  value={parentCpf}
                  onChange={(e) => setParentCpf(e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentPhone">Telefone</Label>
                <Input
                  id="parentPhone"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentEmail">E-mail</Label>
                <Input
                  id="parentEmail"
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Contato de Emergência */}
          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="font-medium">Contato de Emergência</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyName">Nome</Label>
                <Input
                  id="emergencyName"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Telefone</Label>
                <Input
                  id="emergencyPhone"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Informações Médicas */}
          <div className="space-y-2">
            <Label htmlFor="medicalNotes">Observações Médicas</Label>
            <Textarea
              id="medicalNotes"
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
              placeholder="Alergias, medicamentos em uso, condições especiais..."
              rows={2}
            />
          </div>

          {/* Permissões */}
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-medium">Permissões</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={allowsPhotos}
                  onCheckedChange={(checked) => setAllowsPhotos(!!checked)}
                />
                <span className="text-sm">Autorizo fotos e vídeos</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={allowsTransportation}
                  onCheckedChange={(checked) => setAllowsTransportation(!!checked)}
                />
                <span className="text-sm">Autorizo transporte</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={allowsSwimming}
                  onCheckedChange={(checked) => setAllowsSwimming(!!checked)}
                />
                <span className="text-sm">Autorizo atividades aquáticas</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={allowsMedication}
                  onCheckedChange={(checked) => setAllowsMedication(!!checked)}
                />
                <span className="text-sm">Autorizo administrar medicação</span>
              </label>
            </div>

            {allowsMedication && (
              <div className="space-y-2 mt-2">
                <Label htmlFor="medicationInstructions">Instruções de Medicação</Label>
                <Textarea
                  id="medicationInstructions"
                  value={medicationInstructions}
                  onChange={(e) => setMedicationInstructions(e.target.value)}
                  placeholder="Medicamentos e horários..."
                  rows={2}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !selectedChildId || !parentName}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Criar Autorização'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
