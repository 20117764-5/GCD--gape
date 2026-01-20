'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { PlusCircle, Search, Trash2, CheckCircle, TrendingDown, Calendar, Filter } from 'lucide-react'

interface Despesa {
  id: string
  descricao: string
  categoria: string
  valor: number
  data_vencimento: string
  data_pagamento: string | null
  status: 'pendente' | 'pago'
}

export default function Despesas() {
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [atualizar, setAtualizar] = useState(0) // <--- O "Gatilho" Mágico
  
  // Filtros
  const dataHoje = new Date()
  const [filtroMes, setFiltroMes] = useState(dataHoje.getMonth() + 1)
  const [filtroAno, setFiltroAno] = useState(dataHoje.getFullYear())

  // --- BUSCAR DADOS (DENTRO DO EFFECT) ---
  useEffect(() => {
    async function fetchDespesas() {
      setLoading(true)
      const primeiroDia = new Date(filtroAno, filtroMes - 1, 1).toISOString().split('T')[0]
      const ultimoDia = new Date(filtroAno, filtroMes, 0).toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('despesas')
        .select('*')
        .gte('data_vencimento', primeiroDia)
        .lte('data_vencimento', ultimoDia)
        .order('data_vencimento', { ascending: true })

      if (data) setDespesas(data as Despesa[])
      setLoading(false)
    }

    fetchDespesas()
  }, [filtroMes, filtroAno, atualizar]) // Roda se mudar Mês, Ano ou o Gatilho

  // --- NOVA DESPESA ---
  async function handleNovaDespesa(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const dados = Object.fromEntries(formData)

    const { error } = await supabase.from('despesas').insert([{
      descricao: dados.descricao,
      categoria: dados.categoria,
      valor: parseFloat(dados.valor.toString()),
      data_vencimento: dados.vencimento,
      status: 'pendente'
    }])

    if (!error) {
      alert('Despesa lançada!')
      setModalAberto(false)
      setAtualizar(prev => prev + 1) // Aciona o gatilho para atualizar a lista
    } else {
      alert('Erro ao salvar.')
    }
  }

  // --- AÇÕES (PAGAR / EXCLUIR) ---
  async function marcarComoPago(id: string) {
    if(!confirm('Confirmar pagamento desta conta?')) return
    await supabase.from('despesas').update({ 
      status: 'pago', 
      data_pagamento: new Date().toISOString() 
    }).eq('id', id)
    
    setAtualizar(prev => prev + 1) // Atualiza a lista
  }

  async function excluir(id: string) {
    if(!confirm('Apagar este registro?')) return
    await supabase.from('despesas').delete().eq('id', id)
    
    setAtualizar(prev => prev + 1) // Atualiza a lista
  }

  // KPI
  const totalMes = despesas.reduce((acc, curr) => acc + curr.valor, 0)
  const totalPago = despesas.filter(d => d.status === 'pago').reduce((acc, curr) => acc + curr.valor, 0)

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingDown className="text-red-600"/> Contas a Pagar
          </h1>
          <p className="text-slate-500">Gestão de saídas e despesas operacionais.</p>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm border border-slate-200">
          <Filter size={16} className="text-slate-400 ml-2" />
          <select value={filtroMes} onChange={(e) => setFiltroMes(Number(e.target.value))} className="p-2 bg-transparent text-sm outline-none cursor-pointer">
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
          <select value={filtroAno} onChange={(e) => setFiltroAno(Number(e.target.value))} className="p-2 bg-transparent text-sm outline-none cursor-pointer">
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        </div>
      </div>

      {/* Cards Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500 font-medium">Total de Despesas (Mês)</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalMes.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
            <p className="text-sm text-slate-500 font-medium">Já Pago</p>
            <h3 className="text-2xl font-bold text-green-600">{totalPago.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</h3>
        </div>
        <button 
            onClick={() => setModalAberto(true)}
            className="bg-red-600 hover:bg-red-700 text-white p-6 rounded-xl shadow-lg shadow-red-200 transition flex flex-col items-center justify-center gap-2"
        >
            <PlusCircle size={28} />
            <span className="font-bold">Nova Despesa</span>
        </button>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                <tr>
                    <th className="p-4">Vencimento</th>
                    <th className="p-4">Descrição</th>
                    <th className="p-4">Categoria</th>
                    <th className="p-4">Valor</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {despesas.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50">
                        <td className="p-4 text-slate-600 flex items-center gap-2">
                            <Calendar size={14}/> {new Date(d.data_vencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                        </td>
                        <td className="p-4 font-medium text-slate-800">{d.descricao}</td>
                        <td className="p-4">
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs border border-slate-200">
                                {d.categoria}
                            </span>
                        </td>
                        <td className="p-4 font-bold text-red-600">
                            - {d.valor.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                        </td>
                        <td className="p-4">
                            {d.status === 'pago' ? (
                                <span className="text-green-600 text-xs font-bold flex items-center gap-1"><CheckCircle size={12}/> PAGO</span>
                            ) : (
                                <span className="text-yellow-600 text-xs font-bold bg-yellow-50 px-2 py-1 rounded">PENDENTE</span>
                            )}
                        </td>
                        <td className="p-4 text-right flex justify-end gap-2">
                            {d.status !== 'pago' && (
                                <button onClick={() => marcarComoPago(d.id)} title="Marcar Pago" className="p-2 text-green-600 hover:bg-green-50 rounded"><CheckCircle size={18}/></button>
                            )}
                            <button onClick={() => excluir(d.id)} title="Excluir" className="p-2 text-red-400 hover:bg-red-50 rounded"><Trash2 size={18}/></button>
                        </td>
                    </tr>
                ))}
                {despesas.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-slate-400">Nenhuma despesa lançada neste mês.</td></tr>
                )}
            </tbody>
        </table>
      </div>

      {/* Modal Nova Despesa */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <h3 className="font-bold text-lg mb-4 text-slate-700">Lançar Nova Despesa</h3>
                <form onSubmit={handleNovaDespesa} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Descrição</label>
                        <input name="descricao" required placeholder="Ex: Conta de Luz" className="w-full p-2 border rounded" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Valor (R$)</label>
                            <input name="valor" type="number" step="0.01" required className="w-full p-2 border rounded" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Vencimento</label>
                            <input name="vencimento" type="date" required className="w-full p-2 border rounded" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Categoria</label>
                        <select name="categoria" className="w-full p-2 border rounded bg-white">
                            <option value="Fixa">Despesa Fixa (Água, Luz, Aluguel)</option>
                            <option value="Pessoal">Folha de Pagamento</option>
                            <option value="Manutencao">Manutenção / Limpeza</option>
                            <option value="Material">Material Escolar/Escritório</option>
                            <option value="Outros">Outros</option>
                        </select>
                    </div>
                    <div className="flex gap-2 pt-4">
                        <button type="button" onClick={() => setModalAberto(false)} className="flex-1 p-3 bg-slate-100 text-slate-600 rounded font-medium hover:bg-slate-200">Cancelar</button>
                        <button className="flex-1 p-3 bg-red-600 text-white rounded font-bold hover:bg-red-700">Salvar Despesa</button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  )
}