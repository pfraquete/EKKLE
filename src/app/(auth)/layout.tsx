import Image from 'next/image'

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
            <div className="mb-8 flex flex-col items-center text-center">
                <Image
                    src="/logo.png"
                    alt="Videira SJC"
                    width={120}
                    height={120}
                    className="mb-4 rounded-full shadow-lg"
                />
                <h1 className="text-2xl font-bold text-gray-900">Videira São José dos Campos</h1>
                <p className="text-sm text-gray-550">Gestão de Células</p>
            </div>
            <div className="w-full max-w-sm">
                {children}
            </div>
        </div>
    )
}
