'use client'

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

interface MonthSelectProps {
    currentMonth: number
    basePath?: string
}

export function MonthSelect({ currentMonth, basePath = '/membro/financeiro/dizimos' }: MonthSelectProps) {
    return (
        <select
            defaultValue={currentMonth}
            onChange={(e) => {
                const url = new URL(window.location.href)
                url.searchParams.set('month', e.target.value)
                window.location.href = url.toString()
            }}
            className="h-10 px-4 rounded-xl bg-background border border-border text-foreground text-sm"
        >
            {MONTHS.map((month, index) => (
                <option key={index} value={index + 1}>
                    {month}
                </option>
            ))}
        </select>
    )
}
