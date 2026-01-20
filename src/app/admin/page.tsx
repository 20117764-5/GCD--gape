'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, AlertCircle, TrendingUp, Calendar, Filter, X, Search } from 'lucide-react'
// Importando os Gráficos
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

// --- TIPAGEM ---
interface PagamentoRecente {
  id: string
  valor: number
  data_vencimento: string
  alunos: {
    nome_completo: string
    turma: string
  } | null 
}

// Tipagem para a lista detalhada do Modal
interface DetalheItem {
  id: string
  valor: number
  data_vencimento: string
  pago_em?: string // Opcional, pois só existe nos recebidos
  status_pagamento: string
  alunos: {
    nome_completo: string
    turma: string
    responsaveis: {
      nome_completo: string
      telefone_wpp: string
    } | null
  } | null
}

interface DashboardData {
  recebidoMes: number
  pendenteMes: number
  totalAlunos: number
  totalAtrasado: number
  pagamentosRecentes: PagamentoRecente[]
}

// Cores do Gráfico
const CORES_GRAFICO = ['#22c55e', '#eab308'] // Verde (Pago), Amarelo (Pendente)

export default function AdminDashboard() {
  // Filtros
  const dataHoje = new Date()
  const [filtroMes, setFiltroMes] = useState(dataHoje.getMonth() + 1)
  const [filtroAno, setFiltroAno] = useState(dataHoje.getFullYear())

  // Dados Gerais
  const [data, setData] = useState<DashboardData>({
    recebidoMes: 0,
    pendenteMes: 0,
    totalAlunos: 0,
    totalAtrasado: 0,
    pagamentosRecentes: []
  })
  
  // Controle do Modal
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [tipoModal, setTipoModal] = useState<'recebido' | 'pendente'>('pendente')
  const [listaModal, setListaModal] = useState<DetalheItem[]>([])
  const [loadingModal, setLoadingModal] = useState(false)

  // --- BUSCA DADOS GERAIS (Dashboard) ---
  useEffect(() => {
    async function fetchDashboard() {
      setLoading(true)
      const primeiroDia = new Date(filtroAno, filtroMes - 1, 1).toISOString()
      const ultimoDia = new Date(filtroAno, filtroMes, 0).toISOString()
      const dataHojeStr = new Date().toISOString().split('T')[0]

      // 1. Cobranças do Mês
      const { data: cobrancasDoPeriodo } = await supabase
        .from('cobrancas')
        .select('valor, status_pagamento, data_vencimento')
        .gte('data_vencimento', primeiroDia)
        .lte('data_vencimento', ultimoDia)

      // 2. Alunos
      const { count: countAlunos } = await supabase.from('alunos').select('*', { count: 'exact', head: true })

      // 3. Atrasado Geral (Acumulado)
      const { data: cobrancasAtrasadasGeral } = await supabase
        .from('cobrancas')
        .select('valor')
        .eq('status_pagamento', 'pendente')
        .lt('data_vencimento', dataHojeStr)

      // 4. Últimos Pagos (Para a lista lateral)
      const { data: ultimosPagos } = await supabase
        .from('cobrancas')
        .select('id, valor, data_vencimento, alunos(nome_completo, turma)')
        .eq('status_pagamento', 'pago')
        .order('pago_em', { ascending: false })
        .limit(5)

      // Cálculos
      const recebido = cobrancasDoPeriodo?.filter(c => c.status_pagamento === 'pago').reduce((acc, curr) => acc + curr.valor, 0) || 0
      const pendente = cobrancasDoPeriodo?.filter(c => c.status_pagamento !== 'pago').reduce((acc, curr) => acc + curr.valor, 0) || 0
      const atrasadoGeral = cobrancasAtrasadasGeral?.reduce((acc, curr) => acc + curr.valor, 0) || 0

      setData({
        recebidoMes: recebido,
        pendenteMes: pendente,
        totalAlunos: countAlunos || 0,
        totalAtrasado: atrasadoGeral,
        pagamentosRecentes: (ultimosPagos as unknown as PagamentoRecente[]) || []
      })
      setLoading(false)
    }
    fetchDashboard()
  }, [filtroMes, filtroAno])

  // --- FUNÇÃO PARA ABRIR LISTAS ---
  async function handleAbrirModal(tipo: 'recebido' | 'pendente') {
    setTipoModal(tipo)
    setModalAberto(true)
    setLoadingModal(true)
    setListaModal([]) 
    
    const primeiroDia = new Date(filtroAno, filtroMes - 1, 1).toISOString()
    const ultimoDia = new Date(filtroAno, filtroMes, 0).toISOString()

    let query = supabase
      .from('cobrancas')
      .select(`
        id, valor, data_vencimento, pago_em, status_pagamento,
        alunos (
          nome_completo, 
          turma,
          responsaveis (nome_completo, telefone_wpp)
        )
      `)
      .gte('data_vencimento', primeiroDia)
      .lte('data_vencimento', ultimoDia)

    if (tipo === 'recebido') {
        query = query.eq('status_pagamento', 'pago').order('pago_em', { ascending: false })
    } else {
        query = query.neq('status_pagamento', 'pago').order('data_vencimento', { ascending: true })
    }

    const { data: resultados } = await query

    if (resultados) {
      setListaModal(resultados as unknown as DetalheItem[])
    }
    setLoadingModal(false)
  }

  // Dados para o Gráfico
  const dadosGrafico = [
    { name: 'Recebido', value: data.recebidoMes },
    { name: 'Pendente', value: data.pendenteMes },
  ]
  const temDadosGrafico = data.recebidoMes > 0 || data.pendenteMes > 0

  return (
    <div className="max-w-6xl mx-auto space-y-8 relative">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Painel Geral</h1>
          <p className="text-slate-500">Visão geral financeira e acadêmica.</p>
        </div>

        <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center px-2 text-slate-500 gap-2 font-medium text-sm">
            <Filter size={16} /> Período:
          </div>
          <select value={filtroMes} onChange={(e) => setFiltroMes(Number(e.target.value))} className="p-2 bg-slate-50 border rounded text-sm outline-none cursor-pointer">
            <option value={1}>Janeiro</option>
            <option value={2}>Fevereiro</option>
            <option value={3}>Março</option>
            <option value={4}>Abril</option>
            <option value={5}>Maio</option>
            <option value={6}>Junho</option>
            <option value={7}>Julho</option>
            <option value={8}>Agosto</option>
            <option value={9}>Setembro</option>
            <option value={10}>Outubro</option>
            <option value={11}>Novembro</option>
            <option value={12}>Dezembro</option>
          </select>
          <select value={filtroAno} onChange={(e) => setFiltroAno(Number(e.target.value))} className="p-2 bg-slate-50 border rounded text-sm outline-none cursor-pointer">
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Carregando painel...</div>
      ) : (
        <>
          {/* --- CARDS --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* CARD 1: RECEBIDO (CLICÁVEL) */}
            <div 
              onClick={() => handleAbrirModal('recebido')}
              className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between cursor-pointer hover:shadow-md hover:border-green-300 transition group"
            >
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1 group-hover:text-green-600 transition">Recebido (Ver Lista)</p>
                <h3 className="text-2xl font-bold text-slate-800 group-hover:text-green-600 transition">
                  {data.recebidoMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </h3>
                <p className="text-[10px] text-blue-500 mt-1 flex items-center gap-1">Clique para detalhar <Search size={10}/></p>
              </div>
              <div className="p-3 bg-green-50 text-green-600 rounded-lg group-hover:bg-green-100 transition"><TrendingUp size={24} /></div>
            </div>

            {/* CARD 2: PENDENTE (CLICÁVEL) */}
            <div 
              onClick={() => handleAbrirModal('pendente')}
              className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between cursor-pointer hover:shadow-md hover:border-yellow-300 transition group"
            >
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1 group-hover:text-yellow-600 transition">Pendente (Ver Lista)</p>
                <h3 className="text-2xl font-bold text-slate-800 group-hover:text-yellow-600 transition">
                  {data.pendenteMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </h3>
                <p className="text-[10px] text-blue-500 mt-1 flex items-center gap-1">Clique para detalhar <Search size={10}/></p>
              </div>
              <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg group-hover:bg-yellow-100 transition"><Calendar size={24} /></div>
            </div>

            {/* CARD 3: DÍVIDA TOTAL */}
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 mb-1 font-bold">Dívida Total</p>
                <h3 className="text-2xl font-bold text-red-600">
                  {data.totalAtrasado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </h3>
              </div>
              <div className="p-3 bg-red-50 text-red-600 rounded-lg"><AlertCircle size={24} /></div>
            </div>

            {/* CARD 4: ALUNOS */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Alunos</p>
                <h3 className="text-2xl font-bold text-slate-800">{data.totalAlunos}</h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users size={24} /></div>
            </div>
          </div>

          {/* --- GRÁFICOS E LISTAS --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* GRÁFICO DE DONUT */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center">
                <h3 className="font-bold text-slate-700 w-full mb-4">Balanço Mensal</h3>
                
                {temDadosGrafico ? (
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={dadosGrafico}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {dadosGrafico.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CORES_GRAFICO[index % CORES_GRAFICO.length]} />
                                    ))}
                                </Pie>
                                {/* CORREÇÃO AQUI: Tipagem segura para aceitar string/number/undefined */}
                                <Tooltip 
                                    formatter={(value: number | string | undefined) => 
                                        Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                    } 
                                />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                        Sem dados financeiros neste mês.
                    </div>
                )}
            </div>

            {/* LISTA DE ÚLTIMOS PAGOS */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-700">Últimos Recebimentos</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {data.pagamentosRecentes.length === 0 ? (
                    <p className="p-6 text-center text-slate-400 text-sm">Nenhum pagamento recente.</p>
                ) : (
                    data.pagamentosRecentes.map((pag, index) => (
                    <div key={index} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs">R$</div>
                            <div>
                                <p className="text-sm font-medium text-slate-800">{pag.alunos?.nome_completo || 'Aluno Excluído'}</p>
                                <p className="text-xs text-slate-500">{pag.alunos?.turma}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-slate-700">
                                + {pag.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                            <p className="text-xs text-slate-400">
                                {new Date(pag.data_vencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                            </p>
                        </div>
                    </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* --- MODAL DE DETALHES --- */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
            
            {/* Cabeçalho Modal */}
            <div className={`p-4 border-b border-slate-100 flex justify-between items-center rounded-t-xl ${tipoModal === 'recebido' ? 'bg-green-50' : 'bg-yellow-50'}`}>
              <div>
                <h3 className={`font-bold text-lg ${tipoModal === 'recebido' ? 'text-green-700' : 'text-yellow-700'}`}>
                    {tipoModal === 'recebido' ? `Recebimentos de ${filtroMes}/${filtroAno}` : `Pendências de ${filtroMes}/${filtroAno}`}
                </h3>
                <p className="text-xs text-slate-500">
                    {tipoModal === 'recebido' ? 'Lista de pagamentos confirmados.' : 'Lista de quem ainda não pagou.'}
                </p>
              </div>
              <button onClick={() => setModalAberto(false)} className="p-2 hover:bg-slate-200 rounded-full transition">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            {/* Corpo Modal */}
            <div className="overflow-y-auto p-4 flex-1">
              {loadingModal ? (
                <div className="text-center py-10 text-slate-400">Carregando lista...</div>
              ) : listaModal.length === 0 ? (
                <div className="text-center py-10 text-slate-500 font-medium">
                  Nenhum registro encontrado.
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0">
                    <tr>
                      <th className="p-3">{tipoModal === 'recebido' ? 'Pago em' : 'Vencimento'}</th>
                      <th className="p-3">Aluno</th>
                      <th className="p-3">Responsável</th>
                      <th className="p-3 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {listaModal.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="p-3 text-slate-600 font-medium">
                           {tipoModal === 'recebido' && item.pago_em 
                              ? new Date(item.pago_em).toLocaleDateString('pt-BR') 
                              : new Date(item.data_vencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})
                           }
                        </td>
                        <td className="p-3 font-medium text-slate-800">
                          {item.alunos?.nome_completo}
                          <span className="block text-xs text-slate-400">{item.alunos?.turma}</span>
                        </td>
                        <td className="p-3 text-slate-600">
                          {item.alunos?.responsaveis?.nome_completo}
                          <span className="block text-xs text-blue-600">{item.alunos?.responsaveis?.telefone_wpp}</span>
                        </td>
                        <td className={`p-3 text-right font-bold ${tipoModal === 'recebido' ? 'text-green-600' : 'text-yellow-600'}`}>
                          {item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Rodapé */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl text-right">
              <button onClick={() => setModalAberto(false)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}