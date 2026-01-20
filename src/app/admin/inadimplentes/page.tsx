'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AlertTriangle, ChevronDown, ChevronUp, Send, Calendar } from 'lucide-react'

// --- TIPAGENS ---

// 1. Tipo do dado "bruto" que vem do Supabase (linha por linha)
interface CobrancaRaw {
  id: string
  valor: number
  data_vencimento: string
  tipo_taxa: string
  link_pagamento: string | null
  alunos: {
    id: string
    nome_completo: string
    turma: string
    responsaveis: {
      nome_completo: string
      telefone_wpp: string
    } | null
  } | null
}

// 2. Tipo do dado "limpo" para exibir na lista de detalhes
interface CobrancaDetalhe {
  id: string
  valor: number
  data_vencimento: string
  tipo_taxa: string
  link_pagamento: string | null
}

// 3. Tipo do Aluno Agrupado (O objeto final da tela)
interface AlunoDevedor {
  id: string
  nome: string
  turma: string
  responsavel: string
  telefone: string
  total_divida: number
  quantidade_boletos: number
  cobrancas: CobrancaDetalhe[]
}

export default function Inadimplentes() {
  const [listaDevedores, setListaDevedores] = useState<AlunoDevedor[]>([])
  const [loading, setLoading] = useState(true)
  const [expandido, setExpandido] = useState<string | null>(null)

  useEffect(() => {
    async function fetchInadimplentes() {
      const hoje = new Date().toISOString().split('T')[0]

      // 1. Busca TUDO que está pendente e VENCIDO
      const { data, error } = await supabase
        .from('cobrancas')
        .select(`
          id, valor, data_vencimento, tipo_taxa, link_pagamento,
          alunos (
            id, nome_completo, turma,
            responsaveis (nome_completo, telefone_wpp)
          )
        `)
        .eq('status_pagamento', 'pendente')
        .lt('data_vencimento', hoje)
        .order('data_vencimento')

      if (error) {
        console.error(error)
        setLoading(false)
        return
      }

      // 2. Agrupamento
      const agrupado: Record<string, AlunoDevedor> = {}
      
      // Converte o data para o tipo Raw para o TypeScript não reclamar
      const listaBruta = data as unknown as CobrancaRaw[]

      listaBruta.forEach((item) => {
        const alunoId = item.alunos?.id
        if (!alunoId) return

        // Se o aluno ainda não está na lista, cria ele
        if (!agrupado[alunoId]) {
          agrupado[alunoId] = {
            id: alunoId,
            nome: item.alunos?.nome_completo || 'Sem Nome',
            turma: item.alunos?.turma || '-',
            responsavel: item.alunos?.responsaveis?.nome_completo || 'Não inf.',
            telefone: item.alunos?.responsaveis?.telefone_wpp || '',
            total_divida: 0,
            quantidade_boletos: 0,
            cobrancas: []
          }
        }

        // Adiciona a dívida
        agrupado[alunoId].total_divida += item.valor
        agrupado[alunoId].quantidade_boletos += 1
        agrupado[alunoId].cobrancas.push({
          id: item.id,
          valor: item.valor,
          data_vencimento: item.data_vencimento,
          tipo_taxa: item.tipo_taxa,
          link_pagamento: item.link_pagamento
        })
      })

      // Ordena por maior dívida
      const arrayDevedores = Object.values(agrupado).sort((a, b) => b.total_divida - a.total_divida)

      setListaDevedores(arrayDevedores)
      setLoading(false)
    }

    fetchInadimplentes()
  }, [])

  function toggleExpandir(id: string) {
    if (expandido === id) setExpandido(null)
    else setExpandido(id)
  }

  function cobrarGeral(aluno: AlunoDevedor) {
    if (!aluno.telefone) return alert('Sem telefone cadastrado.')
    
    const msg = `Olá ${aluno.responsavel}, notamos que o aluno(a) *${aluno.nome}* possui *${aluno.quantidade_boletos} pendências* em aberto totalizando *${aluno.total_divida.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}*. Poderia entrar em contato para regularizarmos?`
    
    const tel = aluno.telefone.replace(/\D/g, '')
    window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const totalGeralDivida = listaDevedores.reduce((acc, curr) => acc + curr.total_divida, 0)

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-red-600 flex items-center gap-2">
            <AlertTriangle /> Inadimplência
          </h1>
          <p className="text-slate-500">Relatório de alunos com pagamentos vencidos.</p>
        </div>

        {/* Card de Resumo */}
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-4">
            <div className="bg-red-100 p-3 rounded-full text-red-600">
                <AlertTriangle size={24} />
            </div>
            <div>
                <p className="text-xs text-red-500 font-bold uppercase">Total a Recuperar</p>
                <p className="text-2xl font-bold text-red-700">
                    {totalGeralDivida.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
            </div>
        </div>
      </div>

      {/* Tabela de Devedores */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h2 className="font-bold text-slate-700">Lista de Alunos Devedores</h2>
            <div className="text-xs text-slate-400">{listaDevedores.length} alunos encontrados</div>
        </div>

        {loading ? (
            <div className="p-12 text-center text-slate-400">Calculando dívidas...</div>
        ) : listaDevedores.length === 0 ? (
            <div className="p-12 text-center text-green-600 font-medium flex flex-col items-center gap-2">
                <span>🎉</span>
                Nenhum aluno inadimplente no momento!
            </div>
        ) : (
            <div>
                {listaDevedores.map((aluno) => (
                    <div key={aluno.id} className="border-b border-slate-100 last:border-0">
                        
                        {/* LINHA PRINCIPAL (ALUNO) */}
                        <div 
                            className={`p-4 flex flex-col md:flex-row items-center justify-between hover:bg-red-50/30 transition cursor-pointer ${expandido === aluno.id ? 'bg-red-50/50' : ''}`}
                            onClick={() => toggleExpandir(aluno.id)}
                        >
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <button className="text-slate-400 hover:text-slate-600">
                                    {expandido === aluno.id ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                                </button>
                                <div>
                                    <h3 className="font-bold text-slate-800">{aluno.nome}</h3>
                                    <p className="text-sm text-slate-500">{aluno.turma} • Resp: {aluno.responsavel}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 mt-4 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                                <div className="text-right">
                                    <p className="text-xs text-slate-500">Pendências</p>
                                    <p className="font-medium text-slate-700">{aluno.quantidade_boletos} boletos</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500">Total Devido</p>
                                    <p className="font-bold text-red-600 text-lg">
                                        {aluno.total_divida.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                </div>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        cobrarGeral(aluno)
                                    }}
                                    className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                                    title="Cobrar no WhatsApp"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>

                        {/* DETALHES (LISTA DE BOLETOS) */}
                        {expandido === aluno.id && (
                            <div className="bg-slate-50 p-4 pl-14 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                                <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Detalhamento da Dívida</h4>
                                <div className="space-y-2">
                                    {aluno.cobrancas.map((cob) => (
                                        <div key={cob.id} className="flex justify-between items-center bg-white p-3 rounded border border-slate-200 text-sm">
                                            <div className="flex items-center gap-3">
                                                <Calendar size={14} className="text-red-400" />
                                                <span className="text-slate-600">
                                                    Venceu em: <strong>{new Date(cob.data_vencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</strong>
                                                </span>
                                                <span className="text-slate-400 mx-2">|</span>
                                                <span className="capitalize text-slate-700">{cob.tipo_taxa}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-bold text-slate-700">
                                                    {cob.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </span>
                                                {cob.link_pagamento && (
                                                    <a 
                                                        href={cob.link_pagamento} 
                                                        target="_blank" 
                                                        className="text-xs text-blue-600 hover:underline"
                                                    >
                                                        Ver Boleto ↗
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  )
}