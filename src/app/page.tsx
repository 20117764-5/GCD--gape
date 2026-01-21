'use client'
import Link from 'next/link'
import Image from 'next/image'
import { UserCircle, ShieldCheck, GraduationCap, Heart, Star, Sparkles } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden p-6">
      
      {/* Elementos Decorativos de Fundo (Estilo Infantil Suave) */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <Star className="absolute top-10 left-[10%] text-yellow-200 animate-pulse" size={40} />
        <Heart className="absolute bottom-20 left-[15%] text-pink-200 animate-bounce duration-700" size={32} />
        <Sparkles className="absolute top-1/4 right-[12%] text-blue-200" size={48} />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-blue-100/50 rounded-full blur-3xl" />
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-yellow-100/50 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl w-full relative z-10 text-center space-y-12">
        
        {/* LOGO E BOAS-VINDAS */}
        <div className="space-y-4">
          <div className="relative w-48 h-24 mx-auto mb-6">
            <Image 
              src="/logo.png" 
              alt="Logo CGD Ágape" 
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">
            Portal Educacional <span className="text-blue-600 italic">Ágape</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto font-medium">
            Bem-vindo à nossa plataforma. Escolha uma das opções abaixo para acessar o sistema.
          </p>
        </div>

        {/* CARDS DE ESCOLHA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          
          {/* Opção 1: ÁREA DO ALUNO (PAIS) */}
          <Link 
            href="/portal" 
            className="group relative bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border-2 border-transparent hover:border-blue-400 transition-all duration-300 hover:-translate-y-2 flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <UserCircle size={48} strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Área do Aluno</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Acesso para pais e responsáveis. Veja boletos, notas, boletins e avisos da escola.
            </p>
            <div className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-full font-bold text-sm shadow-lg shadow-blue-200 group-hover:bg-blue-700">
              Entrar como Responsável
            </div>
          </Link>

          {/* Opção 2: GESTÃO (ADMINISTRATIVO) */}
          <Link 
            href="/login" 
            className="group relative bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border-2 border-transparent hover:border-slate-800 transition-all duration-300 hover:-translate-y-2 flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 bg-slate-100 text-slate-700 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck size={48} strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Gestão Escolar</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Acesso restrito para direção e secretaria. Controle financeiro, matrículas e pedagógico.
            </p>
            <div className="mt-6 px-6 py-2 bg-slate-800 text-white rounded-full font-bold text-sm shadow-lg shadow-slate-200 group-hover:bg-slate-900">
              Acesso Administrativo
            </div>
          </Link>

        </div>

        {/* RODAPÉ */}
        <div className="pt-12 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm">
            <GraduationCap className="text-blue-500" size={18} />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Educação com Amor & Excelência</span>
          </div>
          <p className="text-[10px] text-slate-400">© 2026 Centro Educacional CGD Ágape. Todos os direitos reservados.</p>
        </div>

      </div>
    </div>
  )
}