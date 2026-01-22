'use client'

import { useState } from 'react'
// import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
// Removed GuidedTour import
import { Button } from '@/components/ui/button'
// Removed unused Input and Label imports
import { TableCell } from '@/components/ui/table'
import { Upload, FileText, CheckCircle2, Loader2, ArrowLeft, Download } from 'lucide-react'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { importMembers } from '@/actions/admin'
import { toast } from 'sonner'

export default function ImportPage() {
    // const router = useRouter()
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [preview, setPreview] = useState<Record<string, unknown>[]>([])
    const [stats, setStats] = useState<{ success: number; errors: number } | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            const reader = new FileReader()
            reader.onload = (event) => {
                const data = new Uint8Array(event.target?.result as ArrayBuffer)
                const workbook = XLSX.read(data, { type: 'array' })
                const sheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[sheetName]
                const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[]
                setPreview(jsonData.slice(0, 5)) // Preview first 5 rows
            }
            reader.readAsArrayBuffer(selectedFile)
        }
    }

    const handleImport = async () => {
        if (!file) return
        setLoading(true)
        try {
            const reader = new FileReader()
            reader.onload = async (event) => {
                const data = new Uint8Array(event.target?.result as ArrayBuffer)
                const workbook = XLSX.read(data, { type: 'array' })
                const sheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[sheetName]
                const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[]

                const result = await importMembers(jsonData)
                setStats(result)
                toast.success('Importação concluída!')
            }
            reader.readAsArrayBuffer(file)
        } catch (error) {
            console.error('Import error:', error)
            toast.error('Erro na importação')
        } finally {
            setLoading(false)
        }
    }

    const downloadTemplate = () => {
        const ws = XLSX.utils.json_to_sheet([
            { full_name: 'João Silva', email: 'joao@exemplo.com', phone: '11999999999', cell_name: 'Célula Esperança', member_stage: 'MEMBER' },
            { full_name: 'Maria Souza', email: 'maria@exemplo.com', phone: '11888888888', cell_name: 'Célula Esperança', member_stage: 'VISITOR' }
        ])
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Membros')
        XLSX.writeFile(wb, 'ekkle_template_importacao.xlsx')
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* GuidedTour removed due to build issues */}
            <div className="flex items-center justify-between">
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-foreground">Importar Membros</h1>
                    <p className="text-sm text-muted-foreground">Adicione sua congregação em segundos via Excel ou CSV</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 border-none shadow-sm h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Faça o upload do arquivo</CardTitle>
                        <CardDescription>Formatos aceitos: .xlsx, .xls, .csv</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {!stats ? (
                            <>
                                <div
                                    className="border-2 border-dashed border-muted rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer group"
                                    onClick={() => document.getElementById('file-upload')?.click()}
                                >
                                    <Upload className="h-10 w-10 text-muted-foreground group-hover:text-blue-500 mb-4 transition-colors" />
                                    <p className="font-bold text-foreground mb-1">
                                        {file ? file.name : 'Clique para selecionar ou arraste o arquivo'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Tamanho máximo: 10MB</p>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        className="hidden"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleFileChange}
                                    />
                                </div>

                                {preview.length > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Prévia dos dados</p>
                                        <div className="border rounded-xl overflow-hidden">
                                            <table className="w-full text-sm">
                                                <thead className="bg-muted/50">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left font-bold">Nome</th>
                                                        <th className="px-4 py-2 text-left font-bold">Email</th>
                                                        <th className="px-4 py-2 text-left font-bold">Telefone</th>
                                                        <th className="px-4 py-2 text-left font-bold">Célula</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {preview.map((row, i) => (
                                                        <tr key={i} className="border-t">
                                                            <TableCell className="font-medium">{(row.full_name || row.Nome || row.nome) as string}</TableCell>
                                                            <TableCell>{(row.email) as string}</TableCell>
                                                            <TableCell>{(row.phone || row.telefone || row.Telefone) as string}</TableCell>
                                                            <TableCell className="text-right">{(row.cell_name || row.celula || row.Célula || row.Cell) as string}</TableCell>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                <Button
                                    className="w-full rounded-2xl h-12 font-bold shadow-lg"
                                    disabled={!file || loading}
                                    onClick={handleImport}
                                >
                                    {loading ? (
                                        <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Processando...</>
                                    ) : (
                                        <><CheckCircle2 className="h-5 w-5 mr-2" /> Iniciar Importação</>
                                    )}
                                </Button>
                            </>
                        ) : (
                            <div className="text-center py-6 space-y-6">
                                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="h-10 w-10" />
                                </div>
                                <h2 className="text-xl font-black">Importação Concluída!</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-muted/30 rounded-2xl p-4">
                                        <p className="text-2xl font-black text-emerald-500">{stats.success}</p>
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Sucesso</p>
                                    </div>
                                    <div className="bg-muted/30 rounded-2xl p-4">
                                        <p className="text-2xl font-black text-red-500">{stats.errors}</p>
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Erros</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full rounded-2xl h-11 border-2"
                                    onClick={() => {
                                        setFile(null)
                                        setPreview([])
                                        setStats(null)
                                    }}
                                >
                                    Importar outro arquivo
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="border-none shadow-sm bg-blue-500/5 border border-blue-500/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-md font-bold text-blue-600 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Template
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-blue-700/70 mb-4 leading-relaxed">
                                Use nosso template para garantir que os dados sejam importados corretamente.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full rounded-xl bg-white border-blue-200 hover:bg-blue-50 text-blue-600 font-bold"
                                onClick={downloadTemplate}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Baixar Template
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm">
                        <CardHeader className="pb-2 border-b">
                            <CardTitle className="text-xs font-black uppercase tracking-[2px] text-muted-foreground">Dicas</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="flex gap-3">
                                <div className="w-5 h-5 bg-muted rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</div>
                                <p className="text-xs text-muted-foreground">As células inexistentes serão criadas automaticamente.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-5 h-5 bg-muted rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</div>
                                <p className="text-xs text-muted-foreground">O estágio deve ser: VISITOR, MEMBER ou LEADER.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-5 h-5 bg-muted rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">3</div>
                                <p className="text-xs text-muted-foreground">Evite duplicatas limpando dados antes do upload.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
