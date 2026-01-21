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
  FileDown // Ícone para o download
} from 'lucide-react'
import Image from 'next/image'

// Importações para o PDF
import { PDFDownloadLink } from '@react-pdf/renderer'
import { BoletimPDF } from '@/components/portal/BoletimPDF'

// --- INTERFACES DE TIPAGEM ---
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
      
      if (!alunoId) {
        router.push('/portal')
        return
      }

      // 1. Dados do Aluno
      const { data: dataAluno } = await supabase
        .from('alunos')
        .select('nome_completo, turma')
        .eq('id', alunoId)
        .single()

      // 2. Financeiro
      const { data: dataFin } = await supabase
        .from('cobrancas')
        .select('*')
        .eq('aluno_id', alunoId)
        .order('data_vencimento', { ascending: false })

      // 3. Notas e Faltas
      const { data: dataNotas } = await supabase
        .from('notas')
        .select('*')
        .eq('aluno_id', alunoId)
        .order('unidade', { ascending: true })

      // 4. Comunicados (Avisos)
      const { data: dataAvisos } = await supabase
        .from('avisos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3)

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
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Sincronizando dados escolares...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-900">
      
      {/* HEADER DO PORTAL */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="relative w-32 h-10">
            <Image src="/logo.png" alt="Logo CGD" fill className="object-contain" />
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-400 hover:text-red-500 transition-colors text-xs font-black uppercase tracking-widest"
          >
            Sair do Portal <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-8">
        
        {/* BOAS-VINDAS */}
        <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-10 text-white shadow-xl shadow-blue-200/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <GraduationCap size={180} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <p className="text-blue-100 font-bold text-sm mb-2 uppercase tracking-[0.2em]">Responsável por:</p>
              <h1 className="text-4xl font-black tracking-tight">
                {aluno?.nome_completo}
              </h1>
              <div className="mt-6 flex items-center gap-3">
                <span className="bg-white/20 px-4 py-1.5 rounded-full text-[10px] font-black backdrop-blur-md uppercase tracking-widest border border-white/10">
                  {aluno?.turma}
                </span>
                <span className="bg-amber-400 px-4 py-1.5 rounded-full text-[10px] font-black text-amber-900 uppercase tracking-widest shadow-lg">
                  Ano Letivo 2026
                </span>
              </div>
            </div>
            <Award size={100} className="text-white/20 hidden lg:block" />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-10">
            
            {/* SEÇÃO: FINANCEIRO */}
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <CreditCard className="text-blue-500" /> Mensalidades e Taxas
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {financeiro.map((c) => (
                  <div key={c.id} className="bg-white p-6 rounded-[2rem] border border-blue-50 shadow-sm flex items-center justify-between hover:shadow-md transition-all group">
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                        c.status_pagamento === 'pago' ? 'bg-green-50 text-green-500' : 'bg-amber-50 text-amber-500'
                      }`}>
                        {c.status_pagamento === 'pago' ? <CheckCircle size={28} /> : <Clock size={28} />}
                      </div>
                      <div>
                        <p className="font-black text-slate-700 uppercase text-xs tracking-wider">{c.tipo_taxa}</p>
                        <p className="text-sm text-slate-400 font-bold">Vencimento: {new Date(c.data_vencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Valor Total</p>
                        <p className="font-black text-slate-700 text-lg">{c.valor.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                      </div>
                      
                      {c.status_pagamento !== 'pago' && c.link_pagamento ? (
                        <a 
                          href={c.link_pagamento} 
                          target="_blank" 
                          className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-xs font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
                        >
                          Pagar <ExternalLink size={16} />
                        </a>
                      ) : c.status_pagamento === 'pago' ? (
                        <span className="text-green-500 text-[10px] font-black uppercase bg-green-50 px-4 py-2 rounded-full border border-green-100 font-bold">Liquidado</span>
                      ) : (
                        <span className="text-slate-400 text-[10px] font-bold uppercase bg-slate-50 px-4 py-2 rounded-full">Pendente</span>
                      )}
                    </div>
                  </div>
                ))}
                {financeiro.length === 0 && (
                  <div className="bg-white p-12 rounded-[2rem] border border-dashed border-slate-200 text-center">
                    <p className="text-slate-400 font-medium font-bold italic">Nenhum registro financeiro encontrado.</p>
                  </div>
                )}
              </div>
            </div>

            {/* SEÇÃO: BOLETIM ACADÊMICO */}
            <div className="space-y-6">
              <div className="flex justify-between items-center pr-2">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                  <BookOpen className="text-indigo-500" /> Boletim Escolar
                </h2>
                
                {/* BOTÃO DE DOWNLOAD DO PDF INTEGRADO */}
                {aluno && boletim.length > 0 && (
                  <PDFDownloadLink
                    document={<BoletimPDF aluno={aluno} notas={boletim} />}
                    fileName={`Boletim_${aluno.nome_completo.replace(/\s+/g, '_')}_2026.pdf`}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-2xl text-xs font-black hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100"
                  >
                    {({ loading: pdfLoading }) => (
                      pdfLoading ? 'Gerando...' : <><FileDown size={16} /> Baixar PDF Oficial</>
                    )}
                  </PDFDownloadLink>
                )}
              </div>

              <div className="bg-white rounded-[2.5rem] shadow-sm border border-blue-50 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] border-b border-slate-100">
                    <tr>
                      <th className="p-6">Disciplina</th>
                      <th className="p-6 text-center">Unidade</th>
                      <th className="p-6 text-center">Média</th>
                      <th className="p-6 text-center">Faltas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {boletim.map((n) => (
                      <tr key={n.id} className="hover:bg-indigo-50/20 transition-colors">
                        <td className="p-6 font-bold text-slate-700 text-base">{n.disciplina}</td>
                        <td className="p-6 text-center text-slate-500 font-black uppercase text-xs">{n.unidade}ª Unid</td>
                        <td className="p-6 text-center">
                          <span className={`text-lg font-black ${n.nota >= 7 ? 'text-blue-600' : 'text-red-500'}`}>
                            {Number(n.nota).toFixed(1)}
                          </span>
                        </td>
                        <td className="p-6 text-center font-bold text-slate-400">{n.faltas}</td>
                      </tr>
                    ))}
                    {boletim.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-16 text-center">
                           <div className="flex flex-col items-center gap-3">
                              <Calendar className="text-slate-200" size={48} />
                              <p className="text-slate-400 font-bold text-sm">As notas do bimestre ainda não foram fechadas.</p>
                           </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: MURAL E AVISOS */}
          <div className="space-y-8">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <Megaphone className="text-orange-500" /> Mural
            </h2>

            <div className="space-y-4">
              {avisos.map((aviso) => (
                <div key={aviso.id} className={`p-8 rounded-[2.5rem] border shadow-sm flex flex-col gap-4 relative transition-transform hover:-translate-y-1 ${
                  aviso.prioridade === 'importante' 
                  ? 'bg-orange-50 border-orange-100 text-orange-900' 
                  : 'bg-white border-blue-50 text-slate-800'
                }`}>
                  <div className="flex items-center gap-2">
                    {aviso.prioridade === 'importante' ? (
                      <AlertCircle className="text-orange-500" size={20} />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    )}
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                      {aviso.prioridade === 'importante' ? 'Aviso Urgente' : 'Comunicado'}
                    </p>
                  </div>
                  <h3 className="font-black text-lg leading-tight">{aviso.titulo}</h3>
                  <p className="text-sm font-medium opacity-80 leading-relaxed">
                    {aviso.conteudo}
                  </p>
                </div>
              ))}

              {avisos.length === 0 && (
                <div className="bg-white p-10 rounded-[2.5rem] border border-dashed border-slate-200 text-center">
                  <p className="text-xs text-slate-400 font-bold uppercase">Nenhum comunicado no mural.</p>
                </div>
              )}
            </div>

            {/* CARD DE AJUDA/CONTATO */}
            <div className="bg-slate-800 p-8 rounded-[2.5rem] text-white space-y-4 shadow-xl">
              <h3 className="font-black text-xl tracking-tight text-white">Dúvidas?</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                Entre em contato com nossa secretaria para suporte técnico ou informações pedagógicas.
              </p>
              <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
                Canais de Atendimento
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}