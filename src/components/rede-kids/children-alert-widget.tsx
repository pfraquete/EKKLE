'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Baby, ArrowRight } from 'lucide-react'

interface ChildrenAlertWidgetProps {
    withoutCell: number
}

export function ChildrenAlertWidget({ withoutCell }: ChildrenAlertWidgetProps) {
    if (withoutCell === 0) {
        return null
    }

    return (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 shadow-md">
            <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-amber-800">
                                {withoutCell} {withoutCell === 1 ? 'crianca' : 'criancas'} sem celula
                            </p>
                            <p className="text-sm text-amber-700">
                                Atribua uma celula para melhor organizacao
                            </p>
                        </div>
                    </div>
                    <Link href="/rede-kids/criancas">
                        <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                            <Baby className="w-4 h-4 mr-2" />
                            Ver Criancas
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}
