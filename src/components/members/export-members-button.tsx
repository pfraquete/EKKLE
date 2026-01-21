'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { exportToPDF } from '@/lib/export-pdf'

interface Member {
  full_name: string
  phone: string | null
  email: string | null
  member_stage: string
}

interface ExportMembersButtonProps {
  members: Member[]
  cellName: string
}

export function ExportMembersButton({ members, cellName }: ExportMembersButtonProps) {
  const handleExport = () => {
    const stageName = (stage: string) => {
      const stages: Record<string, string> = {
        VISITOR: 'Visitante',
        REGULAR_VISITOR: 'Frequentador',
        MEMBER: 'Membro',
        LEADER: 'Líder',
        PASTOR: 'Pastor'
      }
      return stages[stage] || stage
    }

    const content = `
      <h1>Lista de Membros</h1>

      <div class="section">
        <h2>Célula: ${cellName}</h2>
        <p><strong>Total de membros:</strong> ${members.length}</p>
      </div>

      <div class="section">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Estágio</th>
              <th>Telefone</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            ${members.map(member => `
              <tr>
                <td>${member.full_name}</td>
                <td>${stageName(member.member_stage)}</td>
                <td>${member.phone || '-'}</td>
                <td>${member.email || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `

    exportToPDF({
      filename: `membros-${cellName.toLowerCase().replace(/\s+/g, '-')}.pdf`,
      title: `Lista de Membros - ${cellName}`,
      content
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      className="rounded-full font-bold"
    >
      <Download className="h-4 w-4 mr-2" />
      Exportar PDF
    </Button>
  )
}
