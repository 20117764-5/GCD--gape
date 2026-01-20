'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestPage() {
  const [status, setStatus] = useState('Verificando conexão...')

  useEffect(() => {
    async function testConnection() {
      // Tenta buscar a lista de alunos (mesmo que esteja vazia)
      const { error } = await supabase.from('alunos').select('*').limit(1)
      
      if (error) {
        setStatus(`Erro: ${error.message}`)
      } else {
        setStatus('✅ Conexão com o Supabase estabelecida com sucesso!')
      }
    }
    testConnection()
  }, [])

  return (
    <div className="flex items-center justify-center h-screen bg-slate-900 text-white font-sans">
      <div className="p-8 bg-slate-800 rounded-lg shadow-xl border border-slate-700">
        <h1 className="text-2xl font-bold mb-4">CGD Ágape - Status do Sistema</h1>
        <p className="text-lg">{status}</p>
      </div>
    </div>
  )
}