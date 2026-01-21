'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Megaphone, Trash2, Send, Clock, AlertTriangle, Pencil, X, Save } from 'lucide-react'

// --- INTERFACE ---
interface Aviso {
  id: string
  titulo: string
  conteudo: string
  prioridade: string
  created_at: string
}

export default function GestaoAvisos() {
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [refreshSignal, setRefreshSignal] = useState(0)

  // Estados para Edição
  const [avisoEmEdicao, setAvisoEmEdicao] = useState<Aviso | null>(null)
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)

  // --- BUSCAR AVISOS ---
  useEffect(() => {
    let isMounted = true
    async function fetchData() {
      const { data, error } = await supabase
        .from('avisos')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (isMounted) {
        if (error) console.error('Erro:', error.message)
        else if (data) setAvisos(data as Aviso[])
        setLoading(false)
      }
    }
    fetchData()
    return () => { isMounted = false }
  }, [refreshSignal])

  // --- CRIAR NOVO ---
  async function handleEnviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnviando(true)
    const formData = new FormData(e.currentTarget)
    const { error } = await supabase.from('avisos').insert([{
      titulo: formData.get('titulo'),
      conteudo: formData.get('conteudo'),
      prioridade: formData.get('prioridade')
    }])

    if (!error) {
      (e.target as HTMLFormElement).reset()
      setRefreshSignal(prev => prev + 1)
      alert('✅ Comunicado publicado!')
    }
    setEnviando(false)
  }

  // --- SALVAR EDIÇÃO ---
  async function handleSalvarEdicao(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!avisoEmEdicao) return
    setSalvandoEdicao(true)

    const formData = new FormData(e.currentTarget)
    const { error } = await supabase
      .from('avisos')
      .update({
        titulo: formData.get('titulo'),
        conteudo: formData.get('conteudo'),
        prioridade: formData.get('prioridade')
      })
      .eq('id', avisoEmEdicao.id)

    if (!error) {
      setAvisoEmEdicao(null)
      setRefreshSignal(prev => prev + 1)
      alert('✅ Comunicado atualizado!')
    }
    setSalvandoEdicao(false)
  }

  // --- APAGAR ---
  async function remover(id: string) {
    if (!confirm('Deseja apagar este comunicado definitivamente?')) return
    const { error } = await supabase.from('avisos').delete().eq('id', id)
    if (!error) setRefreshSignal(prev => prev + 1)
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <Megaphone className="text-blue-600" size={32} /> Mural de Avisos
          </h1>
          <p className="text-slate-500 font-medium">Gerencie os comunicados que aparecem no Portal do Aluno.</p>
        </div>
      </div>

      {/* FORMULÁRIO DE CRIAÇÃO */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-blue-50">
        <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Send size={16} /> Nova Publicação
        </h2>
        <form onSubmit={handleEnviar} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <input name="titulo" placeholder="Título do Comunicado" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold" />
            </div>
            <select name="prioridade" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold">
              <option value="geral">Prioridade: Geral (Azul)</option>
              <option value="importante">Prioridade: Urgente (Laranja)</option>
            </select>
          </div>
          <textarea name="conteudo" rows={3} placeholder="Escreva a mensagem aqui..." required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[2rem] outline-none focus:border-blue-500 text-sm font-medium resize-none" />
          <button disabled={enviando} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50">
            {enviando ? 'Publicando...' : 'Enviar para o Portal dos Pais'}
          </button>
        </form>
      </div>

      {/* LISTAGEM E HISTÓRICO */}
      <div className="space-y-4">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Histórico de Mensagens</h2>
        
        {loading ? (
          <div className="py-20 text-center text-slate-300 animate-pulse font-bold uppercase text-[10px]">Carregando Mural...</div>
        ) : avisos.length === 0 ? (
          <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-slate-200 text-center text-slate-400">
            Nenhum aviso publicado ainda.
          </div>
        ) : avisos.map((aviso) => (
          <div key={aviso.id} className={`bg-white p-6 rounded-[2rem] border transition-all flex justify-between items-start group ${aviso.prioridade === 'importante' ? 'border-orange-100' : 'border-blue-50'}`}>
            <div className="flex gap-5">
              <div className={`mt-1 p-3 rounded-2xl ${aviso.prioridade === 'importante' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
                {aviso.prioridade === 'importante' ? <AlertTriangle size={24} /> : <Clock size={24} />}
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-lg leading-tight">{aviso.titulo}</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium mt-1">{aviso.conteudo}</p>
                <div className="flex gap-2 mt-3">
                    <span className="text-[9px] font-bold text-slate-300 uppercase bg-slate-50 px-2 py-1 rounded-md italic">
                        {new Date(aviso.created_at).toLocaleDateString('pt-BR')}
                    </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => setAvisoEmEdicao(aviso)}
                className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                title="Editar Aviso"
              >
                <Pencil size={18} />
              </button>
              <button 
                onClick={() => remover(aviso.id)}
                className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl transition-all"
                title="Apagar Aviso"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE EDIÇÃO */}
      {avisoEmEdicao && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-white">
            <div className="bg-slate-800 p-6 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2"><Pencil size={20} /> Editar Comunicado</h3>
              <button onClick={() => setAvisoEmEdicao(null)} className="hover:bg-white/10 p-2 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSalvarEdicao} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Título Atualizado</label>
                <input name="titulo" defaultValue={avisoEmEdicao.titulo} required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold text-slate-700" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Prioridade</label>
                <select name="prioridade" defaultValue={avisoEmEdicao.prioridade} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold text-slate-700">
                  <option value="geral">Informativo (Azul)</option>
                  <option value="importante">Urgente (Laranja)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Mensagem</label>
                <textarea name="conteudo" rows={4} defaultValue={avisoEmEdicao.conteudo} required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none focus:border-blue-500 text-sm font-medium text-slate-600 resize-none" />
              </div>
              <button disabled={salvandoEdicao} className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black hover:bg-slate-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200">
                {salvandoEdicao ? 'Salvando...' : <><Save size={18} /> Atualizar Publicação</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}