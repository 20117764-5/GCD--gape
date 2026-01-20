'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Lock, Mail, ArrowRight, Star, Cloud, Heart } from 'lucide-react'
import Image from 'next/image'

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
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 relative overflow-hidden p-4">
      
      {/* --- ELEMENTOS DECORATIVOS DE FUNDO (FLUTUANTES) --- */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 text-white/20 animate-pulse">
            <Cloud size={64} />
        </div>
        <div className="absolute bottom-20 right-20 text-yellow-300/30 rotate-12">
            <Star size={80} />
        </div>
        <div className="absolute top-1/4 right-10 text-pink-400/20 -rotate-12">
            <Heart size={48} />
        </div>
        <div className="absolute bottom-1/3 left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* --- CARTÃO CENTRALIZADO --- */}
      <div className="bg-white w-full max-w-[420px] rounded-3xl shadow-2xl p-8 md:p-10 relative z-10 animate-in zoom-in-95 duration-300">
        
        {/* Cabeçalho do Cartão */}
        <div className="text-center mb-8">
          <div className="relative w-32 h-16 mx-auto mb-4">
              {/* Logo */}
              <Image 
                src="/logo.png" 
                alt="Logo CGD" 
                fill
                className="object-contain"
                priority
              />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800">
            Bem-vindo de volta!
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Gestão Escolar CGD Ágape
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleLogin} className="space-y-5">
          
          <div className="space-y-4">
            {/* Input Email */}
            <div className="group">
              <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase tracking-wide">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-400 group-focus-within:text-blue-500 transition" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700 placeholder-slate-400"
                  placeholder="admin@escola.com"
                />
              </div>
            </div>

            {/* Input Senha */}
            <div className="group">
              <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase tracking-wide">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400 group-focus-within:text-blue-500 transition" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700 placeholder-slate-400"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          {/* Mensagem de Erro */}
          {erro && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 flex items-center gap-2 text-red-600 text-xs font-bold animate-in fade-in slide-in-from-top-1 justify-center">
              <span>⚠️</span> {erro}
            </div>
          )}

          {/* Botão */}
          <button 
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {loading ? 'Verificando...' : (
              <>
                Entrar no Sistema <ArrowRight size={18} />
              </>
            )}
          </button>

        </form>
        
        <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <p className="text-xs text-slate-400">
                Problemas com acesso?{' '}
                <a 
                  href="mailto:thiagovfb.dev@gmail.com" // <--- COLOQUE SEU EMAIL AQUI
                  className="text-blue-600 cursor-pointer hover:underline font-bold"
                >
                  Contate o suporte.
                </a>
            </p>
        </div>
      </div>
    </div>
  )
}