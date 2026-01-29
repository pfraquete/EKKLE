import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, FileText, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Termos de Uso | Ekkle',
    description: 'Termos de Uso da plataforma Ekkle - Sistema de Gestão Eclesiástica',
}

export default function TermsOfUsePage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-4 py-12">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar ao início
                </Link>

                <div className="space-y-8">
                    <div>
                        <h1 className="text-3xl font-black text-foreground mb-2">Termos de Uso</h1>
                        <p className="text-muted-foreground">Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>

                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <FileText className="w-6 h-6 text-primary" />
                            <h2 className="text-lg font-bold text-foreground">Acordo de Uso</h2>
                        </div>
                        <p className="text-muted-foreground">
                            Ao acessar e utilizar a plataforma Ekkle, você concorda com os termos e condições descritos neste documento.
                            Leia atentamente antes de prosseguir com o uso do sistema.
                        </p>
                    </div>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-black text-sm">1</span>
                            Definições
                        </h2>
                        <div className="pl-10 space-y-2 text-muted-foreground">
                            <ul className="list-disc list-inside space-y-2">
                                <li><strong>"Ekkle":</strong> Plataforma de gestão eclesiástica disponibilizada como serviço (SaaS)</li>
                                <li><strong>"Igreja":</strong> Organização religiosa que contrata os serviços da Ekkle</li>
                                <li><strong>"Usuário":</strong> Qualquer pessoa que acessa a plataforma (membros, líderes, pastores)</li>
                                <li><strong>"Administrador":</strong> Responsável pela gestão da conta da igreja na plataforma</li>
                            </ul>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-black text-sm">2</span>
                            Serviços Oferecidos
                        </h2>
                        <div className="pl-10 space-y-2 text-muted-foreground">
                            <p>A plataforma Ekkle oferece funcionalidades para:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Gestão de membros e células</li>
                                <li>Controle de presença em cultos e reuniões</li>
                                <li>Gerenciamento de cursos e eventos</li>
                                <li>Processamento de dízimos e ofertas</li>
                                <li>Loja virtual para produtos da igreja</li>
                                <li>Reconhecimento facial para identificação em fotos (opcional)</li>
                                <li>Comunicação via WhatsApp e e-mail</li>
                            </ul>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-black text-sm">3</span>
                            Responsabilidades do Usuário
                        </h2>
                        <div className="pl-10 space-y-4">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-bold text-foreground">Você concorda em:</p>
                                    <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-2">
                                        <li>Fornecer informações verdadeiras e atualizadas</li>
                                        <li>Manter a confidencialidade de sua senha</li>
                                        <li>Notificar imediatamente sobre uso não autorizado</li>
                                        <li>Utilizar a plataforma de acordo com a legislação vigente</li>
                                        <li>Respeitar os direitos de outros usuários</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-bold text-foreground">Você NÃO pode:</p>
                                    <ul className="list-disc list-inside space-y-1 text-muted-foreground mt-2">
                                        <li>Compartilhar credenciais de acesso</li>
                                        <li>Tentar acessar áreas não autorizadas</li>
                                        <li>Utilizar a plataforma para fins ilegais</li>
                                        <li>Transmitir vírus ou código malicioso</li>
                                        <li>Coletar dados de outros usuários sem autorização</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-black text-sm">4</span>
                            Responsabilidades da Igreja
                        </h2>
                        <div className="pl-10 space-y-2 text-muted-foreground">
                            <p>A igreja que contrata a Ekkle é responsável por:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Garantir que possui consentimento dos membros para cadastro</li>
                                <li>Informar aos membros sobre a política de privacidade</li>
                                <li>Utilizar os dados dos membros apenas para fins eclesiásticos</li>
                                <li>Manter os dados atualizados e corretos</li>
                                <li>Atender solicitações de exclusão de dados de membros</li>
                            </ul>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-black text-sm">5</span>
                            Pagamentos e Taxas
                        </h2>
                        <div className="pl-10 space-y-2 text-muted-foreground">
                            <ul className="list-disc list-inside space-y-1">
                                <li>A Ekkle cobra uma taxa de <strong>1%</strong> sobre transações financeiras processadas</li>
                                <li>Os valores são transferidos automaticamente para a conta bancária cadastrada</li>
                                <li>Taxas adicionais do gateway de pagamento (Pagar.me) podem ser aplicadas</li>
                                <li>A igreja é responsável pelos tributos aplicáveis às receitas</li>
                            </ul>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-black text-sm">6</span>
                            Propriedade Intelectual
                        </h2>
                        <div className="pl-10 space-y-2 text-muted-foreground">
                            <ul className="list-disc list-inside space-y-1">
                                <li>A plataforma Ekkle, incluindo código, design e marca, é propriedade exclusiva da Ekkle</li>
                                <li>O conteúdo inserido pela igreja (textos, fotos, vídeos) permanece de propriedade da igreja</li>
                                <li>A Ekkle pode utilizar dados agregados e anonimizados para melhorias no serviço</li>
                            </ul>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-black text-sm">7</span>
                            Limitação de Responsabilidade
                        </h2>
                        <div className="pl-10">
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                                    <div className="text-muted-foreground">
                                        <p className="mb-2">A Ekkle não se responsabiliza por:</p>
                                        <ul className="list-disc list-inside space-y-1 text-sm">
                                            <li>Interrupções temporárias no serviço</li>
                                            <li>Perda de dados causada por terceiros</li>
                                            <li>Uso indevido da plataforma por usuários</li>
                                            <li>Decisões tomadas com base em dados da plataforma</li>
                                            <li>Danos indiretos ou consequenciais</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-black text-sm">8</span>
                            Encerramento
                        </h2>
                        <div className="pl-10 space-y-2 text-muted-foreground">
                            <ul className="list-disc list-inside space-y-1">
                                <li>Qualquer parte pode encerrar o uso a qualquer momento</li>
                                <li>Em caso de violação dos termos, a conta pode ser suspensa</li>
                                <li>Dados serão mantidos por 30 dias após o encerramento</li>
                                <li>A igreja pode solicitar exportação de seus dados antes do encerramento</li>
                            </ul>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-black text-sm">9</span>
                            Alterações nos Termos
                        </h2>
                        <div className="pl-10 space-y-2 text-muted-foreground">
                            <p>
                                A Ekkle pode modificar estes termos a qualquer momento. Alterações significativas serão
                                comunicadas por e-mail ou notificação na plataforma com 30 dias de antecedência.
                                O uso continuado após as alterações constitui aceitação dos novos termos.
                            </p>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-black text-sm">10</span>
                            Foro
                        </h2>
                        <div className="pl-10 space-y-2 text-muted-foreground">
                            <p>
                                Este contrato é regido pelas leis brasileiras. Fica eleito o foro da comarca de São Paulo/SP
                                para dirimir quaisquer controvérsias decorrentes deste instrumento.
                            </p>
                        </div>
                    </section>

                    <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
                        <p>© {new Date().getFullYear()} Ekkle - Sistema de Gestão Eclesiástica</p>
                        <p className="mt-2">
                            <Link href="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
