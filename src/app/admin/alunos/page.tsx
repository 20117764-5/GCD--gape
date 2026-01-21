'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { PlusCircle, Search, DollarSign, X, FileText, Pencil, Trash2, Save, Calendar } from 'lucide-react'

interface Aluno {
  id: string
  nome_completo: string
  turma: string
  data_nascimento: string 
  responsavel_id: string 
  responsaveis: {
    id: string
    nome_completo: string
    telefone_wpp: string
    cpf: string
  } | null 
}

export default function GestaoAlunos() {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(false)
  const [atualizarLista, setAtualizarLista] = useState(0)

  // Controle de Modais
  const [alunoParaCobranca, setAlunoParaCobranca] = useState<Aluno | null>(null)
  const [alunoParaEdicao, setAlunoParaEdicao] = useState<Aluno | null>(null)
  const [loadingCobranca, setLoadingCobranca] = useState(false)
  const [loadingEdicao, setLoadingEdicao] = useState(false)

  // Busca alunos
  useEffect(() => {
    async function fetchAlunos() {
      const { data, error } = await supabase
        .from('alunos')
        .select('*, responsaveis(id, nome_completo, telefone_wpp, cpf)')
        .order('nome_completo')

      if (data) setAlunos(data as unknown as Aluno[])
      if (error) console.error(error)
    }
    fetchAlunos()
  }, [atualizarLista])

  // --- CADASTRO ---
  async function handleCadastro(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const dados = Object.fromEntries(formData)

    const { data: resp, error: errResp } = await supabase
      .from('responsaveis')
      .insert([{ 
        nome_completo: dados.pai, 
        cpf: (dados.cpf as string).replace(/\D/g, ''), 
        telefone_wpp: dados.whatsapp 
      }])
      .select().single()

    if (errResp) {
      alert(`Erro no Responsável: ${errResp.message}`)
      setLoading(false)
      return
    }

    const { error: errAluno } = await supabase
      .from('alunos')
      .insert([{ 
        nome_completo: dados.aluno, 
        turma: dados.turma, 
        data_nascimento: dados.data_nascimento,
        responsavel_id: resp.id 
      }])

    if (!errAluno) {
      (e.target as HTMLFormElement).reset()
      setAtualizarLista((prev) => prev + 1)
      alert('✅ Aluno cadastrado com sucesso!')
    } else {
      alert(`Erro no Aluno: ${errAluno.message}`)
    }
    setLoading(false)
  }

  // --- EDIÇÃO ---
  async function handleSalvarEdicao(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!alunoParaEdicao) return
    setLoadingEdicao(true)

    const formData = new FormData(e.currentTarget)
    const dados = Object.fromEntries(formData)

    try {
        if (alunoParaEdicao.responsavel_id) {
            const { error: erroResp } = await supabase
                .from('responsaveis')
                .update({
                    nome_completo: dados.pai,
                    cpf: (dados.cpf as string).replace(/\D/g, ''),
                    telefone_wpp: dados.whatsapp
                })
                .eq('id', alunoParaEdicao.responsavel_id)

            if (erroResp) throw new Error(`Erro ao atualizar pai: ${erroResp.message}`)
        }

        const { error: erroAluno } = await supabase
            .from('alunos')
            .update({
                nome_completo: dados.aluno,
                turma: dados.turma,
                data_nascimento: dados.data_nascimento
            })
            .eq('id', alunoParaEdicao.id)

        if (erroAluno) throw new Error(`Erro ao atualizar aluno: ${erroAluno.message}`)

        alert('✅ Dados atualizados com sucesso!')
        setAtualizarLista(prev => prev + 1)
        setAlunoParaEdicao(null)

    } catch (error) {
        // CORRIGIDO: Agora usamos const e um ternário para evitar o erro de reatribuição
        const msg = error instanceof Error ? error.message : 'Erro desconhecido'
        alert(`❌ ${msg}`)
    } finally {
        setLoadingEdicao(false)
    }
  }

  // --- EXCLUSÃO ---
  async function handleExcluir(aluno: Aluno) {
    if (!confirm(`Tem certeza que deseja apagar o aluno ${aluno.nome_completo}?`)) return

    try {
        await supabase.from('cobrancas').delete().eq('aluno_id', aluno.id)
        const { error } = await supabase.from('alunos').delete().eq('id', aluno.id)
        if (error) throw new Error(error.message)
        alert('🗑️ Aluno excluído.')
        setAtualizarLista(prev => prev + 1)
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Erro ao excluir aluno'
        alert(`Erro ao excluir: ${msg}`)
    }
  }

  // --- COBRANÇA ASAAS ---
  async function handleCriarCobranca(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!alunoParaCobranca) return
    setLoadingCobranca(true)
    const formData = new FormData(e.currentTarget)
    const dados = Object.fromEntries(formData)

    try {
      if (!alunoParaCobranca.responsavel_id) throw new Error("Aluno sem responsável.")
      const { data: paiDados, error: erroPai } = await supabase
        .from('responsaveis')
        .select('cpf, nome_completo')
        .eq('id', alunoParaCobranca.responsavel_id)
        .single()

      if (erroPai || !paiDados?.cpf) throw new Error("Responsável sem CPF cadastrado.")

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          aluno_id: alunoParaCobranca.id,
          tipo_taxa: dados.tipo, 
          valor: parseFloat(dados.valor.toString()),
          data_vencimento: dados.vencimento,
          observacao: dados.observacao,
          responsavel_nome: paiDados.nome_completo,
          responsavel_cpf: paiDados.cpf
        })
      })

      const resultado = await response.json()
      if (!resultado.success) throw new Error(resultado.error)

      alert(`✅ Cobrança Gerada!`)
      if (resultado.link) window.open(resultado.link, '_blank')
      setAlunoParaCobranca(null)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido'
      alert(`❌ Erro: ${msg}`)
    } finally {
      setLoadingCobranca(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">Gestão Escolar</h1>
        <div className="text-sm text-slate-500 font-medium tracking-tight">CGD Ágape System</div>
      </div>

      {/* Cadastro Rápido */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-blue-50">
        <h2 className="flex items-center gap-2 text-lg font-black mb-6 text-blue-600 uppercase tracking-tight text-sm">
          <PlusCircle size={18} /> Matricular Novo Aluno
        </h2>
        <form onSubmit={handleCadastro} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome do Aluno</label>
            <input name="aluno" placeholder="Nome Completo" required className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Data Nascimento</label>
            <input name="data_nascimento" type="date" required className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Turma</label>
            <input name="turma" placeholder="Turma" required className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Responsável</label>
            <input name="pai" placeholder="Pai / Mãe" required className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">CPF</label>
            <input name="cpf" placeholder="000.000.000-00" required className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">WhatsApp</label>
            <input name="whatsapp" placeholder="(00) 00000-0000" required className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm" />
          </div>
          <button disabled={loading} className="lg:col-span-6 bg-blue-600 text-white p-4 rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100 disabled:opacity-50 mt-2">
            {loading ? 'Processando Matrícula...' : 'Confirmar Cadastro de Aluno'}
          </button>
        </form>
      </div>

      {/* Tabela de Alunos */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-blue-50 overflow-hidden">
        <div className="p-6 border-b border-blue-50 flex gap-4 items-center bg-blue-50/20">
          <Search size={18} className="text-slate-400" />
          <input placeholder="Filtrar por nome do aluno..." className="bg-transparent outline-none text-sm w-full font-medium text-slate-600" />
        </div>
        
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
            <tr>
              <th className="p-5">Aluno / Nascimento</th>
              <th className="p-5">Turma</th>
              <th className="p-5">Responsável</th>
              <th className="p-5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-50">
            {alunos.map((aluno) => (
              <tr key={aluno.id} className="hover:bg-blue-50/20 transition-colors">
                <td className="p-5 font-bold text-slate-700">
                  {aluno.nome_completo}
                  <div className="text-[10px] font-medium text-slate-400 flex items-center gap-1 mt-1">
                    <Calendar size={10} /> {aluno.data_nascimento ? new Date(aluno.data_nascimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'Não informada'}
                  </div>
                </td>
                <td className="p-5 text-slate-500 font-medium">{aluno.turma}</td>
                <td className="p-5 text-slate-600 font-medium">{aluno.responsaveis?.nome_completo || '-'}</td>
                <td className="p-5 text-right flex items-center justify-end gap-2">
                  <button onClick={() => setAlunoParaCobranca(aluno)} title="Cobrar" className="text-green-600 hover:bg-green-50 border border-green-100 p-2.5 rounded-xl transition shadow-sm"><DollarSign size={16} /></button>
                  <button onClick={() => setAlunoParaEdicao(aluno)} title="Editar" className="text-blue-600 hover:bg-blue-50 border border-blue-100 p-2.5 rounded-xl transition shadow-sm"><Pencil size={16} /></button>
                  <button onClick={() => handleExcluir(aluno)} title="Excluir" className="text-red-500 hover:bg-red-50 border border-red-100 p-2.5 rounded-xl transition shadow-sm"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MODAIS --- */}
      {alunoParaCobranca && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-green-600 p-6 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2"><DollarSign size={20} /> Nova Cobrança</h3>
              <button onClick={() => setAlunoParaCobranca(null)} className="hover:bg-green-700 p-2 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleCriarCobranca} className="p-8 space-y-4">
              <div className="text-xs font-bold text-slate-400 mb-2 uppercase">Aluno: <span className="text-slate-800">{alunoParaCobranca.nome_completo}</span></div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo de Taxa</label>
                  <select name="tipo" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-green-500 text-sm font-medium">
                    <option value="mensalidade">Mensalidade Escolar</option>
                    <option value="material">Taxa de Material</option>
                    <option value="evento">Evento / Excursão</option>
                    <option value="matricula">Matrícula</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Valor (R$)</label>
                    <input name="valor" type="number" step="0.01" required className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-green-500 text-sm" />
                    </div>
                    <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Vencimento</label>
                    <input name="vencimento" type="date" required className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-green-500 text-sm" />
                    </div>
                </div>
              </div>
              <button disabled={loadingCobranca} className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-100 disabled:opacity-50 mt-4">
                {loadingCobranca ? 'Gerando Boleto...' : 'Confirmar Cobrança'}
              </button>
            </form>
          </div>
        </div>
      )}

      {alunoParaEdicao && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-blue-600 p-6 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2"><Pencil size={20} /> Editar Matrícula</h3>
              <button onClick={() => setAlunoParaEdicao(null)} className="hover:bg-blue-700 p-2 rounded-full transition-colors"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSalvarEdicao} className="p-8 space-y-6">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.15em] border-b border-blue-50 pb-2">Informações do Aluno</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome Completo</label>
                        <input name="aluno" defaultValue={alunoParaEdicao.nome_completo} required className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 text-sm font-medium" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nascimento</label>
                        <input name="data_nascimento" type="date" defaultValue={alunoParaEdicao.data_nascimento} required className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 text-sm font-medium" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Turma</label>
                        <input name="turma" defaultValue={alunoParaEdicao.turma} required className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 text-sm font-medium" />
                    </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.15em] border-b border-blue-50 pb-2">Dados do Responsável</h4>
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Pai / Mãe / Tutor</label>
                        <input name="pai" defaultValue={alunoParaEdicao.responsaveis?.nome_completo} required className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 text-sm font-medium" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">CPF</label>
                            <input name="cpf" defaultValue={alunoParaEdicao.responsaveis?.cpf} required className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 text-sm font-medium" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">WhatsApp</label>
                            <input name="whatsapp" defaultValue={alunoParaEdicao.responsaveis?.telefone_wpp} required className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 text-sm font-medium" />
                        </div>
                    </div>
                </div>
              </div>

              <button disabled={loadingEdicao} className="w-full bg-slate-800 text-white py-4 rounded-2xl font-bold hover:bg-slate-700 transition flex justify-center gap-2 items-center shadow-lg shadow-slate-200">
                {loadingEdicao ? 'Atualizando...' : <><Save size={18} /> Salvar Alterações</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}