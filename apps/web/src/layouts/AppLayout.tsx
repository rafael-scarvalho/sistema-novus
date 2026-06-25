import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard, Users, Building2, Package, FileText,
  Scissors, Wallet, LogOut, Menu, X, Calendar, RotateCcw,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '../lib/utils'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/agenda', icon: Calendar, label: 'Agenda' },
  { to: '/pacientes', icon: Users, label: 'Pacientes' },
  { to: '/parceiros', icon: Building2, label: 'Parceiros' },
  { to: '/catalogo', icon: Package, label: 'Catálogo' },
  { to: '/orcamentos', icon: FileText, label: 'Orçamentos' },
  { to: '/cirurgias', icon: Scissors, label: 'Cirurgias' },
  { to: '/retornos', icon: RotateCcw, label: 'Retornos' },
  { to: '/financeiro', icon: Wallet, label: 'Financeiro' },
]

export default function AppLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Overlay mobile */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-30 flex flex-col bg-white border-r border-gray-100 transition-transform duration-200',
          'w-[var(--sidebar-width)]',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <Scissors className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-none">NOVUS</p>
            <p className="text-[10px] text-gray-400 leading-tight">Cirurgia Veterinária</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group',
                  isActive
                    ? 'bg-brand-50 text-brand-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button onClick={handleLogout} className="btn-ghost w-full justify-start">
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar mobile */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
          <button onClick={() => setOpen(true)} className="btn-ghost p-2">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-gray-900">NOVUS</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
