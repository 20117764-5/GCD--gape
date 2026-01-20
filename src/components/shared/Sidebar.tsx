'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, DollarSign, LogOut, Settings } from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()

  // Função auxiliar para saber se o link está ativo
  const isActive = (path: string) => pathname === path

  const menuItems = [
    { label: 'Visão Geral', icon: LayoutDashboard, path: '/admin' },
    { label: 'Alunos & Matrículas', icon: Users, path: '/admin/alunos' },
    { label: 'Financeiro', icon: DollarSign, path: '/admin/financeiro' },
  ]

  return (
    <aside className="w-64 bg-slate-900 h-screen text-slate-300 flex flex-col fixed left-0 top-0">
      {/* Logo da Escola */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">
          CG
        </div>
        <span className="text-white font-bold text-lg tracking-wide">CGD Ágape</span>
      </div>

      {/* Menu de Navegação */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Link 
            key={item.path} 
            href={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              isActive(item.path) 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium text-sm">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Rodapé do Menu */}
      <div className="p-4 border-t border-slate-800 space-y-1">
        <button className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg hover:bg-slate-800 hover:text-red-400 transition text-slate-400">
          <LogOut size={20} />
          <span className="font-medium text-sm">Sair do Sistema</span>
        </button>
        <div className="text-xs text-center text-slate-600 pt-4">
          v1.0.0 - DigitalRise
        </div>
      </div>
    </aside>
  )
}