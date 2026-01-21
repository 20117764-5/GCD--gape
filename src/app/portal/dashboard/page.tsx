'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  LogOut, 
  CreditCard, 
  BookOpen, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Award,
  Megaphone,
  Calendar,
  GraduationCap,
  FileDown 
} from 'lucide-react'
import Image from 'next/image'

import { PDFDownloadLink } from '@react-pdf/renderer'
import { BoletimPDF } from '@/components/portal/BoletimPDF'

// --- INTERFACES ---
interface Cobranca {
  id: string
  valor: number
  data_vencimento: string
  status_pagamento: string
  link_pagamento: string | null
  tipo_taxa: string
}

interface Aluno {
  nome_completo: string
  turma: string
}

interface Nota {
  id: string
  disciplina: string
  unidade: number
  nota: number
  faltas: number
}

interface Aviso {
  id: string
  titulo: string
  conteudo: string
  prioridade: string
}

export default function PortalDashboard() {
  const router = useRouter()
  const [aluno, setAluno] = useState<Aluno | null>(null)
  const [financeiro, setFinanceiro] = useState<Cobranca[]>([])
  const [boletim, setBoletim] = useState<Nota[]>([])
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregarPortal() {
      const alunoId = localStorage.getItem('@CGDAgape:alunoId')
      if (!alunoId) { router.push('/portal'); return }

      const { data: dataAluno } = await supabase.from('alunos').select('nome_completo, turma').eq('id', alunoId).single()
      const { data: dataFin } = await supabase.from('cobrancas').select('*').eq('aluno_id', alunoId).order('data_vencimento', { ascending: false })
      const { data: dataNotas } = await supabase.from('notas').select('*').eq('id_aluno', alunoId).order('unidade', { ascending: true })
      const { data: dataAvisos } = await supabase.from('avisos').select('*').order('created_at', { ascending: false }).limit(3)

      if (dataAluno) setAluno(dataAluno)
      if (dataFin) setFinanceiro(dataFin as Cobranca[])
      if (dataNotas) setBoletim(dataNotas as Nota[])
      if (dataAvisos) setAvisos(dataAvisos as Aviso[])
      setLoading(false)
    }
    carregarPortal()
  }, [router])

  function handleLogout() {
    localStorage.removeItem('@CGDAgape:alunoId')
    localStorage.removeItem('@CGDAgape:alunoNome')
    router.push('/portal')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center animate-pulse flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">Abrindo mochila...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-900 overflow-x-hidden">
      
      {/* HEADER - Sticky com Glassmorphism */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-30 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="relative w-24 md:w-32 h-8 md:h-10 hover:scale-105 transition-transform cursor-pointer">
            <Image src="/logo.png" alt="Logo CGD" fill className="object-contain" />
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-slate-400 hover:text-red-500 transition-all text-[10px] md:text-xs font-black uppercase tracking-widest active:scale-95">
            <span className="hidden sm:inline">Sair do Portal</span> <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 mt-6 md:mt-8 space-y-6 md:space-y-10">
        
        {/* BANNER DE BOAS-VINDAS - Animação de Zoom e Slide */}
        <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 text-white shadow-xl shadow-blue-200/50 relative overflow-hidden animate-in fade-in zoom-in-95 duration-700">
          <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
            <GraduationCap size={120} className="md:w-[200px] md:h-[200px]" />
          </div>
          <div className="relative z-10">
            <p className="text-blue-100 font-bold text-[10px] md:text-sm mb-1 md:mb-2 uppercase tracking-[0.2em] animate-in slide-in-from-left-4 duration-700 delay-150">Área do Responsável</p>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight leading-tight animate-in slide-in-from-left-6 duration-700 delay-300">
              {aluno?.nome_completo}
            </h1>
            <div className="mt-4 md:mt-6 flex flex-wrap items-center gap-2 md:gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
              <span className="bg-white/20 px-3 md:px-4 py-1 rounded-full text-[9px] md:text-[10px] font-black backdrop-blur-md uppercase tracking-widest border border-white/10">
                {aluno?.turma}
              </span>
              <span className="bg-amber-400 px-3 md:px-4 py-1 rounded-full text-[9px] md:text-[10px] font-black text-amber-900 uppercase tracking-widest shadow-lg">
                Ano Letivo 2026
              </span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
          
          <div className="lg:col-span-2 space-y-10">
            
            {/* FINANCEIRO - Cards com Hover e Entrada em Cascata */}
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
              <h2 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-3">
                <CreditCard className="text-blue-500" size={24} /> Mensalidades e Taxas
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {financeiro.map((c, index) => (
                  <div key={c.id} 
                    style={{ animationDelay: `${index * 100}ms` }}
                    className="bg-white p-5 md:p-6 rounded-3xl border border-blue-50 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:shadow-md hover:border-blue-100 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
                        c.status_pagamento === 'pago' ? 'bg-green-50 text-green-500' : 'bg-amber-50 text-amber-500'
                      }`}>
                        {c.status_pagamento === 'pago' ? <CheckCircle size={28} /> : <Clock size={28} />}
                      </div>
                      <div>
                        <p className="font-black text-slate-700 uppercase text-[10px] md:text-xs tracking-wider">{c.tipo_taxa}</p>
                        <p className="text-xs md:text-sm text-slate-400 font-bold">Venc: {new Date(c.data_vencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 md:gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-50">
                      <div className="text-left sm:text-right">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Valor</p>
                        <p className="font-black text-slate-700 text-base md:text-lg">{c.valor.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                      </div>
                      
                      {c.status_pagamento !== 'pago' && c.link_pagamento ? (
                        <a 
                          href={c.link_pagamento} 
                          target="_blank" 
                          className="bg-blue-600 text-white px-5 md:px-6 py-2.5 md:py-3 rounded-2xl text-[10px] md:text-xs font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2 active:scale-95"
                        >
                          Pagar <ExternalLink size={14} />
                        </a>
                      ) : (
                        <span className={`text-[9px] md:text-[10px] font-black uppercase px-3 md:px-4 py-1.5 md:py-2 rounded-full border ${
                          c.status_pagamento === 'pago' ? 'text-green-500 bg-green-50 border-green-100' : 'text-slate-400 bg-slate-50 border-slate-100'
                        }`}>
                          {c.status_pagamento === 'pago' ? 'Liquidado' : 'Pendente'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BOLETIM - Efeito de Tabela Profissional */}
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pr-2">
                <h2 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-3">
                  <BookOpen className="text-indigo-500" size={24} /> Boletim Escolar
                </h2>
                
                {aluno && boletim.length > 0 && (
                  <PDFDownloadLink
                    document={<BoletimPDF aluno={aluno} notas={boletim} />}
                    fileName={`Boletim_${aluno.nome_completo.replace(/\s+/g, '_')}.pdf`}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 border border-indigo-100 rounded-xl text-[10px] font-black hover:bg-indigo-600 hover:text-white transition-all w-full sm:w-auto justify-center shadow-sm"
                  >
                    {({ loading: pdfLoading }) => (
                      pdfLoading ? 'Gerando...' : <><FileDown size={14} /> Baixar PDF</>
                    )}
                  </PDFDownloadLink>
                )}
              </div>

              <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-indigo-50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[500px]">
                    <thead className="bg-slate-50/50 text-slate-400 font-black uppercase text-[9px] tracking-[0.2em] border-b border-slate-100">
                      <tr>
                        <th className="p-4 md:p-6">Disciplina</th>
                        <th className="p-4 md:p-6 text-center">Unidade</th>
                        <th className="p-4 md:p-6 text-center">Nota</th>
                        <th className="p-4 md:p-6 text-center">Faltas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {boletim.map((n) => (
                        <tr key={n.id} className="hover:bg-indigo-50/20 transition-colors group">
                          <td className="p-4 md:p-6 font-bold text-slate-700 text-sm md:text-base group-hover:pl-8 transition-all">{n.disciplina}</td>
                          <td className="p-4 md:p-6 text-center text-slate-500 font-black text-[10px] uppercase">{n.unidade}ª Unid</td>
                          <td className="p-4 md:p-6 text-center">
                            <span className={`text-base md:text-lg font-black ${n.nota >= 7 ? 'text-blue-600' : 'text-red-500'}`}>
                              {Number(n.nota).toFixed(1)}
                            </span>
                          </td>
                          <td className="p-4 md:p-6 text-center font-bold text-slate-400">{n.faltas}</td>
                        </tr>
                      ))}
                      {boletim.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-16 text-center text-slate-300 font-medium italic">Notas ainda não disponíveis.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA (MURAL) - Entrada pela Direita */}
          <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-8 duration-700 delay-400">
            <h2 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-3">
              <Megaphone className="text-orange-500" size={24} /> Mural de Avisos
            </h2>
            <div className="space-y-4">
              {avisos.map((aviso) => (
                <div key={aviso.id} className={`p-6 md:p-8 rounded-3xl border shadow-sm flex flex-col gap-3 transition-transform hover:-translate-y-1 duration-300 ${
                  aviso.prioridade === 'importante' ? 'bg-orange-50 border-orange-100 text-orange-900' : 'bg-white border-blue-50 text-slate-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60">
                      {aviso.prioridade === 'importante' ? '⚠ Comunicado Urgente' : '📢 Comunicado'}
                    </p>
                  </div>
                  <h3 className="font-black text-base md:text-lg leading-tight">{aviso.titulo}</h3>
                  <p className="text-xs md:text-sm font-medium opacity-80 leading-relaxed">{aviso.conteudo}</p>
                </div>
              ))}
              {avisos.length === 0 && <p className="text-center py-10 text-slate-300 font-bold uppercase text-[10px]">Sem avisos hoje.</p>}
            </div>

            {/* CARD AJUDA - Dark Mode Style */}
            <div className="bg-slate-900 p-8 rounded-3xl text-white space-y-4 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700">
              <h3 className="font-black text-xl tracking-tight">Precisa de Ajuda?</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Nossa secretaria está pronta para atender você via WhatsApp para dúvidas financeiras ou pedagógicas.
              </p>
              <button className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10">
                Canais de Atendimento
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}