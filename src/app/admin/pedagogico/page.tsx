'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { BookOpen, Save, GraduationCap, ChevronRight, CheckCircle } from 'lucide-react'

interface Aluno {
  id: string
  nome_completo: string
  turma: string
}

interface Nota {
  aluno_id: string
  nota: string
  faltas: string
}

export default function LancamentoNotas() {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [turmas, setTurmas] = useState<string[]>([])
  const [turmaSelecionada, setTurmaSelecionada] = useState('')
  const [disciplina, setDisciplina] = useState('Português')
  const [unidade, setUnidade] = useState(1)
  
  const [notas, setNotas] = useState<Record<string, Nota>>({})
  const [loading, setLoading] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // Busca todas as turmas disponíveis para o filtro
  useEffect(() => {
    async function fetchInitialData() {
      const { data } = await supabase.from('alunos').select('turma')
      if (data) {
        const uniqueTurmas = Array.from(new Set(data.map(a => a.turma)))
        setTurmas(uniqueTurmas)
      }
    }
    fetchInitialData()
  }, [])

  // Busca os alunos da turma selecionada
  const fetchAlunos = useCallback(async () => {
    if (!turmaSelecionada) return
    setLoading(true)
    const { data } = await supabase
      .from('alunos')
      .select('id, nome_completo, turma')
      .eq('turma', turmaSelecionada)
      .order('nome_completo')
    
    if (data) {
      setAlunos(data)
      // Inicializa o estado das notas para cada aluno
      const initialNotas: Record<string, Nota> = {}
      data.forEach(aluno => {
        initialNotas[aluno.id] = { aluno_id: aluno.id, nota: '', faltas: '' }
      })
      setNotas(initialNotas)
    }
    setLoading(false)
  }, [turmaSelecionada])

  useEffect(() => {
    fetchAlunos()
  }, [fetchAlunos])

  const handleInputChange = (alunoId: string, campo: 'nota' | 'faltas', valor: string) => {
    setNotas(prev => ({
      ...prev,
      [alunoId]: { ...prev[alunoId], [campo]: valor }
    }))
  }

  async function salvarNotas() {
    setSalvando(true)
    try {
      const inserts = Object.values(notas)
        .filter(n => n.nota !== '') // Só salva se tiver nota preenchida
        .map(n => ({
          aluno_id: n.aluno_id,
          disciplina,
          unidade,
          nota: parseFloat(n.nota.replace(',', '.')),
          faltas: parseInt(n.faltas) || 0
        }))

      const { error } = await supabase.from('notas').insert(inserts)
      if (error) throw error
      alert('✅ Notas lançadas com sucesso!')
    } catch (err) {
      console.error(err)
      alert('❌ Erro ao salvar notas. Verifique os dados.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="text-indigo-600" /> Diário de Classe
          </h1>
          <p className="text-slate-500">Lançamento de notas e frequências por unidade.</p>
        </div>
      </div>

      {/* FILTROS DE SELEÇÃO */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-indigo-50">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">Turma</label>
          <select 
            value={turmaSelecionada} 
            onChange={(e) => setTurmaSelecionada(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-medium text-sm"
          >
            <option value="">Selecione a Turma</option>
            {turmas.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">Disciplina</label>
          <select 
            value={disciplina} 
            onChange={(e) => setDisciplina(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-medium text-sm"
          >
            <option value="Português">Português</option>
            <option value="Matemática">Matemática</option>
            <option value="História">História</option>
            <option value="Geografia">Geografia</option>
            <option value="Ciências">Ciências</option>
            <option value="Artes">Artes</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">Unidade</label>
          <select 
            value={unidade} 
            onChange={(e) => setUnidade(Number(e.target.value))}
            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-medium text-sm"
          >
            <option value={1}>1ª Unidade</option>
            <option value={2}>2ª Unidade</option>
            <option value={3}>3ª Unidade</option>
            <option value={4}>4ª Unidade</option>
          </select>
        </div>

        <div className="flex items-end">
          <button 
            onClick={salvarNotas}
            disabled={salvando || !turmaSelecionada}
            className="w-full bg-indigo-600 text-white p-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : <><Save size={18} /> Salvar Diário</>}
          </button>
        </div>
      </div>

      {/* LISTA DE ALUNOS PARA LANÇAMENTO */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
            <tr>
              <th className="p-5">Estudante</th>
              <th className="p-5 text-center w-32">Nota Média</th>
              <th className="p-5 text-center w-32">Faltas</th>
              <th className="p-5 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={4} className="p-10 text-center text-slate-400">Buscando alunos...</td></tr>
            ) : alunos.map((aluno) => (
              <tr key={aluno.id} className="hover:bg-indigo-50/20 transition-colors">
                <td className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">
                      <GraduationCap size={20} />
                    </div>
                    <span className="font-bold text-slate-700">{aluno.nome_completo}</span>
                  </div>
                </td>
                <td className="p-5">
                  <input 
                    type="text" 
                    placeholder="0.0"
                    value={notas[aluno.id]?.nota || ''}
                    onChange={(e) => handleInputChange(aluno.id, 'nota', e.target.value)}
                    className="w-full p-2 text-center bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-indigo-400 font-bold text-slate-700"
                  />
                </td>
                <td className="p-5">
                  <input 
                    type="number" 
                    placeholder="0"
                    value={notas[aluno.id]?.faltas || ''}
                    onChange={(e) => handleInputChange(aluno.id, 'faltas', e.target.value)}
                    className="w-full p-2 text-center bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-indigo-400 font-bold text-slate-700"
                  />
                </td>
                <td className="p-5 text-right">
                  {notas[aluno.id]?.nota !== '' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-green-500 uppercase">
                      <CheckCircle size={12} /> Preenchido
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-slate-300 uppercase">Pendente</span>
                  )}
                </td>
              </tr>
            ))}
            {!loading && alunos.length === 0 && (
              <tr><td colSpan={4} className="p-10 text-center text-slate-400">Selecione uma turma para começar o lançamento.</td></tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}