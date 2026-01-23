import { getAvailableCells } from '@/actions/join-cell'
import { getProfile } from '@/actions/auth'
import { CellList } from '@/components/cells/cell-list'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function CelulasDisponiveisPage() {
    const profile = await getProfile()
    if (!profile) redirect('/login')

    const cells = await getAvailableCells(profile.church_id)

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black text-foreground">Encontre uma Célula</h1>
                <p className="text-muted-foreground">
                    Conecte-se com pessoas e cresça espiritualmente em uma de nossas células.
                </p>
            </div>

            <CellList cells={cells} />
        </div>
    )
}
