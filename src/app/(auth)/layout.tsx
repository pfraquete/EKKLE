import Image from 'next/image'

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="dark min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-[#fafafa] px-4 py-12">
            <div className="mb-8 flex flex-col items-center text-center">
                <Image
                    src="/logo.png"
                    alt="Ekkle"
                    width={120}
                    height={120}
                    className="mb-4 rounded-full shadow-lg"
                />
                <h1 className="text-2xl font-bold text-foreground">Ekkle</h1>
                <p className="text-sm text-muted-foreground">Gestão de Células</p>
            </div>
            <div className="w-full max-w-sm">
                {children}
            </div>
        </div>
    )
}
