'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, Wallet, Filter, X, Search, ArrowUpRight } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

// --- INTERFACES DE TIPAGEM CORRIGIDAS ---
interface PagamentoRecente {
  id: string
  valor: number
  data_vencimento: string
  alunos: { nome_completo: string; turma: string } | null 
}

interface DetalheItem {
  id: string
  valor: number
  data_vencimento?: string
  data_pagamento?: string
  pago_em?: string
  tipo_taxa?: string
  descricao?: string
  categoria?: string
  status_pagamento?: string
  alunos?: {
    nome_completo: string
    turma: string
  } | null
}

interface DashboardData {
  entradasMes: number
  saidasMes: number
  pendenteMes: number
  saldoMes: number
  totalAlunos: number
  pagamentosRecentes: PagamentoRecente[]
}

// Adicionada a assinatura de índice [key: string] para resolver o erro do Recharts
interface ChartEntry {
  name: string
  value: number
  [key: string]: string | number
}

const CORES_GRAFICO = ['#4ade80', '#f87171', '#facc15']

export default function AdminDashboard() {
  const dataHoje = new Date()
  const [filtroMes, setFiltroMes] = useState(dataHoje.getMonth() + 1)
  const [filtroAno, setFiltroAno] = useState(dataHoje.getFullYear())

  const [data, setData] = useState<DashboardData>({
    entradasMes: 0,
    saidasMes: 0,
    pendenteMes: 0,
    saldoMes: 0,
    totalAlunos: 0,
    pagamentosRecentes: []
  })
  
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [tipoModal, setTipoModal] = useState<'recebido' | 'pendente' | 'saida'>('pendente')
  const [listaModal, setListaModal] = useState<DetalheItem[]>([])
  const [loadingModal, setLoadingModal] = useState(false)

  useEffect(() => {
    async function fetchDashboard() {
      setLoading(true)
      const primeiroDia = new Date(filtroAno, filtroMes - 1, 1).toISOString().split('T')[0]
      const ultimoDia = new Date(filtroAno, filtroMes, 0).toISOString().split('T')[0]

      const { data: cobrancas } = await supabase
        .from('cobrancas')
        .select('valor, status_pagamento, pago_em, data_vencimento')
        .gte('data_vencimento', primeiroDia)
        .lte('data_vencimento', ultimoDia)

      const { data: despesasPagas } = await supabase
        .from('despesas')
        .select('valor')
        .eq('status', 'pago')
        .gte('data_pagamento', primeiroDia)
        .lte('data_pagamento', ultimoDia)

      const { count: countAlunos } = await supabase.from('alunos').select('*', { count: 'exact', head: true })
      
      const { data: ultimosPagos } = await supabase
        .from('cobrancas')
        .select('id, valor, data_vencimento, alunos(nome_completo, turma)')
        .eq('status_pagamento', 'pago')
        .order('pago_em', { ascending: false })
        .limit(5)

      const entradas = cobrancas?.filter(c => c.status_pagamento === 'pago').reduce((acc, curr) => acc + curr.valor, 0) || 0
      const pendentes = cobrancas?.filter(c => c.status_pagamento !== 'pago').reduce((acc, curr) => acc + curr.valor, 0) || 0
      const saidas = despesasPagas?.reduce((acc, curr) => acc + curr.valor, 0) || 0

      setData({
        entradasMes: entradas,
        saidasMes: saidas,
        pendenteMes: pendentes,
        saldoMes: entradas - saidas,
        totalAlunos: countAlunos || 0,
        pagamentosRecentes: (ultimosPagos as unknown as PagamentoRecente[]) || []
      })
      setLoading(false)
    }
    fetchDashboard()
  }, [filtroMes, filtroAno])

  async function handleAbrirModal(tipo: 'recebido' | 'pendente' | 'saida') {
    setTipoModal(tipo)
    setModalAberto(true)
    setLoadingModal(true)
    
    const primeiroDia = new Date(filtroAno, filtroMes - 1, 1).toISOString()
    const ultimoDia = new Date(filtroAno, filtroMes, 0).toISOString()

    if (tipo === 'saida') {
        const { data: saidas } = await supabase
            .from('despesas')
            .select('id, valor, descricao, categoria, data_pagamento, status')
            .eq('status', 'pago')
            .gte('data_pagamento', primeiroDia)
            .lte('data_pagamento', ultimoDia)
        setListaModal((saidas as unknown as DetalheItem[]) || [])
    } else {
        const { data: cobrancas } = await supabase
            .from('cobrancas')
            .select(`
                id, valor, data_vencimento, pago_em, tipo_taxa,
                alunos ( nome_completo, turma )
            `)
            .gte('data_vencimento', primeiroDia)
            .lte('data_vencimento', ultimoDia)
            .eq('status_pagamento', tipo === 'recebido' ? 'pago' : 'pendente')
        setListaModal((cobrancas as unknown as DetalheItem[]) || [])
    }
    setLoadingModal(false)
  }

  const dadosGrafico: ChartEntry[] = [
    { name: 'Entradas', value: data.entradasMes },
    { name: 'Saídas', value: data.saidasMes },
    { name: 'Pendente', value: data.pendenteMes }
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Painel Geral</h1>
          <p className="text-slate-500">Métricas financeiras detalhadas da escola.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-blue-50">
          <select value={filtroMes} onChange={(e) => setFiltroMes(Number(e.target.value))} className="p-2 bg-white border-0 rounded text-sm outline-none cursor-pointer font-medium text-slate-600">
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                <option key={m} value={m}>{new Date(0, m-1).toLocaleString('pt-BR', {month: 'long'})}</option>
            ))}
          </select>
          <span className="text-slate-300">|</span>
          <select value={filtroAno} onChange={(e) => setFiltroAno(Number(e.target.value))} className="p-2 bg-white border-0 rounded text-sm outline-none cursor-pointer font-medium text-slate-600">
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-20 text-center text-slate-400 font-medium animate-pulse flex flex-col items-center gap-2">
            <span className="text-2xl">✨</span>
            Carregando métricas do período...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div onClick={() => handleAbrirModal('recebido')} className="bg-white p-5 rounded-2xl shadow-sm border border-blue-50 cursor-pointer hover:border-green-200 transition-all hover:shadow-md group">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400"></span> Entradas
              </p>
              <h3 className="text-2xl font-bold text-slate-700 group-hover:text-green-600 transition-colors">{data.entradasMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
            </div>

            <div onClick={() => handleAbrirModal('saida')} className="bg-white p-5 rounded-2xl shadow-sm border border-blue-50 cursor-pointer hover:border-red-200 transition-all hover:shadow-md group">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400"></span> Saídas
              </p>
              <h3 className="text-2xl font-bold text-slate-700 group-hover:text-red-600 transition-colors">{data.saidasMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
            </div>

            <div onClick={() => handleAbrirModal('pendente')} className="bg-white p-5 rounded-2xl shadow-sm border border-blue-50 cursor-pointer hover:border-yellow-200 transition-all hover:shadow-md group">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-400"></span> A Receber
              </p>
              <h3 className="text-2xl font-bold text-slate-700 group-hover:text-yellow-600 transition-colors">{data.pendenteMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
            </div>

            <div className={`p-5 rounded-2xl shadow-md ${data.saldoMes >= 0 ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-orange-500 to-red-500'} text-white border-0`}>
              <p className="text-[10px] font-bold opacity-80 uppercase mb-2 tracking-wider">Saldo Real</p>
              <h3 className="text-2xl font-bold">{data.saldoMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
            </div>

            <div className="bg-slate-800 p-5 rounded-2xl shadow-sm text-white border-0 flex flex-col justify-between">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider flex items-center gap-2">
                <Users size={14} /> Alunos
              </p>
              <h3 className="text-2xl font-bold">{data.totalAlunos} <span className="text-sm font-normal opacity-70">Ativos</span></h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-blue-50/50 p-8 flex flex-col items-center">
                <h3 className="font-bold text-slate-700 w-full mb-6 text-center">Proporção de Caixa</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie 
                              data={dadosGrafico} 
                              cx="50%" 
                              cy="50%" 
                              innerRadius={70} 
                              outerRadius={90} 
                              paddingAngle={5} 
                              dataKey="value" 
                              stroke="none"
                            >
                                {dadosGrafico.map((_, i) => <Cell key={i} fill={CORES_GRAFICO[i]} style={{ outline: 'none' }} />)}
                            </Pie>
                            <Tooltip 
                                formatter={(value: number | string | undefined) => 
                                  Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                }
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-blue-50/50 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-blue-50 font-bold text-slate-700 flex justify-between items-center bg-blue-50/20">
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-400"></span>
                        Últimas Entradas (Caixa)
                    </span>
                </div>
                <div className="divide-y divide-blue-50 overflow-y-auto flex-1">
                    {data.pagamentosRecentes.map((pag, i) => (
                        <div key={i} className="p-5 flex justify-between items-center hover:bg-blue-50/30 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center font-bold text-lg shadow-sm">R$</div>
                                <div>
                                    <p className="text-sm font-bold text-slate-700">{pag.alunos?.nome_completo}</p>
                                    <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">{pag.alunos?.turma}</p>
                                </div>
                            </div>
                            <p className="font-extrabold text-green-500 text-base">+{pag.valor.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</p>
                        </div>
                    ))}
                    {data.pagamentosRecentes.length === 0 && (
                      <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
                        <Wallet className="text-slate-200" size={40} />
                        <p>Nenhum pagamento recente.</p>
                      </div>
                    )}
                </div>
            </div>
          </div>
        </>
      )}

      {/* MODAL DETALHADO */}
      {modalAberto && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-300 border border-white/50">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-[2rem]">
              <div>
                <h3 className="font-extrabold text-slate-800 text-xl capitalize">{tipoModal === 'saida' ? 'Extrato de Saídas' : `Cobranças: ${tipoModal}`}</h3>
                <p className="text-sm text-slate-500">Registros detalhados do mês selecionado.</p>
              </div>
              <button onClick={() => setModalAberto(false)} className="p-2 hover:bg-white rounded-full transition-colors shadow-sm"><X size={20} className="text-slate-400"/></button>
            </div>
            
            <div className="overflow-y-auto p-6 flex-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              {loadingModal ? (
                <p className="text-center py-20 font-medium text-slate-400 flex flex-col items-center gap-2">
                  <span className="text-2xl animate-bounce">✨</span>Processando dados...
                </p>
              ) : (
                <table className="w-full text-left">
                  <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="pb-4 px-4">{tipoModal === 'saida' ? 'Data Pagto' : 'Vencimento'}</th>
                      <th className="pb-4 px-4">{tipoModal === 'saida' ? 'Descrição / Categoria' : 'Aluno / Taxa'}</th>
                      <th className="pb-4 px-4 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {listaModal.map((item) => (
                      <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-5 px-4 text-sm text-slate-500 font-medium">
                            {new Date(item.pago_em || item.data_pagamento || item.data_vencimento || '').toLocaleDateString('pt-BR', {timeZone:'UTC'})}
                        </td>
                        <td className="py-5 px-4">
                            {tipoModal === 'saida' ? (
                                <div>
                                    <p className="font-bold text-slate-700 leading-tight text-sm">{item.descricao}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{item.categoria}</p>
                                </div>
                            ) : (
                                <div>
                                    <p className="font-bold text-slate-700 leading-tight text-sm">{item.alunos?.nome_completo}</p>
                                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${tipoModal === 'recebido' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>{item.tipo_taxa}</span>
                                </div>
                            )}
                        </td>
                        <td className={`py-5 px-4 text-right font-black text-base ${tipoModal === 'saida' ? 'text-red-500' : (tipoModal === 'recebido' ? 'text-green-500' : 'text-yellow-500')}`}>
                            {item.valor.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-white rounded-b-[2rem] text-right">
                <button onClick={() => setModalAberto(false)} className="px-8 py-3 bg-slate-800 text-white rounded-2xl font-bold text-sm hover:bg-slate-700 transition-all shadow-lg shadow-slate-200/50">Fechar Relatório</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}