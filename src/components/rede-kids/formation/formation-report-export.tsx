'use client'

import { useState } from 'react'
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
import { FileDown, Loader2, FileText, Table } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getFormationReportData } from '@/actions/kids-formation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type ExportFormat = 'pdf' | 'csv'

export function FormationReportExport() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf')
  const { toast } = useToast()

  const handleExport = async () => {
    setIsLoading(true)
    try {
      const data = await getFormationReportData()
      
      if (!data) {
        toast({
          title: 'Erro',
          description: 'Não foi possível gerar o relatório',
          variant: 'destructive',
        })
        return
      }

      if (selectedFormat === 'csv') {
        exportToCSV(data)
      } else {
        exportToPDF(data)
      }

      toast({
        title: 'Relatório gerado!',
        description: 'O download foi iniciado automaticamente.',
      })
      setIsOpen(false)
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao gerar o relatório',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const exportToCSV = (data: Awaited<ReturnType<typeof getFormationReportData>>) => {
    if (!data) return

    // Build CSV content
    const headers = [
      'Nome',
      'Célula',
      'Responsável',
      'Progresso (%)',
      'Etapa Atual',
      'Próxima Etapa',
      ...data.stages.map(s => s.name),
    ]

    const rows = data.children.map(child => [
      child.fullName,
      child.cellName,
      child.parentName || '-',
      `${child.progressPercentage}%`,
      child.currentStage,
      child.nextStage,
      ...child.stageDetails.map(s => 
        s.completed 
          ? format(new Date(s.completedAt!), 'dd/MM/yyyy') 
          : '-'
      ),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `relatorio-trilho-formacao-${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
  }

  const exportToPDF = (data: Awaited<ReturnType<typeof getFormationReportData>>) => {
    if (!data) return

    // Create printable HTML
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast({
        title: 'Erro',
        description: 'Permita pop-ups para gerar o PDF',
        variant: 'destructive',
      })
      return
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório Trilho de Formação Kids</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; }
          .header h1 { color: #4f46e5; font-size: 24px; margin-bottom: 5px; }
          .header p { color: #666; font-size: 12px; }
          .summary { display: flex; gap: 20px; margin-bottom: 30px; flex-wrap: wrap; }
          .summary-card { background: #f9fafb; padding: 15px; border-radius: 8px; flex: 1; min-width: 150px; text-align: center; }
          .summary-card .value { font-size: 28px; font-weight: bold; color: #4f46e5; }
          .summary-card .label { font-size: 12px; color: #666; }
          .stages-legend { margin-bottom: 20px; }
          .stages-legend h3 { font-size: 14px; margin-bottom: 10px; }
          .stages-legend .stages { display: flex; gap: 10px; flex-wrap: wrap; }
          .stages-legend .stage { display: flex; align-items: center; gap: 5px; font-size: 12px; }
          .stages-legend .stage-dot { width: 12px; height: 12px; border-radius: 50%; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #4f46e5; color: white; font-weight: 600; }
          tr:nth-child(even) { background: #f9fafb; }
          .progress-bar { width: 100%; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
          .progress-fill { height: 100%; background: #22c55e; }
          .check { color: #22c55e; font-weight: bold; }
          .empty { color: #ccc; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Relatório do Trilho de Formação Kids</h1>
          <p>${data.churchName}</p>
          <p>Gerado em ${format(new Date(data.generatedAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })} por ${data.generatedBy}</p>
        </div>

        <div class="summary">
          <div class="summary-card">
            <div class="value">${data.summary.totalChildren}</div>
            <div class="label">Total de Crianças</div>
          </div>
          <div class="summary-card">
            <div class="value">${data.summary.childrenWithProgress}</div>
            <div class="label">Em Formação</div>
          </div>
          <div class="summary-card">
            <div class="value">${data.summary.childrenCompleted}</div>
            <div class="label">Concluídos</div>
          </div>
          <div class="summary-card">
            <div class="value">${data.summary.averageProgress}%</div>
            <div class="label">Progresso Médio</div>
          </div>
        </div>

        <div class="stages-legend">
          <h3>Etapas do Trilho</h3>
          <div class="stages">
            ${data.stages.map((s, i) => `
              <div class="stage">
                <div class="stage-dot" style="background: ${s.color}"></div>
                <span>${i + 1}. ${s.name}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Célula</th>
              <th>Progresso</th>
              ${data.stages.map(s => `<th style="background: ${s.color}">${s.name}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.children.map(child => `
              <tr>
                <td><strong>${child.fullName}</strong></td>
                <td>${child.cellName}</td>
                <td>
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${child.progressPercentage}%"></div>
                  </div>
                  <small>${child.progressPercentage}%</small>
                </td>
                ${child.stageDetails.map(s => `
                  <td style="text-align: center">
                    ${s.completed 
                      ? `<span class="check">✓</span><br><small>${format(new Date(s.completedAt!), 'dd/MM/yy')}</small>` 
                      : '<span class="empty">-</span>'
                    }
                  </td>
                `).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Relatório gerado pelo Ekkle - Sistema de Gestão para Igrejas</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileDown className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exportar Relatório de Formação</DialogTitle>
          <DialogDescription>
            Gere um relatório completo do progresso de todas as crianças no Trilho de Formação
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Selecione o formato de exportação:
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSelectedFormat('pdf')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedFormat === 'pdf'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FileText className={`h-8 w-8 mx-auto mb-2 ${
                selectedFormat === 'pdf' ? 'text-primary' : 'text-gray-400'
              }`} />
              <p className="font-medium">PDF</p>
              <p className="text-xs text-muted-foreground">Para impressão</p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFormat('csv')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedFormat === 'csv'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Table className={`h-8 w-8 mx-auto mb-2 ${
                selectedFormat === 'csv' ? 'text-primary' : 'text-gray-400'
              }`} />
              <p className="font-medium">CSV</p>
              <p className="text-xs text-muted-foreground">Para Excel</p>
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                Exportar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
