'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { PlusCircle, Search, DollarSign, X, FileText, Pencil, Trash2, Save } from 'lucide-react'

interface Aluno {
  id: string
  nome_completo: string
  turma: string
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
      .insert([{ nome_completo: dados.pai, cpf: dados.cpf, telefone_wpp: dados.whatsapp }])
      .select().single()

    if (errResp) {
      alert(`Erro no Responsável: ${errResp.message}`)
      setLoading(false)
      return
    }

    const { error: errAluno } = await supabase
      .from('alunos')
      .insert([{ nome_completo: dados.aluno, turma: dados.turma, responsavel_id: resp.id }])

    if (!errAluno) {
      (e.target as HTMLFormElement).reset()
      setAtualizarLista((prev) => prev + 1)
      alert('Cadastro realizado!')
    }
    setLoading(false)
  }

  // --- EDIÇÃO (CORRIGIDO) ---
  async function handleSalvarEdicao(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!alunoParaEdicao) return
    setLoadingEdicao(true)

    const formData = new FormData(e.currentTarget)
    const dados = Object.fromEntries(formData)

    try {
        // 1. Atualiza dados do Responsável
        if (alunoParaEdicao.responsavel_id) {
            const { error: erroResp } = await supabase
                .from('responsaveis')
                .update({
                    nome_completo: dados.pai,
                    cpf: dados.cpf,
                    telefone_wpp: dados.whatsapp
                })
                .eq('id', alunoParaEdicao.responsavel_id)

            if (erroResp) throw new Error(`Erro ao atualizar pai: ${erroResp.message}`)
        }

        // 2. Atualiza dados do Aluno
        const { error: erroAluno } = await supabase
            .from('alunos')
            .update({
                nome_completo: dados.aluno,
                turma: dados.turma
            })
            .eq('id', alunoParaEdicao.id)

        if (erroAluno) throw new Error(`Erro ao atualizar aluno: ${erroAluno.message}`)

        alert('✅ Dados atualizados com sucesso!')
        setAtualizarLista(prev => prev + 1)
        setAlunoParaEdicao(null)

    } catch (error) {
        // Tratamento de erro seguro
        let msg = 'Erro desconhecido'
        if (error instanceof Error) msg = error.message
        alert(`❌ ${msg}`)
    } finally {
        setLoadingEdicao(false)
    }
  }

  // --- EXCLUSÃO (CORRIGIDO) ---
  async function handleExcluir(aluno: Aluno) {
    if (!confirm(`Tem certeza que deseja apagar o aluno ${aluno.nome_completo}? Essa ação não pode ser desfeita.`)) return

    try {
        // Primeiro apaga as cobranças vinculadas
        await supabase.from('cobrancas').delete().eq('aluno_id', aluno.id)

        // Apaga o aluno
        const { error } = await supabase.from('alunos').delete().eq('id', aluno.id)
        
        if (error) throw new Error(error.message)

        alert('🗑️ Aluno excluído.')
        setAtualizarLista(prev => prev + 1)

    } catch (error) {
        // Tratamento de erro seguro
        let msg = 'Erro desconhecido'
        if (error instanceof Error) msg = error.message
        alert(`Erro ao excluir: ${msg}`)
    }
  }

  // --- COBRANÇA ASAAS (CORRIGIDO) ---
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

      alert(`✅ Cobrança Gerada!\nLink criado com sucesso.`)
      if (resultado.link) window.open(resultado.link, '_blank')
      setAlunoParaCobranca(null)

    } catch (error) {
      // Tratamento de erro seguro
      console.error(error)
      let msg = 'Erro desconhecido'
      if (error instanceof Error) msg = error.message
      alert(`❌ Erro: ${msg}`)
    } finally {
      setLoadingCobranca(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">Gestão Escolar</h1>
        <div className="text-sm text-slate-500">CGD Ágape System</div>
      </div>

      {/* Cadastro Rápido */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="flex items-center gap-2 text-lg font-semibold mb-4 text-blue-600">
          <PlusCircle size={20} /> Novo Aluno
        </h2>
        <form onSubmit={handleCadastro} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <input name="aluno" placeholder="Nome do Aluno" required className="p-2 border rounded md:col-span-1" />
          <input name="turma" placeholder="Turma" required className="p-2 border rounded md:col-span-1" />
          <input name="pai" placeholder="Nome do Responsável" required className="p-2 border rounded md:col-span-1" />
          <input name="cpf" placeholder="CPF" required className="p-2 border rounded md:col-span-1" />
          <input name="whatsapp" placeholder="WhatsApp" required className="p-2 border rounded md:col-span-1" />
          <button disabled={loading} className="bg-blue-600 text-white p-2 rounded font-medium hover:bg-blue-700 md:col-span-5 transition">
            {loading ? 'Salvando...' : 'Cadastrar'}
          </button>
        </form>
      </div>

      {/* Tabela de Alunos */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4 items-center bg-slate-50">
          <Search size={18} className="text-slate-400" />
          <input placeholder="Buscar aluno..." className="bg-transparent outline-none text-sm w-full" />
        </div>
        
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-medium">
            <tr>
              <th className="p-4">Aluno</th>
              <th className="p-4">Turma</th>
              <th className="p-4">Responsável</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {alunos.map((aluno) => (
              <tr key={aluno.id} className="hover:bg-slate-50 transition">
                <td className="p-4 font-medium text-slate-800">{aluno.nome_completo}</td>
                <td className="p-4 text-slate-500">{aluno.turma}</td>
                <td className="p-4 text-slate-600">{aluno.responsaveis?.nome_completo || '-'}</td>
                <td className="p-4 text-right flex items-center justify-end gap-2">
                  
                  {/* Botão Cobrar */}
                  <button 
                    onClick={() => setAlunoParaCobranca(aluno)}
                    title="Gerar Cobrança"
                    className="text-green-600 hover:bg-green-50 border border-green-200 p-2 rounded transition"
                  >
                    <DollarSign size={16} />
                  </button>

                  {/* Botão Editar */}
                  <button 
                    onClick={() => setAlunoParaEdicao(aluno)}
                    title="Editar Dados"
                    className="text-blue-600 hover:bg-blue-50 border border-blue-200 p-2 rounded transition"
                  >
                    <Pencil size={16} />
                  </button>

                  {/* Botão Excluir */}
                  <button 
                    onClick={() => handleExcluir(aluno)}
                    title="Excluir Aluno"
                    className="text-red-600 hover:bg-red-50 border border-red-200 p-2 rounded transition"
                  >
                    <Trash2 size={16} />
                  </button>

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MODAL DE COBRANÇA --- */}
      {alunoParaCobranca && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-green-600 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2"><DollarSign size={20} /> Nova Cobrança</h3>
              <button onClick={() => setAlunoParaCobranca(null)} className="hover:bg-green-700 p-1 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={handleCriarCobranca} className="p-6 space-y-4">
              <div className="text-sm text-slate-500 mb-2">Aluno: <strong className="text-slate-800">{alunoParaCobranca.nome_completo}</strong></div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Tipo de Taxa</label>
                <select name="tipo" className="w-full p-2 border rounded bg-white text-slate-800">
                  <option value="mensalidade">Mensalidade Escolar</option>
                  <option value="material">Taxa de Material</option>
                  <option value="evento">Evento / Excursão</option>
                  <option value="matricula">Matrícula</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Valor (R$)</label>
                  <input name="valor" type="number" step="0.01" placeholder="0,00" required className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Vencimento</label>
                  <input name="vencimento" type="date" required className="w-full p-2 border rounded" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1"><FileText size={12} /> Observações</label>
                <textarea name="observacao" className="w-full p-2 border rounded h-24 resize-none outline-none focus:border-green-500"></textarea>
              </div>
              <button disabled={loadingCobranca} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition flex justify-center">
                {loadingCobranca ? 'Processando...' : 'Confirmar Cobrança'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DE EDIÇÃO --- */}
      {alunoParaEdicao && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2"><Pencil size={20} /> Editar Dados</h3>
              <button onClick={() => setAlunoParaEdicao(null)} className="hover:bg-blue-700 p-1 rounded"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSalvarEdicao} className="p-6 space-y-4">
              
              {/* Seção Aluno */}
              <div className="space-y-3 pb-4 border-b border-slate-100">
                <h4 className="text-sm font-bold text-slate-700">Dados do Aluno</h4>
                <div>
                    <label className="block text-xs text-slate-500 mb-1">Nome Completo</label>
                    <input name="aluno" defaultValue={alunoParaEdicao.nome_completo} required className="w-full p-2 border rounded" />
                </div>
                <div>
                    <label className="block text-xs text-slate-500 mb-1">Turma</label>
                    <input name="turma" defaultValue={alunoParaEdicao.turma} required className="w-full p-2 border rounded" />
                </div>
              </div>

              {/* Seção Responsável */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-700">Dados do Responsável</h4>
                <div>
                    <label className="block text-xs text-slate-500 mb-1">Nome do Pai/Mãe</label>
                    <input name="pai" defaultValue={alunoParaEdicao.responsaveis?.nome_completo} required className="w-full p-2 border rounded" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">CPF</label>
                        <input name="cpf" defaultValue={alunoParaEdicao.responsaveis?.cpf} required className="w-full p-2 border rounded" />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">WhatsApp</label>
                        <input name="whatsapp" defaultValue={alunoParaEdicao.responsaveis?.telefone_wpp} required className="w-full p-2 border rounded" />
                    </div>
                </div>
              </div>

              <button disabled={loadingEdicao} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition flex justify-center gap-2 items-center">
                {loadingEdicao ? 'Salvando...' : <><Save size={18} /> Salvar Alterações</>}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}