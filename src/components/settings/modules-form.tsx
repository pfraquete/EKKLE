'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, CalendarCheck2, Building2, BookOpen } from 'lucide-react'
import { updateChurchModules, ChurchModulesData } from '@/actions/church-modules'

interface ModulesFormProps {
    modules: ChurchModulesData
}

export function ModulesForm({ modules }: ModulesFormProps) {
    const [formData, setFormData] = useState<ChurchModulesData>(modules)
    const [isSaving, setIsSaving] = useState(false)
    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)

        try {
            const result = await updateChurchModules(formData)

            if (result.success) {
                toast({
                    title: 'Módulos atualizados',
                    description: 'As alterações foram salvas com sucesso',
                })
            } else {
                toast({
                    title: 'Erro',
                    description: result.error,
                    variant: 'destructive',
                })
            }
        } catch {
            toast({
                title: 'Erro',
                description: 'Falha ao salvar configurações',
                variant: 'destructive',
            })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Células */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <CalendarCheck2 className="h-5 w-5 text-primary" />
                    <div className="space-y-0.5">
                        <Label htmlFor="cells_enabled">Sistema de Células</Label>
                        <p className="text-sm text-muted-foreground">
                            Gerencie pequenos grupos, reuniões, supervisão e relatórios
                        </p>
                    </div>
                </div>
                <Switch
                    id="cells_enabled"
                    checked={formData.cells_enabled}
                    onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, cells_enabled: checked }))
                    }
                />
            </div>

            {/* Departamentos */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-primary" />
                    <div className="space-y-0.5">
                        <Label htmlFor="departments_enabled">Departamentos</Label>
                        <p className="text-sm text-muted-foreground">
                            Organize a igreja em departamentos, nomeie líderes e gerencie equipes
                        </p>
                    </div>
                </div>
                <Switch
                    id="departments_enabled"
                    checked={formData.departments_enabled}
                    onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, departments_enabled: checked }))
                    }
                />
            </div>

            {/* EBD */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <div className="space-y-0.5">
                        <Label htmlFor="ebd_enabled">Escola Bíblica Dominical (EBD)</Label>
                        <p className="text-sm text-muted-foreground">
                            Gerencie classes, professores, lições e frequência dos alunos
                        </p>
                    </div>
                </div>
                <Switch
                    id="ebd_enabled"
                    checked={formData.ebd_enabled}
                    onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, ebd_enabled: checked }))
                    }
                />
            </div>

            {/* Submit */}
            <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                    </>
                ) : (
                    <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar configurações
                    </>
                )}
            </Button>
        </form>
    )
}
