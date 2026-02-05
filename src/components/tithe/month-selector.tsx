'use client'

import { useRouter } from 'next/navigation'

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

interface MonthSelectorProps {
    currentMonth: number
}

export function MonthSelector({ currentMonth }: MonthSelectorProps) {
    const router = useRouter()

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const url = new URL(window.location.href)
        url.searchParams.set('month', e.target.value)
        router.push(url.pathname + url.search)
    }

    return (
        <select
            defaultValue={currentMonth}
            onChange={handleChange}
            className="h-10 px-4 rounded-lg bg-background border border-border text-foreground text-sm"
        >
            {MONTHS.map((month, index) => (
                <option key={index} value={index + 1}>
                    {month}
                </option>
            ))}
        </select>
    )
}
