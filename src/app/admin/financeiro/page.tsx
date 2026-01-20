'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle, AlertCircle, Trash2, Calendar, Filter, FileText, Send, Link as LinkIcon } from 'lucide-react'

// Tipagem atualizada com Link e Telefone
interface Cobranca {
  id: string
  valor: number
  tipo_taxa: string
  data_vencimento: string
  status_pagamento: 'pendente' | 'pago' | 'atrasado' | 'cancelado'
  observacao: string
  link_pagamento: string // <--- NOVO
  alunos: {
    nome_completo: string
    turma: string
    responsaveis: {         // <--- NOVO: Precisamos do zap do pai
      nome_completo: string
      telefone_wpp: string
    } | null
  } | null
}

export default function Financeiro() {
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([])
  const [loading, setLoading] = useState(true)
  const [atualizar, setAtualizar] = useState(0)

  // Filtros
  const dataHoje = new Date()
  const [filtroMes, setFiltroMes] = useState(dataHoje.getMonth() + 1)
  const [filtroAno, setFiltroAno] = useState(dataHoje.getFullYear())

  useEffect(() => {
    async function fetchFinanceiro() {
      setLoading(true)
      
      const dataInicio = new Date(filtroAno, filtroMes - 1, 1).toISOString().split('T')[0]
      const dataFim = new Date(filtroAno, filtroMes, 0).toISOString().split('T')[0]

      let query = supabase
        .from('cobrancas')
        // Trazemos também o responsável aninhado dentro de alunos
        .select('*, alunos(nome_completo, turma, responsaveis(nome_completo, telefone_wpp))')
        .order('data_vencimento', { ascending: true })
        
      if (filtroMes && filtroAno) {
        query = query.gte('data_vencimento', dataInicio).lte('data_vencimento', dataFim)
      }

      const { data, error } = await query

      if (data) setCobrancas(data as unknown as Cobranca[])
      if (error) console.error(error)
      setLoading(false)
    }

    fetchFinanceiro()
  }, [filtroMes, filtroAno, atualizar])

  async function marcarComoPago(id: string) {
    if (!confirm('Confirmar o recebimento deste valor?')) return
    const { error } = await supabase.from('cobrancas').update({ status_pagamento: 'pago', pago_em: new Date().toISOString() }).eq('id', id)
    if (!error) setAtualizar((prev) => prev + 1)
  }

  async function excluirCobranca(id: string) {
    if (!confirm('Tem certeza que deseja apagar esta cobrança?')) return
    const { error } = await supabase.from('cobrancas').delete().eq('id', id)
    if (!error) setAtualizar((prev) => prev + 1)
  }

  // --- FUNÇÃO NOVA: ENVIAR WHATSAPP ---
  function enviarWhatsApp(c: Cobranca) {
    if (!c.alunos?.responsaveis?.telefone_wpp) {
      alert('Responsável sem telefone cadastrado.')
      return
    }
    if (!c.link_pagamento) {
      alert('Esta cobrança não tem link de pagamento gerado.')
      return
    }

    // Limpa o telefone (deixa só números)
    const telefone = c.alunos.responsaveis.telefone_wpp.replace(/\D/g, '')
    
    // Cria a mensagem
    const mensagem = `Olá *${c.alunos.responsaveis.nome_completo}*! \n` +
      `Segue o link para pagamento da *${c.tipo_taxa}* do aluno(a) *${c.alunos.nome_completo}*.\n` +
      `Vencimento: ${new Date(c.data_vencimento).toLocaleDateString('pt-BR')}\n` +
      `Valor: R$ ${c.valor.toFixed(2)}\n\n` +
      `Link: ${c.link_pagamento}`

    // Abre o WhatsApp Web
    window.open(`https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`, '_blank')
  }

  // KPIs
  const totalPendente = cobrancas
    .filter(c => c.status_pagamento === 'pendente' || c.status_pagamento === 'atrasado')
    .reduce((acc, curr) => acc + curr.valor, 0)

  const totalRecebido = cobrancas
    .filter(c => c.status_pagamento === 'pago')
    .reduce((acc, curr) => acc + curr.valor, 0)

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Cabeçalho e Filtros (IGUAL AO ANTERIOR) */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Controle Financeiro</h1>
          <div className="text-sm text-slate-500">CGD Ágape System</div>
        </div>

        <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center px-2 text-slate-500 gap-2 font-medium text-sm">
            <Filter size={16} /> Filtrar:
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

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-400">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-50 rounded-full text-yellow-600"><AlertCircle size={24} /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">A Receber</p>
              <h3 className="text-2xl font-bold text-slate-800">{totalPendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-full text-green-600"><CheckCircle size={24} /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Recebido</p>
              <h3 className="text-2xl font-bold text-slate-800">{totalRecebido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-full text-blue-600"><FileText size={24} /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Lançamentos</p>
              <h3 className="text-2xl font-bold text-slate-800">{cobrancas.length}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4 items-center bg-slate-50">
          <h2 className="font-semibold text-slate-700">Movimentações de {filtroMes}/{filtroAno}</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando dados...</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="p-4">Vencimento</th>
                <th className="p-4">Aluno</th>
                <th className="p-4">Descrição</th>
                <th className="p-4">Valor</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cobrancas.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      {new Date(c.data_vencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                    </div>
                  </td>
                  <td className="p-4 font-medium text-slate-800">
                    {c.alunos?.nome_completo} 
                    <span className="text-xs text-slate-400 block">{c.alunos?.turma}</span>
                  </td>
                  <td className="p-4 text-slate-600">
                    <span className="capitalize">{c.tipo_taxa}</span>
                    {c.observacao && <span className="block text-xs text-slate-400 italic max-w-[200px] truncate">{c.observacao}</span>}
                  </td>
                  <td className="p-4 font-bold text-slate-700">
                    {c.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="p-4">
                     {/* BADGES DE STATUS */}
                     {c.status_pagamento === 'pago' ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">PAGO</span>
                    ) : c.status_pagamento === 'pendente' ? (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">PENDENTE</span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">ATRASADO</span>
                    )}
                  </td>
                  <td className="p-4 text-right flex items-center justify-end gap-2">
                    
                    {/* BOTÃO WHATSAPP (Só se tiver link e não estiver pago) */}
                    {c.link_pagamento && c.status_pagamento !== 'pago' && (
                      <button 
                        onClick={() => enviarWhatsApp(c)}
                        title="Enviar Cobrança no WhatsApp"
                        className="p-2 hover:bg-blue-100 text-blue-600 rounded transition"
                      >
                        <Send size={18} />
                      </button>
                    )}

                    {/* BOTÃO ABRIR LINK (Se quiser ver o boleto de novo) */}
                    {c.link_pagamento && (
                      <button 
                        onClick={() => window.open(c.link_pagamento, '_blank')}
                        title="Ver Boleto/Pix"
                        className="p-2 hover:bg-slate-100 text-slate-500 rounded transition"
                      >
                        <LinkIcon size={18} />
                      </button>
                    )}

                    {c.status_pagamento !== 'pago' && (
                      <button 
                        onClick={() => marcarComoPago(c.id)}
                        title="Baixa Manual (Recebido em dinheiro)"
                        className="p-2 hover:bg-green-100 text-green-600 rounded transition"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                    <button onClick={() => excluirCobranca(c.id)} className="p-2 hover:bg-red-100 text-red-600 rounded transition"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
              {cobrancas.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">Nenhuma movimentação para este mês.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}