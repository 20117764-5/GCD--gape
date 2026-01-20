import { Sidebar } from "@/components/shared/Sidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Fixa */}
      <Sidebar />

      {/* Área de Conteúdo (Onde as páginas Alunos e Financeiro aparecem) */}
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  )
}