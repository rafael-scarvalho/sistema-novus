import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme, Theme } from '../contexts/ThemeContext'
import {
  LayoutDashboard, Users, Building2, Package, FileText,
  Scissors, Wallet, LogOut, Menu, Calendar, RotateCcw, Palette, MessageCircle,
  Search, Bell, BarChart2, X, ChevronRight, FlaskConical, Clock, RotateCcw as Return,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn, formatCurrency } from '../lib/utils'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useDebounce } from '../hooks/useDebounce'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/agenda', icon: Calendar, label: 'Agenda' },
  { to: '/pacientes', icon: Users, label: 'Pacientes' },
  { to: '/parceiros', icon: Building2, label: 'Parceiros' },
  { to: '/catalogo', icon: Package, label: 'Catálogo' },
  { to: '/orcamentos', icon: FileText, label: 'Orçamentos' },
  { to: '/cirurgias', icon: Scissors, label: 'Cirurgias' },
  { to: '/retornos', icon: RotateCcw, label: 'Retornos' },
  { to: '/mensagens', icon: MessageCircle, label: 'Mensagens', badge: 3 },
  { to: '/financeiro', icon: Wallet, label: 'Financeiro' },
  { to: '/relatorios', icon: BarChart2, label: 'Relatórios' },
]

const THEMES: { value: Theme; label: string; dot: string }[] = [
  { value: 'default', label: 'Padrão', dot: '#2563eb' },
  { value: 'dark', label: 'Dark', dot: '#0f1117' },
  { value: 'navy', label: 'Navy', dot: '#0f2044' },
]

function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const debouncedQ = useDebounce(query, 300)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const { data } = useQuery({
    queryKey: ['search', debouncedQ],
    queryFn: () => api.get(`/dashboard/search?q=${debouncedQ}`).then(r => r.data),
    enabled: debouncedQ.length >= 2,
  })

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const hasResults = data && (data.patients?.length || data.surgeries?.length || data.budgets?.length)

  function go(path: string) {
    navigate(path)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={ref} className="relative flex-1 max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar paciente, cirurgia, orçamento..."
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border outline-none transition"
          style={{
            backgroundColor: 'var(--color-card-bg)',
            borderColor: 'var(--color-card-border)',
            color: 'var(--color-text-primary)',
          }}
        />
        {query && (
          <button onClick={() => { setQuery(''); setOpen(false) }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:opacity-70">
            <X className="w-3 h-3" style={{ color: 'var(--color-text-secondary)' }} />
          </button>
        )}
      </div>

      {open && debouncedQ.length >= 2 && (
        <div className="absolute top-full mt-1 w-full rounded-xl shadow-xl border z-50 overflow-hidden"
          style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-card-border)' }}>
          {!hasResults
            ? <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>Nenhum resultado para "{debouncedQ}"</p>
            : <>
              {data?.patients?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold px-3 pt-3 pb-1 uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>Pacientes</p>
                  {data.patients.map((p: any) => (
                    <button key={p.id} onClick={() => go(`/pacientes/${p.id}`)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:opacity-70 text-left transition">
                      <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs shrink-0">
                        {p.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{p.name}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>{p.guardian?.name}</p>
                      </div>
                      <ChevronRight className="w-3 h-3 shrink-0" style={{ color: 'var(--color-text-secondary)' }} />
                    </button>
                  ))}
                </div>
              )}
              {data?.surgeries?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold px-3 pt-3 pb-1 uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>Cirurgias</p>
                  {data.surgeries.map((s: any) => (
                    <button key={s.id} onClick={() => go(`/cirurgias/${s.id}`)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:opacity-70 text-left transition">
                      <Scissors className="w-4 h-4 shrink-0 text-red-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{s.patient?.name}</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          {new Date(s.scheduledDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <ChevronRight className="w-3 h-3 shrink-0" style={{ color: 'var(--color-text-secondary)' }} />
                    </button>
                  ))}
                </div>
              )}
              {data?.budgets?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold px-3 pt-3 pb-1 uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>Orçamentos</p>
                  {data.budgets.map((b: any) => (
                    <button key={b.id} onClick={() => go(`/orcamentos/${b.id}`)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:opacity-70 text-left transition">
                      <FileText className="w-4 h-4 shrink-0 text-orange-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{b.code}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>{b.patient?.name}</p>
                      </div>
                      <p className="text-sm font-semibold shrink-0" style={{ color: 'var(--color-text-primary)' }}>
                        {formatCurrency(b.total)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
              <div className="h-2" />
            </>
          }
        </div>
      )}
    </div>
  )
}

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { data: dash } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then(r => r.data),
    staleTime: 60_000,
  })

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const notifications: { icon: any; color: string; text: string; sub?: string; link: string }[] = []

  if (dash?.active?.length) {
    notifications.push({
      icon: Scissors, color: 'text-red-500',
      text: `${dash.active.length} cirurgia(s) em andamento`,
      sub: dash.active.map((s: any) => s.patient.name).join(', '),
      link: '/cirurgias',
    })
  }
  if (dash?.pendingExams?.length) {
    notifications.push({
      icon: FlaskConical, color: 'text-yellow-500',
      text: `${dash.pendingExams.length} paciente(s) aguardando exames`,
      link: '/pacientes',
    })
  }
  if (dash?.pendingBudgets?.length) {
    notifications.push({
      icon: Clock, color: 'text-orange-500',
      text: `${dash.pendingBudgets.length} orçamento(s) aguardando aprovação`,
      link: '/orcamentos',
    })
  }
  if (dash?.returnsWeek?.length) {
    notifications.push({
      icon: Return, color: 'text-teal-500',
      text: `${dash.returnsWeek.length} retorno(s) nos próximos 7 dias`,
      link: '/retornos',
    })
  }

  const count = notifications.length
  const navigate = useNavigate()

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-lg transition hover:opacity-70"
        style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)' }}
      >
        <Bell className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-xl border z-50 overflow-hidden"
          style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-card-border)' }}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-card-border)' }}>
            <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Notificações</p>
            {count > 0 && <span className="badge bg-red-100 text-red-700">{count}</span>}
          </div>
          {notifications.length === 0
            ? <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-secondary)' }}>Tudo em ordem! ✓</p>
            : notifications.map((n, i) => (
              <button key={i} onClick={() => { navigate(n.link); setOpen(false) }}
                className="w-full flex items-start gap-3 px-4 py-3 border-b last:border-0 hover:opacity-70 transition text-left"
                style={{ borderColor: 'var(--color-card-border)' }}>
                <n.icon className={`w-4 h-4 mt-0.5 shrink-0 ${n.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{n.text}</p>
                  {n.sub && <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{n.sub}</p>}
                </div>
                <ChevronRight className="w-3 h-3 shrink-0 mt-1" style={{ color: 'var(--color-text-secondary)' }} />
              </button>
            ))
          }
        </div>
      )}
    </div>
  )
}

export default function AppLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [showThemePicker, setShowThemePicker] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--color-bg)' }}>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'sidebar fixed lg:static inset-y-0 left-0 z-30 flex flex-col border-r transition-transform duration-200',
          'w-[var(--sidebar-width)]',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-5 border-b" style={{ borderColor: 'var(--color-sidebar-border)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'var(--color-logo-bg)' }}>
            <Scissors className="w-4 h-4" style={{ color: 'var(--color-logo-text, #fff)' }} />
          </div>
          <div>
            <p className="font-bold text-sm leading-none" style={{ color: 'var(--color-sidebar-text-active)' }}>NOVUS</p>
            <p className="text-[10px] leading-tight" style={{ color: 'var(--color-sidebar-text)' }}>Cirurgia Veterinária</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn('sidebar-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors', isActive && 'active')
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {badge ? (
                <span className="w-5 h-5 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">
                  {badge}
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>

        {/* Theme picker + Logout */}
        <div className="px-3 py-4 border-t space-y-1" style={{ borderColor: 'var(--color-sidebar-border)' }}>
          <div className="relative">
            <button
              onClick={() => setShowThemePicker(v => !v)}
              className="sidebar-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm w-full transition-colors"
            >
              <Palette className="w-4 h-4 shrink-0" />
              <span>Aparência</span>
              <span className="ml-auto w-3 h-3 rounded-full border border-white/20"
                style={{ backgroundColor: THEMES.find(t => t.value === theme)?.dot }} />
            </button>

            {showThemePicker && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowThemePicker(false)} />
                <div className="absolute bottom-full left-0 mb-2 rounded-xl shadow-xl border overflow-hidden z-20 w-full"
                  style={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-card-border)' }}>
                  {THEMES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => { setTheme(t.value); setShowThemePicker(false) }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:opacity-80"
                      style={{
                        color: 'var(--color-text-primary)',
                        backgroundColor: theme === t.value ? 'var(--color-accent-subtle)' : 'transparent',
                        fontWeight: theme === t.value ? 600 : 400,
                      }}
                    >
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 shadow-sm shrink-0"
                        style={{ backgroundColor: t.dot }} />
                      {t.label}
                      {theme === t.value && <span className="ml-auto text-xs" style={{ color: 'var(--color-accent)' }}>✓ Ativo</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button onClick={handleLogout} className="sidebar-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm w-full transition-colors">
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="topbar flex items-center gap-3 px-4 py-3 border-b"
          style={{ borderColor: 'var(--color-card-border)', backgroundColor: 'var(--color-card-bg)' }}>
          <button onClick={() => setOpen(true)}
            className="sidebar-link p-2 rounded-lg transition-colors lg:hidden">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold lg:hidden" style={{ color: 'var(--color-text-primary)' }}>NOVUS</span>
          <div className="hidden lg:flex flex-1">
            <GlobalSearch />
          </div>
          <div className="ml-auto lg:ml-0">
            <NotificationBell />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
