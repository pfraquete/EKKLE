import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Shield, Eye, Lock, Trash2, Mail } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Política de Privacidade | Ekkle',
    description: 'Política de Privacidade da plataforma Ekkle - Sistema de Gestão Eclesiástica',
}

export default function PrivacyPolicyPage() {
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
                        <h1 className="text-3xl font-black text-foreground mb-2">Política de Privacidade</h1>
                        <p className="text-muted-foreground">Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>

                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Shield className="w-6 h-6 text-primary" />
                            <h2 className="text-lg font-bold text-foreground">Compromisso com sua privacidade</h2>
                        </div>
                        <p className="text-muted-foreground">
                            A Ekkle está comprometida em proteger sua privacidade e seus dados pessoais em conformidade com a
                            Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
                        </p>
                    </div>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-black text-sm">1</span>
                            Dados que Coletamos
                        </h2>
                        <div className="pl-10 space-y-4 text-muted-foreground">
                            <div>
                                <h3 className="font-bold text-foreground mb-2">1.1 Dados de Cadastro</h3>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Nome completo</li>
                                    <li>Endereço de e-mail</li>
                                    <li>Número de telefone/WhatsApp</li>
                                    <li>Foto de perfil (opcional)</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground mb-2">1.2 Dados de Uso</h3>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Registros de presença em células e cultos</li>
                                    <li>Histórico de cursos e eventos</li>
                                    <li>Registros de dízimos e ofertas</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-black text-sm">2</span>
                            Finalidade do Tratamento
                        </h2>
                        <div className="pl-10 space-y-2 text-muted-foreground">
                            <p>Seus dados são utilizados para:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Permitir o acesso e uso da plataforma</li>
                                <li>Comunicação sobre eventos, cursos e atividades da igreja</li>
                                <li>Gestão de células e grupos pequenos</li>
                                <li>Processamento de contribuições financeiras</li>
                                <li>Geração de relatórios para a liderança da igreja</li>
                            </ul>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-black text-sm">3</span>
                            Base Legal
                        </h2>
                        <div className="pl-10 space-y-2 text-muted-foreground">
                            <p>O tratamento de seus dados pessoais é realizado com base em:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li><strong>Consentimento (Art. 7º, I):</strong> Para comunicações de marketing</li>
                                <li><strong>Execução de contrato (Art. 7º, V):</strong> Para prestação dos serviços da plataforma</li>
                                <li><strong>Legítimo interesse (Art. 7º, IX):</strong> Para melhorias no serviço e segurança</li>
                            </ul>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-black text-sm">4</span>
                            Compartilhamento de Dados
                        </h2>
                        <div className="pl-10 space-y-2 text-muted-foreground">
                            <p>Seus dados podem ser compartilhados com:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li><strong>Liderança da sua igreja:</strong> Para gestão de membros e células</li>
                                <li><strong>Processadores de pagamento:</strong> Para transações financeiras (Pagar.me)</li>
                                <li><strong>Provedores de infraestrutura:</strong> Supabase (banco de dados), Railway (hospedagem)</li>
                            </ul>
                            <p className="mt-4">
                                <strong>Não vendemos seus dados</strong> para terceiros e não os utilizamos para fins publicitários externos.
                            </p>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-black text-sm">5</span>
                            Seus Direitos (LGPD)
                        </h2>
                        <div className="pl-10 grid md:grid-cols-2 gap-4">
                            <div className="bg-card border border-border rounded-xl p-4">
                                <Eye className="w-5 h-5 text-primary mb-2" />
                                <h3 className="font-bold text-foreground mb-1">Acesso</h3>
                                <p className="text-sm text-muted-foreground">Solicitar uma cópia de todos os seus dados pessoais</p>
                            </div>
                            <div className="bg-card border border-border rounded-xl p-4">
                                <Lock className="w-5 h-5 text-primary mb-2" />
                                <h3 className="font-bold text-foreground mb-1">Correção</h3>
                                <p className="text-sm text-muted-foreground">Corrigir dados incompletos ou incorretos</p>
                            </div>
                            <div className="bg-card border border-border rounded-xl p-4">
                                <Trash2 className="w-5 h-5 text-primary mb-2" />
                                <h3 className="font-bold text-foreground mb-1">Exclusão</h3>
                                <p className="text-sm text-muted-foreground">Solicitar a exclusão de seus dados pessoais</p>
                            </div>
                            <div className="bg-card border border-border rounded-xl p-4">
                                <Shield className="w-5 h-5 text-primary mb-2" />
                                <h3 className="font-bold text-foreground mb-1">Revogação</h3>
                                <p className="text-sm text-muted-foreground">Revogar consentimento a qualquer momento</p>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-black text-sm">6</span>
                            Retenção de Dados
                        </h2>
                        <div className="pl-10 space-y-2 text-muted-foreground">
                            <ul className="list-disc list-inside space-y-1">
                                <li>Dados de cadastro: enquanto a conta estiver ativa</li>
                                <li>Dados financeiros: 5 anos após a última transação (obrigação legal)</li>
                                <li>Logs de acesso: 6 meses</li>
                            </ul>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-black text-sm">7</span>
                            Segurança
                        </h2>
                        <div className="pl-10 space-y-2 text-muted-foreground">
                            <p>Implementamos medidas técnicas e organizacionais para proteger seus dados:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Criptografia em trânsito (HTTPS/TLS)</li>
                                <li>Criptografia em repouso para dados sensíveis</li>
                                <li>Autenticação segura</li>
                                <li>Controle de acesso baseado em funções</li>
                                <li>Monitoramento e auditoria de acessos</li>
                            </ul>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-black text-sm">8</span>
                            Contato
                        </h2>
                        <div className="pl-10">
                            <div className="bg-card border border-border rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <Mail className="w-5 h-5 text-primary" />
                                    <h3 className="font-bold text-foreground">Encarregado de Proteção de Dados (DPO)</h3>
                                </div>
                                <p className="text-muted-foreground mb-4">
                                    Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato:
                                </p>
                                <p className="text-foreground font-medium">
                                    E-mail: <a href="mailto:privacidade@ekkle.com.br" className="text-primary hover:underline">privacidade@ekkle.com.br</a>
                                </p>
                            </div>
                        </div>
                    </section>

                    <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
                        <p>© {new Date().getFullYear()} Ekkle - Sistema de Gestão Eclesiástica</p>
                        <p className="mt-2">
                            <Link href="/termos" className="text-primary hover:underline">Termos de Uso</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
