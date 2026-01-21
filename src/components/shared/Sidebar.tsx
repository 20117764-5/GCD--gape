'use client'
import { useState } from 'react' // Adicionado para controlar o menu
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, Users, DollarSign, AlertTriangle, 
  LogOut, TrendingDown, GraduationCap, Megaphone, Menu, X 
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false) // Controle do menu mobile

  const menuItems = [
    { name: 'Painel Geral', href: '/admin', icon: LayoutDashboard },
    { name: 'Alunos & Matrículas', href: '/admin/alunos', icon: Users },
    { name: 'Pedagógico (Notas)', href: '/admin/pedagogico', icon: GraduationCap },
    { name: 'Mural de Avisos', href: '/admin/avisos', icon: Megaphone },
    { name: 'Financeiro (Entradas)', href: '/admin/financeiro', icon: DollarSign },
    { name: 'Despesas (Saídas)', href: '/admin/despesas', icon: TrendingDown },
    { name: 'Inadimplência', href: '/admin/inadimplentes', icon: AlertTriangle, destaque: true },
  ]

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* BOTÃO HAMBÚRGUER (Aparece apenas no Mobile) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-lg shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* ASIDE (Agora com classes condicionais para mobile) */}
      <aside className={`
        fixed left-0 top-0 h-screen bg-white border-r border-slate-200 flex flex-col z-40 transition-transform duration-300
        w-64 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        <div className="h-24 flex items-center justify-center border-b border-slate-100">
          <div className="relative w-32 h-16">
            <Image src="/logo.png" alt="Logo CGD" fill className="object-contain" priority />
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2">Gestão Escolar</p>
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setIsOpen(false)} // Fecha ao clicar no mobile
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm
                  ${isActive ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}
                `}
              >
                <item.icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:text-red-600 rounded-xl font-bold text-sm">
            <LogOut size={18} /> Sair do Sistema
          </button>
        </div>
      </aside>

      {/* OVERLAY (Fundo preto quando o menu abre no mobile) */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
        />
      )}
    </>
  )
}