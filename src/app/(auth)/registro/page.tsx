import { redirect } from 'next/navigation'

export default function RegistroPage() {
    // Redirecionar /registro para /cadastro
    redirect('/cadastro')
}
