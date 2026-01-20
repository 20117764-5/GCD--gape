'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
// ADICIONEI O TrendingDown AQUI NESSA LINHA DEBAIXO 👇
import { LayoutDashboard, Users, DollarSign, AlertTriangle, LogOut, TrendingDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  // Lista dos menus atualizada
  const menuItems = [
    { 
      name: 'Painel Geral', 
      href: '/admin', 
      icon: LayoutDashboard 
    },
    { 
      name: 'Alunos & Matrículas', 
      href: '/admin/alunos', 
      icon: Users 
    },
    { 
      name: 'Financeiro (Entradas)', 
      href: '/admin/financeiro', 
      icon: DollarSign 
    },
    { 
      name: 'Despesas (Saídas)', 
      href: '/admin/despesas', 
      icon: TrendingDown 
    },
    { 
      name: 'Inadimplência', 
      href: '/admin/inadimplentes', 
      icon: AlertTriangle,
      destaque: true 
    },
  ]

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 flex flex-col z-10">
      
      {/* 1. Logo da Escola */}
      <div className="h-24 flex items-center justify-center border-b border-slate-100">
        <div className="relative w-32 h-16">
            <Image 
              src="/logo.png" 
              alt="Logo CGD" 
              fill
              className="object-contain"
              priority
            />
        </div>
      </div>

      {/* 2. Navegação */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 ml-2">
          Gestão Escolar
        </p>

        {menuItems.map((item) => {
          const isActive = pathname === item.href
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium
                ${isActive 
                  ? 'bg-blue-50 text-blue-700 shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }
                ${item.destaque && !isActive ? 'text-slate-600 hover:text-red-600 hover:bg-red-50' : ''}
              `}
            >
              <item.icon 
                size={20} 
                className={`
                  ${isActive ? 'text-blue-600' : 'text-slate-400'}
                  ${item.destaque && !isActive ? 'group-hover:text-red-500' : ''}
                `} 
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* 3. Rodapé (Usuário e Sair) */}
      <div className="p-4 border-t border-slate-100">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
        >
          <LogOut size={20} />
          Sair do Sistema
        </button>
      </div>

    </aside>
  )
}