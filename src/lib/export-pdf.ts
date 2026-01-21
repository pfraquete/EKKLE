/**
 * Simple PDF export using browser's print functionality
 * Works with any HTML content without external dependencies
 */

interface ExportPDFOptions {
  filename: string
  title: string
  content: string
}

/**
 * Export HTML content to PDF using browser's print dialog
 * @param options Export options with filename, title and HTML content
 */
export function exportToPDF(options: ExportPDFOptions) {
  const { filename, title, content } = options

  // Create a hidden iframe
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = 'none'

  document.body.appendChild(iframe)

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
  if (!iframeDoc) {
    console.error('Could not access iframe document')
    return
  }

  // Write content to iframe
  iframeDoc.open()
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          @media print {
            @page {
              margin: 2cm;
              size: A4;
            }

            body {
              margin: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 12pt;
              line-height: 1.6;
              color: #1f2937;
            }

            h1 {
              font-size: 24pt;
              font-weight: bold;
              margin-bottom: 0.5em;
              color: #111827;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 0.5em;
            }

            h2 {
              font-size: 18pt;
              font-weight: bold;
              margin-top: 1em;
              margin-bottom: 0.5em;
              color: #374151;
            }

            h3 {
              font-size: 14pt;
              font-weight: bold;
              margin-top: 0.8em;
              margin-bottom: 0.4em;
              color: #4b5563;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin: 1em 0;
            }

            th, td {
              border: 1px solid #d1d5db;
              padding: 0.5em;
              text-align: left;
            }

            th {
              background-color: #f3f4f6;
              font-weight: bold;
            }

            .section {
              margin: 1.5em 0;
              page-break-inside: avoid;
            }

            .stats {
              display: flex;
              gap: 1em;
              margin: 1em 0;
            }

            .stat-card {
              flex: 1;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              padding: 1em;
              background: #f9fafb;
            }

            .stat-value {
              font-size: 24pt;
              font-weight: bold;
              color: #e11d48;
            }

            .stat-label {
              font-size: 10pt;
              text-transform: uppercase;
              color: #6b7280;
              font-weight: bold;
              letter-spacing: 0.05em;
            }

            .footer {
              margin-top: 2em;
              padding-top: 1em;
              border-top: 1px solid #e5e7eb;
              font-size: 10pt;
              color: #6b7280;
              text-align: center;
            }

            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        ${content}
        <div class="footer">
          <p>Gerado por Ekkle • Sistema de Gestão de Células</p>
          <p>Data: ${new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          })}</p>
        </div>
      </body>
    </html>
  `)
  iframeDoc.close()

  // Wait for content to load, then print
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()

      // Clean up after print dialog closes
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 100)
    }, 250)
  }
}

/**
 * Generate HTML for meeting report PDF
 */
export function generateMeetingReportHTML(data: {
  cellName: string
  date: string
  leaderName: string
  attendance: { name: string; present: boolean }[]
  visitors: { name: string; phone: string }[]
  decisions: number
  observations: string
  checklist: {
    icebreaker: boolean
    worship: boolean
    word: boolean
    prayer: boolean
    snack: boolean
  }
}) {
  const presentCount = data.attendance.filter(a => a.present).length
  const totalMembers = data.attendance.length
  const attendanceRate = totalMembers > 0
    ? Math.round((presentCount / totalMembers) * 100)
    : 0

  return `
    <h1>Relatório de Reunião de Célula</h1>

    <div class="section">
      <h2>Informações Gerais</h2>
      <table>
        <tr>
          <th>Célula</th>
          <td>${data.cellName}</td>
        </tr>
        <tr>
          <th>Data</th>
          <td>${new Date(data.date + 'T00:00:00').toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          })}</td>
        </tr>
        <tr>
          <th>Líder</th>
          <td>${data.leaderName}</td>
        </tr>
      </table>
    </div>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">${presentCount}/${totalMembers}</div>
        <div class="stat-label">Presentes</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${attendanceRate}%</div>
        <div class="stat-label">Frequência</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.visitors.length}</div>
        <div class="stat-label">Visitantes</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.decisions}</div>
        <div class="stat-label">Decisões</div>
      </div>
    </div>

    <div class="section">
      <h2>Estrutura da Reunião</h2>
      <table>
        <tr>
          <td>Quebra-gelo</td>
          <td>${data.checklist.icebreaker ? '✓ Sim' : '✗ Não'}</td>
        </tr>
        <tr>
          <td>Louvor</td>
          <td>${data.checklist.worship ? '✓ Sim' : '✗ Não'}</td>
        </tr>
        <tr>
          <td>Palavra</td>
          <td>${data.checklist.word ? '✓ Sim' : '✗ Não'}</td>
        </tr>
        <tr>
          <td>Oração</td>
          <td>${data.checklist.prayer ? '✓ Sim' : '✗ Não'}</td>
        </tr>
        <tr>
          <td>Lanche</td>
          <td>${data.checklist.snack ? '✓ Sim' : '✗ Não'}</td>
        </tr>
      </table>
    </div>

    ${data.attendance.length > 0 ? `
      <div class="section">
        <h2>Presença de Membros</h2>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th style="text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.attendance.map(a => `
              <tr>
                <td>${a.name}</td>
                <td style="text-align: center;">${a.present ? '✓ Presente' : '✗ Ausente'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}

    ${data.visitors.length > 0 ? `
      <div class="section">
        <h2>Visitantes</h2>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Telefone</th>
            </tr>
          </thead>
          <tbody>
            ${data.visitors.map(v => `
              <tr>
                <td>${v.name}</td>
                <td>${v.phone}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}

    ${data.observations ? `
      <div class="section">
        <h2>Observações</h2>
        <p>${data.observations.replace(/\n/g, '<br>')}</p>
      </div>
    ` : ''}
  `
}
