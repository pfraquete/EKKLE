'use client'

import { useState } from 'react'
import { createTransaction } from '@/actions/finance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, PlusCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

const CATEGORIES = [
    { value: 'TITHE', label: 'Dízimo' },
    { value: 'OFFERING', label: 'Oferta' },
    { value: 'RENT', label: 'Aluguel' },
    { value: 'UTILITIES', label: 'Água/Luz/Tel' },
    { value: 'SALARY', label: 'Salários' },
    { value: 'MAINTENANCE', label: 'Manutenção' },
    { value: 'OTHER', label: 'Outros' },
]

export function TransactionForm({ defaultType = 'INCOME' }: { defaultType?: 'INCOME' | 'EXPENSE' }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData(e.currentTarget)
        const amount = parseFloat(formData.get('amount') as string)

        const result = await createTransaction({
            type: formData.get('type') as 'INCOME' | 'EXPENSE',
            category: formData.get('category') as string,
            amount_cents: Math.round(amount * 100),
            description: formData.get('description') as string,
            date: formData.get('date') as string,
            status: 'PAID',
        })

        if (result.success) {
            setOpen(false)
        } else {
            setError(result.error || 'Erro ao criar transação')
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className={defaultType === 'INCOME' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    {defaultType === 'INCOME' ? 'Nova Entrada' : 'Nova Saída'}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{defaultType === 'INCOME' ? 'Novo Lançamento de Entrada' : 'Novo Lançamento de Saída'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}

                    <input type="hidden" name="type" value={defaultType} />

                    <div className="space-y-2">
                        <Label htmlFor="category">Categoria</Label>
                        <Select name="category" required defaultValue={defaultType === 'INCOME' ? 'TITHE' : 'OTHER'}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Valor (R$)</Label>
                        <Input id="amount" name="amount" type="number" step="0.01" required placeholder="0,00" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="date">Data</Label>
                        <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descrição (Opcional)</Label>
                        <Input id="description" name="description" placeholder="Ex: Dízimo do Irmão João" />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Confirmar Lançamento'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
