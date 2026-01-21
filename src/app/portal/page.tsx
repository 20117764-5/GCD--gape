'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { User, Calendar, ArrowRight, Lock, Heart } from 'lucide-react'
import Image from 'next/image'

export default function PortalLogin() {
  const router = useRouter()
  const [cpf, setCpf] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  // Função para formatar CPF enquanto digita
  const formatarCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  async function handleAcesso(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const cpfLimpo = cpf.replace(/\D/g, '')

    // Lógica: Procurar aluno que tenha a data de nascimento informada 
    // E que o responsável tenha o CPF informado
    const { data, error } = await supabase
      .from('alunos')
      .select(`
        id, 
        nome_completo, 
        data_nascimento,
        responsaveis!inner (
          cpf
        )
      `)
      .eq('data_nascimento', dataNascimento)
      .eq('responsaveis.cpf', cpfLimpo)
      .single()

    if (error || !data) {
      setErro('Dados não encontrados. Verifique as informações e tente novamente.')
      setLoading(false)
      return
    }

    // Se encontrou, salvamos os dados do aluno na sessão (ou cookie) e redirecionamos
    // Por enquanto, vamos usar o localStorage para o portal saber quem é o aluno
    localStorage.setItem('@CGDAgape:alunoId', data.id)
    localStorage.setItem('@CGDAgape:alunoNome', data.nome_completo)
    
    router.push('/portal/dashboard')
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-blue-200/50 overflow-hidden border border-white">
        
        {/* Topo Decorativo */}
        <div className="bg-blue-600 p-8 text-center relative">
          <div className="absolute top-4 right-4 text-blue-400 opacity-50">
            <Heart size={24} fill="currentColor" />
          </div>
          <div className="relative w-32 h-16 mx-auto mb-2">
            <Image 
              src="/logo.png" 
              alt="Logo CGD" 
              fill
              className="object-contain brightness-0 invert"
            />
          </div>
          <h2 className="text-white font-bold text-xl">Área do Aluno</h2>
          <p className="text-blue-100 text-xs">Acesse notas e financeiro</p>
        </div>

        <div className="p-8 md:p-10">
          <form onSubmit={handleAcesso} className="space-y-6">
            
            {/* CPF do Responsável */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">CPF do Responsável</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <User size={18} />
                </div>
                <input 
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(formatarCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  required
                  className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* Data de Nascimento */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Data de Nascimento do Aluno</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Calendar size={18} />
                </div>
                <input 
                  type="date"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* Erro */}
            {erro && (
              <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold animate-in fade-in zoom-in-95">
                <Lock size={14} />
                {erro}
              </div>
            )}

            {/* Botão Acessar */}
            <button 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? 'Verificando...' : (
                <>
                  Acessar Portal <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[10px] text-slate-400 font-medium">
              Em caso de dúvidas, procure a secretaria da escola.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}