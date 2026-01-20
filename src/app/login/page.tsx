'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Lock, Mail } from 'lucide-react'
import Image from 'next/image' // <--- Importante para carregar a logo

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErro('Email ou senha incorretos.')
      setLoading(false)
    } else {
      router.push('/admin')
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-slate-200">
        
        <div className="text-center mb-8">
          {/* SUBSTITUIÇÃO: Logo no lugar do quadrado azul */}
          <div className="flex justify-center mb-4">
            {/* Certifique-se de que o arquivo logo.png está na pasta 'public' */}
            <Image 
              src="/logo.png" 
              alt="Logo CGD Ágape" 
              width={140} // Ajuste o tamanho conforme necessário
              height={140} 
              className="object-contain" // Garante que a logo não fique esticada
              priority // Carrega mais rápido por ser a imagem principal
            />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-800">Acesso Restrito</h1>
          <p className="text-slate-500 text-sm">Entre para gerenciar o sistema</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-3 text-slate-400" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">Senha</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3 text-slate-400" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                placeholder="••••••••"
              />
            </div>
          </div>

          {erro && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
              {erro}
            </div>
          )}

          <button 
            disabled={loading}
            className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-70"
          >
            {loading ? 'Entrando...' : 'Acessar Painel'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          CGD Ágape System v1.0
        </p>
      </div>
    </div>
  )
}