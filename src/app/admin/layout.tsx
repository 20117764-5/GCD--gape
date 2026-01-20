'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Sidebar } from "@/components/shared/Sidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [autorizado, setAutorizado] = useState(false)

  useEffect(() => {
    async function checkUser() {
      // Pergunta pro Supabase: "Tem alguém logado?"
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        // Se não tiver, manda pro Login
        router.push('/login')
      } else {
        // Se tiver, libera a entrada
        setAutorizado(true)
      }
    }

    checkUser()
  }, [router])

  // Enquanto verifica, mostra nada (ou um loading) para não piscar a tela proibida
  if (!autorizado) {
    return <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-400">Verificando acesso...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  )
}