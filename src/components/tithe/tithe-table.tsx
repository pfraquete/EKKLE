'use client'

import { useState, useTransition } from 'react'
import { CheckCircle, Clock, Upload, Eye, X, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { saveTithe } from '@/actions/tithes'
import { TitheUploadModal } from './tithe-upload-modal'

interface TitheData {
    id: string
    year: number
    month: number
    amount_cents: number
    receipt_url: string | null
    payment_method: string | null
    status: 'PENDING' | 'CONFIRMED'
    notes: string | null
}

interface MonthData {
    month: number
    name: string
    tithe: TitheData | null
}

interface TitheTableProps {
    monthsData: MonthData[]
    currentYear: number
}

export function TitheTable({ monthsData, currentYear }: TitheTableProps) {
    const [selectedMonth, setSelectedMonth] = useState<MonthData | null>(null)
    const [isPending, startTransition] = useTransition()

    return (
        <>
            <div className="bg-card border border-border/50 rounded-2xl sm:rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="px-4 sm:px-6 py-4 text-left text-[10px] sm:text-xs font-black uppercase tracking-widest text-muted-foreground">
                                    Mês
                                </th>
                                <th className="px-4 sm:px-6 py-4 text-left text-[10px] sm:text-xs font-black uppercase tracking-widest text-muted-foreground">
                                    Valor
                                </th>
                                <th className="px-4 sm:px-6 py-4 text-center text-[10px] sm:text-xs font-black uppercase tracking-widest text-muted-foreground">
                                    Status
                                </th>
                                <th className="px-4 sm:px-6 py-4 text-center text-[10px] sm:text-xs font-black uppercase tracking-widest text-muted-foreground">
                                    Comprovante
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {monthsData.map((monthData) => {
                                const { month, name, tithe } = monthData
                                const currentMonth = new Date().getMonth() + 1
                                const isPast = month < currentMonth
                                const isCurrent = month === currentMonth

                                return (
                                    <tr
                                        key={month}
                                        className={`hover:bg-muted/20 transition-colors ${isCurrent ? 'bg-primary/5' : ''}`}
                                    >
                                        <td className="px-4 sm:px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`
                                                    w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm
                                                    ${tithe?.status === 'CONFIRMED'
                                                        ? 'bg-emerald-500/10 text-emerald-500'
                                                        : tithe?.status === 'PENDING'
                                                            ? 'bg-amber-500/10 text-amber-500'
                                                            : 'bg-muted text-muted-foreground'}
                                                `}>
                                                    {month.toString().padStart(2, '0')}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground">{name}</p>
                                                    {isCurrent && (
                                                        <span className="text-[10px] font-bold uppercase text-primary">
                                                            Mês atual
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4">
                                            {tithe?.amount_cents ? (
                                                <span className="font-bold text-foreground">
                                                    {formatCurrency(tithe.amount_cents / 100)}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-center">
                                            {tithe?.status === 'CONFIRMED' ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] sm:text-xs font-bold">
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    Confirmado
                                                </span>
                                            ) : tithe?.status === 'PENDING' ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-500 rounded-lg text-[10px] sm:text-xs font-bold">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    Pendente
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-center">
                                            {tithe?.receipt_url ? (
                                                <a
                                                    href={tithe.receipt_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-[10px] sm:text-xs font-bold hover:bg-primary/20 transition-colors"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    Ver
                                                </a>
                                            ) : tithe?.status !== 'CONFIRMED' ? (
                                                <button
                                                    onClick={() => setSelectedMonth(monthData)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted text-muted-foreground rounded-lg text-[10px] sm:text-xs font-bold hover:bg-muted/80 hover:text-foreground transition-colors"
                                                >
                                                    <Upload className="w-3.5 h-3.5" />
                                                    Enviar
                                                </button>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Upload Modal */}
            {selectedMonth && (
                <TitheUploadModal
                    month={selectedMonth.month}
                    monthName={selectedMonth.name}
                    year={currentYear}
                    existingTithe={selectedMonth.tithe}
                    onClose={() => setSelectedMonth(null)}
                />
            )}
        </>
    )
}
