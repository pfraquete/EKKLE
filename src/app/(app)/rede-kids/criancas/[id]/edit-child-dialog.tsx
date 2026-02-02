'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Edit, Loader2 } from 'lucide-react'
import { updateKidsChild, KidsChild } from '@/actions/kids-children'
import { getKidsCells } from '@/actions/kids-cells'
import { toast } from 'sonner'

interface EditChildDialogProps {
    child: KidsChild
}

interface KidsCell {
    id: string
    name: string
}

export function EditChildDialog({ child }: EditChildDialogProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [cells, setCells] = useState<KidsCell[]>([])
    const [formData, setFormData] = useState({
        full_name: child.full_name,
        birth_date: child.birth_date || '',
        gender: child.gender || '',
        parent_name: child.parent_name || '',
        parent_phone: child.parent_phone || '',
        parent_email: child.parent_email || '',
        kids_cell_id: child.kids_cell_id || '',
        allergies: child.allergies || '',
        medical_notes: child.medical_notes || '',
    })

    useEffect(() => {
        if (open) {
            async function loadCells() {
                const data = await getKidsCells()
                setCells(data.map(c => ({ id: c.id, name: c.name })))
            }
            loadCells()
        }
    }, [open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        startTransition(async () => {
            const result = await updateKidsChild(child.id, {
                full_name: formData.full_name,
                birth_date: formData.birth_date || null,
                gender: formData.gender as 'M' | 'F' | null || null,
                parent_name: formData.parent_name || null,
                parent_phone: formData.parent_phone || null,
                parent_email: formData.parent_email || null,
                kids_cell_id: formData.kids_cell_id || null,
                allergies: formData.allergies || null,
                medical_notes: formData.medical_notes || null,
            })

            if (result.success) {
                toast.success('Crianca atualizada com sucesso!')
                setOpen(false)
                router.refresh()
            } else {
                toast.error(result.error || 'Erro ao atualizar crianca')
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-xl">
                    <Edit className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Crianca</DialogTitle>
                    <DialogDescription>
                        Atualize as informacoes da crianca
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit_full_name">Nome Completo *</Label>
                        <Input
                            id="edit_full_name"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit_birth_date">Data de Nascimento</Label>
                            <Input
                                id="edit_birth_date"
                                type="date"
                                value={formData.birth_date}
                                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Genero</Label>
                            <Select
                                value={formData.gender}
                                onValueChange={(value) => setFormData({ ...formData, gender: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="M">Masculino</SelectItem>
                                    <SelectItem value="F">Feminino</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Celula Kids</Label>
                        <Select
                            value={formData.kids_cell_id}
                            onValueChange={(value) => setFormData({ ...formData, kids_cell_id: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione uma celula" />
                            </SelectTrigger>
                            <SelectContent>
                                {cells.map(cell => (
                                    <SelectItem key={cell.id} value={cell.id}>
                                        {cell.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="border-t pt-4">
                        <p className="text-sm font-bold text-muted-foreground mb-3">Responsavel</p>
                        <div className="space-y-3">
                            <Input
                                placeholder="Nome do responsavel"
                                value={formData.parent_name}
                                onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    placeholder="Telefone"
                                    value={formData.parent_phone}
                                    onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                                />
                                <Input
                                    placeholder="Email"
                                    type="email"
                                    value={formData.parent_email}
                                    onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <p className="text-sm font-bold text-muted-foreground mb-3">Informacoes Medicas</p>
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor="edit_allergies">Alergias</Label>
                                <Textarea
                                    id="edit_allergies"
                                    value={formData.allergies}
                                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                                    placeholder="Liste alergias..."
                                    className="min-h-[60px]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit_medical_notes">Observacoes Medicas</Label>
                                <Textarea
                                    id="edit_medical_notes"
                                    value={formData.medical_notes}
                                    onChange={(e) => setFormData({ ...formData, medical_notes: e.target.value })}
                                    placeholder="Outras observacoes..."
                                    className="min-h-[60px]"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isPending || !formData.full_name}>
                            {isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                'Salvar Alteracoes'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
