import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ekkle - Sistema de Gestão para Igrejas',
  description:
    'Transforme a gestão da sua igreja com tecnologia. Gerencie células, membros, eventos e comunicação em um único lugar. Automatize tarefas e foque no que realmente importa: as pessoas.',
  keywords: [
    'gestão de igrejas',
    'sistema para igrejas',
    'gestão de células',
    'software para igrejas',
    'automação para igrejas',
    'ekkle',
  ],
  openGraph: {
    title: 'Ekkle - Sistema de Gestão para Igrejas',
    description:
      'Transforme a gestão da sua igreja com tecnologia. Gerencie células, membros, eventos e comunicação em um único lugar.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Ekkle',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ekkle - Sistema de Gestão para Igrejas',
    description:
      'Transforme a gestão da sua igreja com tecnologia. Gerencie células, membros, eventos e comunicação em um único lugar.',
  },
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
