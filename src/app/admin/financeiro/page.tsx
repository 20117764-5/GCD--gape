'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { FileText, DollarSign, ExternalLink, Send, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import dynamic from 'next/dynamic'

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false, loading: () => <span className="text-xs">...</span> }
)

import { ReciboDoc } from '@/components/pdf/ReciboDoc'

// --- TIPAGEM ---
interface Cobranca {
  id: string
  valor: number
  data_vencimento: string
  pago_em: string | null
  tipo_taxa: string
  status_pagamento: string
  link_pagamento: string | null
  alunos: {
    nome_completo: string
    turma: string
    responsaveis: {
      nome_completo: string
      cpf: string
      telefone_wpp: string
    } | null
  } | null
}

export default function GestaoFinanceira() {
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([])
  const [loading, setLoading] = useState(true) // Já começa como true
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pago' | 'pendente' | 'atrasado'>('todos')
  const [dataHoje] = useState(new Date().toISOString().split('T')[0])

  // EFEITO DE BUSCA
  useEffect(() => {
    async function loadData() {
      try {
        const { data, error } = await supabase
          .from('cobrancas')
          .select(`
            *,
            alunos (
              nome_completo, turma,
              responsaveis (nome_completo, cpf, telefone_wpp)
            )
          `)
          .order('data_vencimento', { ascending: false })

        if (error) throw error
        if (data) setCobrancas(data as unknown as Cobranca[])
      } catch (err) {
        console.error('Erro ao buscar cobranças:', err)
      } finally {
        setLoading(false) // Desliga o loading apenas no final
      }
    }

    loadData()
  }, []) // Roda apenas uma vez ao montar

  // Função para definir o status real baseado na data
  const getStatusInfo = (item: Cobranca) => {
    if (item.status_pagamento === 'pago') return { label: 'pago', display: 'Pago', color: 'bg-green-100 text-green-700', icon: CheckCircle }
    if (item.data_vencimento < dataHoje) return { label: 'atrasado', display: 'Atrasado', color: 'bg-red-100 text-red-700', icon: AlertCircle }
    return { label: 'pendente', display: 'Pendente', color: 'bg-yellow-100 text-yellow-700', icon: Clock }
  }

  // Enviar WhatsApp
  const enviarCobranca = (item: Cobranca) => {
    const tel = item.alunos?.responsaveis?.telefone_wpp.replace(/\D/g, '')
    if (!tel) return alert('Telefone não cadastrado.')
    
    const msg = `Olá, informamos que a cobrança de ${item.tipo_taxa} do(a) aluno(a) ${item.alunos?.nome_completo}, com vencimento em ${new Date(item.data_vencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}, encontra-se disponível: ${item.link_pagamento}`
    
    window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  // Filtro de tela
  const cobrancasFiltradas = cobrancas.filter(c => {
    const status = getStatusInfo(c).label
    if (filtroStatus === 'todos') return true
    return status === filtroStatus
  })

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <DollarSign className="text-blue-600"/> Gestão Financeira
          </h1>
          <p className="text-slate-500">Controle de cobranças, links de pagamento e recibos.</p>
        </div>

        {/* Filtros de Status */}
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
          {(['todos', 'pago', 'pendente', 'atrasado'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFiltroStatus(s)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition ${filtroStatus === s ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b">
            <tr>
              <th className="p-4">Vencimento</th>
              <th className="p-4">Aluno / Responsável</th>
              <th className="p-4">Valor</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
               <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-medium">Carregando cobranças...</td></tr>
            ) : cobrancasFiltradas.length === 0 ? (
               <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nenhuma cobrança encontrada.</td></tr>
            ) : cobrancasFiltradas.map((item) => {
              const status = getStatusInfo(item)
              return (
                <tr key={item.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-4 text-slate-600 font-medium">
                    {new Date(item.data_vencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{item.alunos?.nome_completo}</div>
                    <div className="text-xs text-slate-400">{item.alunos?.responsaveis?.nome_completo}</div>
                  </td>
                  <td className="p-4 font-bold text-slate-700">
                    {item.valor.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${status.color}`}>
                      <status.icon size={12} /> {status.display}
                    </span>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    {item.link_pagamento && (
                      <a href={item.link_pagamento} target="_blank" rel="noreferrer" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Ver Boleto">
                        <ExternalLink size={18} />
                      </a>
                    )}
                    
                    {item.status_pagamento !== 'pago' && (
                      <button onClick={() => enviarCobranca(item)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition" title="Enviar WhatsApp">
                        <Send size={18} />
                      </button>
                    )}

                    {item.status_pagamento === 'pago' && (
                      <PDFDownloadLink
                        document={<ReciboDoc dados={{
                          id_transacao: item.id,
                          aluno: item.alunos?.nome_completo || '',
                          responsavel: item.alunos?.responsaveis?.nome_completo || '',
                          cpf_responsavel: item.alunos?.responsaveis?.cpf || '',
                          valor: item.valor,
                          data_pagamento: item.pago_em ? new Date(item.pago_em).toLocaleDateString('pt-BR') : '--',
                          referente_a: item.tipo_taxa,
                          forma_pagamento: 'Boleto/Pix'
                        }} />}
                        fileName={`recibo_${item.alunos?.nome_completo.split(' ')[0]}.pdf`}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                      >
                        {({ loading: pdfLoading }: { loading: boolean }) => (
                            pdfLoading ? <span className="animate-pulse">...</span> : <FileText size={18} />
                        )}
                      </PDFDownloadLink>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}