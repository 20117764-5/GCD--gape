'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { BookOpen, Save, GraduationCap, CheckCircle, Pencil, Trash2, Search, X } from 'lucide-react'

// --- INTERFACES ---
interface Aluno {
  id: string
  nome_completo: string
  turma: string
}

interface NotaData {
  id: string
  aluno_id: string
  disciplina: string
  unidade: number
  nota: number
  faltas: number
}

export default function LancamentoNotas() {
  const [activeTab, setActiveTab] = useState<'lancar' | 'gerenciar'>('lancar')
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [turmas, setTurmas] = useState<string[]>([])
  
  // Estados para Aba de Lançamento
  const [turmaSelecionada, setTurmaSelecionada] = useState('')
  const [disciplina, setDisciplina] = useState('Português')
  const [unidade, setUnidade] = useState(1)
  const [inputNotas, setInputNotas] = useState<Record<string, { nota: string, faltas: string }>>({})
  
  // Estados para Aba de Gerenciamento
  const [alunoConsulta, setAlunoConsulta] = useState<string>('')
  const [notasExistentes, setNotasExistentes] = useState<NotaData[]>([])
  const [editNota, setEditNota] = useState<NotaData | null>(null)

  const [loading, setLoading] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [refreshSignal, setRefreshSignal] = useState(0)

  // 1. Carregar lista inicial (Turmas e Alunos)
  useEffect(() => {
    async function init() {
      const { data } = await supabase.from('alunos').select('id, nome_completo, turma').order('nome_completo')
      if (data) {
        setAlunos(data)
        const uniqueTurmas = Array.from(new Set(data.map(a => a.turma)))
        setTurmas(uniqueTurmas)
      }
    }
    init()
  }, [])

  // 2. BUSCA DE BOLETIM (CORREÇÃO DEFINITIVA)
  useEffect(() => {
    // Se não tiver aluno ou não estiver na aba certa, apenas sai sem dar setState
    if (activeTab !== 'gerenciar' || !alunoConsulta) return

    let isMounted = true

    async function fetchData() {
      setLoading(true) // Agora dentro da função asíncrona (não causa o erro)
      const { data, error } = await supabase
        .from('notas')
        .select('*')
        .eq('aluno_id', alunoConsulta)
        .order('unidade', { ascending: true })
      
      if (isMounted) {
        if (!error && data) {
          setNotasExistentes(data as NotaData[])
        } else {
          setNotasExistentes([])
        }
        setLoading(false)
      }
    }

    fetchData()
    return () => { isMounted = false }
  }, [alunoConsulta, activeTab, refreshSignal])

  // --- FUNÇÕES DE AÇÃO ---
  const handleInputMassChange = (alunoId: string, campo: 'nota' | 'faltas', valor: string) => {
    setInputNotas(prev => ({
      ...prev,
      [alunoId]: { ...prev[alunoId], [campo]: valor }
    }))
  }

  async function salvarNotasEmMassa() {
    setProcessando(true)
    const inserts = Object.entries(inputNotas)
      .filter(([_, val]) => val.nota !== '')
      .map(([id, val]) => ({
        aluno_id: id,
        disciplina,
        unidade,
        nota: parseFloat(val.nota.replace(',', '.')),
        faltas: parseInt(val.faltas) || 0
      }))

    if (inserts.length === 0) {
      alert('Preencha ao menos uma nota.')
      setProcessando(false)
      return
    }

    const { error } = await supabase.from('notas').insert(inserts)
    if (!error) {
      alert('✅ Notas gravadas no sistema!')
      setInputNotas({})
    } else alert('❌ Erro ao salvar: Verifique duplicidade.')
    setProcessando(false)
  }

  async function atualizarNotaIndividual(e: React.FormEvent) {
    e.preventDefault()
    if (!editNota) return
    setProcessando(true)
    const { error } = await supabase
      .from('notas')
      .update({ nota: editNota.nota, faltas: editNota.faltas })
      .eq('id', editNota.id)
    
    if (!error) {
      setEditNota(null)
      setRefreshSignal(prev => prev + 1)
      alert('✅ Nota atualizada!')
    }
    setProcessando(false)
  }

  async function excluirNota(id: string) {
    if (!confirm('Deseja apagar esta nota?')) return
    const { error } = await supabase.from('notas').delete().eq('id', id)
    if (!error) setRefreshSignal(prev => prev + 1)
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
          <BookOpen className="text-indigo-600" size={32} /> Diário Pedagógico
        </h1>
        <p className="text-slate-500 font-medium ml-1">CGD Ágape - Gestão de Desempenho</p>
      </div>

      {/* SELETOR DE ABAS */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 w-fit shadow-sm">
        <button 
          onClick={() => setActiveTab('lancar')}
          className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'lancar' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Lançar Notas
        </button>
        <button 
          onClick={() => {
            setActiveTab('gerenciar')
            setNotasExistentes([]) // Limpa aqui ao trocar, fora do Effect
          }}
          className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'gerenciar' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Consultar / Editar
        </button>
      </div>

      {activeTab === 'lancar' ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Turma</label>
              <select value={turmaSelecionada} onChange={(e) => setTurmaSelecionada(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm">
                <option value="">Selecione a Turma</option>
                {turmas.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Matéria</label>
              <select value={disciplina} onChange={(e) => setDisciplina(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm">
                <option value="Português">Português</option>
                <option value="Matemática">Matemática</option>
                <option value="História">História</option>
                <option value="Geografia">Geografia</option>
                <option value="Ciências">Ciências</option>
                <option value="Artes">Artes</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Bimestre</label>
              <select value={unidade} onChange={(e) => setUnidade(Number(e.target.value))} className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm">
                {[1, 2, 3, 4].map(u => <option key={u} value={u}>{u}ª Unidade</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={salvarNotasEmMassa} disabled={processando || !turmaSelecionada} className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                <Save size={18} /> {processando ? 'Gravando...' : 'Salvar Diário'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="p-6">Estudante</th>
                  <th className="p-6 text-center w-32">Nota</th>
                  <th className="p-6 text-center w-32">Faltas</th>
                  <th className="p-6 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {alunos.filter(a => a.turma === turmaSelecionada).map((aluno) => (
                  <tr key={aluno.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-6 font-bold text-slate-700">{aluno.nome_completo}</td>
                    <td className="p-6"><input type="text" placeholder="0.0" value={inputNotas[aluno.id]?.nota || ''} onChange={(e) => handleInputMassChange(aluno.id, 'nota', e.target.value)} className="w-full p-2.5 text-center bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-indigo-400 font-black" /></td>
                    <td className="p-6"><input type="number" placeholder="0" value={inputNotas[aluno.id]?.faltas || ''} onChange={(e) => handleInputMassChange(aluno.id, 'faltas', e.target.value)} className="w-full p-2.5 text-center bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-indigo-400 font-black" /></td>
                    <td className="p-6 text-right">{inputNotas[aluno.id]?.nota ? <CheckCircle className="text-green-500 ml-auto" size={20} /> : <span className="text-slate-200 text-[10px] font-bold uppercase tracking-tighter">Pendente</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 max-w-lg">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-3 block">Consultar Boletim do Aluno</label>
            <div className="flex gap-3">
              <select value={alunoConsulta} onChange={(e) => setAlunoConsulta(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm">
                <option value="">Selecione um Aluno</option>
                {alunos.map(a => <option key={a.id} value={a.id}>{a.nome_completo} ({a.turma})</option>)}
              </select>
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center"><Search size={20} /></div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-slate-50">
                <tr>
                  <th className="p-6">Matéria</th>
                  <th className="p-6 text-center">Unid.</th>
                  <th className="p-6 text-center">Nota</th>
                  <th className="p-6 text-center">Faltas</th>
                  <th className="p-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={5} className="p-20 text-center animate-pulse text-slate-400 font-bold uppercase text-[10px] tracking-widest">Carregando Diário...</td></tr>
                ) : notasExistentes.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-6 font-bold text-slate-700">{n.disciplina}</td>
                    <td className="p-6 text-center font-black text-slate-400">{n.unidade}ª</td>
                    <td className="p-6 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-black ${n.nota >= 7 ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                        {n.nota.toFixed(1)}
                      </span>
                    </td>
                    <td className="p-6 text-center font-bold text-slate-500">{n.faltas}</td>
                    <td className="p-6 text-right flex justify-end gap-2">
                      <button onClick={() => setEditNota(n)} className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"><Pencil size={18} /></button>
                      <button onClick={() => excluirNota(n.id)} className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
                {!loading && (notasExistentes.length === 0 && alunoConsulta) && (
                  <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-medium italic">Nenhum registro encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODAL DE EDIÇÃO --- */}
      {editNota && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden border border-white">
            <div className="bg-indigo-600 p-8 flex justify-between items-center text-white">
              <div>
                <h3 className="font-black text-xl tracking-tight">Editar Nota</h3>
                <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest mt-1">{editNota.disciplina} - {editNota.unidade}ª Unid</p>
              </div>
              <button onClick={() => setEditNota(null)} className="hover:bg-white/10 p-2 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={atualizarNotaIndividual} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Média</label>
                  <input type="number" step="0.1" value={editNota.nota} onChange={(e) => setEditNota({...editNota, nota: parseFloat(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-black text-slate-700 shadow-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Faltas</label>
                  <input type="number" value={editNota.faltas} onChange={(e) => setEditNota({...editNota, faltas: parseInt(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-black text-slate-700 shadow-sm" />
                </div>
              </div>
              <button disabled={processando} className="w-full bg-slate-800 text-white py-5 rounded-2xl font-black shadow-xl shadow-slate-200 hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
                {processando ? 'Salvando...' : 'Confirmar Alteração'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}