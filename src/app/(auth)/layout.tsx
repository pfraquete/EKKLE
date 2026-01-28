// RESCUE MODE - Simplified Auth Layout
export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white px-4 py-12">
            <div className="mb-8 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-white rounded-full mb-4 flex items-center justify-center">
                    <span className="text-4xl font-black text-zinc-950">E</span>
                </div>
                <h1 className="text-2xl font-bold text-white">Ekkle</h1>
                <p className="text-sm text-zinc-400">Gestão de Células</p>
            </div>
            <div className="w-full max-w-sm">
                {children}
            </div>
        </div>
    )
}
