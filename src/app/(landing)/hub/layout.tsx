import type { Metadata } from 'next'
import localFont from 'next/font/local'

const hubDisplay = localFont({
  src: [
    { path: '../../../../public/fonts/hub/6NUh8FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0K7iN7hzFUPJH58nib1603gg7S2nfgRYIctxujDg.ttf', weight: '400', style: 'normal' },
    { path: '../../../../public/fonts/hub/6NUh8FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0K7iN7hzFUPJH58nib1603gg7S2nfgRYIcaRyjDg.ttf', weight: '600', style: 'normal' },
    { path: '../../../../public/fonts/hub/6NUh8FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0K7iN7hzFUPJH58nib1603gg7S2nfgRYIcUByjDg.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-hub-display',
})

const hubBody = localFont({
  src: [
    { path: '../../../../public/fonts/hub/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk79FO_F.ttf', weight: '400', style: 'normal' },
    { path: '../../../../public/fonts/hub/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk7PFO_F.ttf', weight: '500', style: 'normal' },
    { path: '../../../../public/fonts/hub/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk4jE-_F.ttf', weight: '600', style: 'normal' },
    { path: '../../../../public/fonts/hub/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk4aE-_F.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-hub-body',
})

export const metadata: Metadata = {
  title: 'Ekkle Hub - Oracao, Biblia e Comunidade',
  description:
    'O Ekkle Hub e um espaco para oracao, leitura da Biblia e conexao com comunidades locais. Feito para quem ainda nao tem igreja.',
  openGraph: {
    title: 'Ekkle Hub - Oracao, Biblia e Comunidade',
    description:
      'Comece com oracao e leitura diaria, e conecte-se com uma igreja quando estiver pronto.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Ekkle Hub',
  },
}

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${hubDisplay.variable} ${hubBody.variable} hub-body`}>
      {children}
    </div>
  )
}
