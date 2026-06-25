import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { formatCurrency, cn, SURGERY_STATUS_LABELS, SURGERY_STATUS_COLORS } from '../lib/utils'
import {
  TrendingUp, TrendingDown, Scissors, FileText, AlertCircle,
  RotateCcw, Stethoscope, FlaskConical, Clock, CheckCircle2,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function DashboardPage() {
  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Bom dia' : today.getHours() < 18 ? 'Boa tarde' : 'Boa noite'

  const { data: dash, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then(r => r.data),
    refetchInterval: 60_000,
  })

  const { data: financial } = useQuery({
    queryKey: ['financial-summary'],
    queryFn: () => api.get('/financial/summary').then(r => r.data),
  })

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Carregando dashboard...</p>
      </div>
    </div>
  )

  const todaySurgeries = dash?.today?.surgeries || []
  const todayConsultations = dash?.today?.consultations || []
  const activeSurgeries = dash?.active || []
  const returnsWeek = dash?.returnsWeek || []
  const pendingExams = dash?.pendingExams || []
  const pendingBudgets = dash?.pendingBudgets || []

  const alertCount = activeSurgeries.length + pendingExams.length + (pendingBudgets.length > 3 ? 1 : 0)

  return (
    <div className="space-y-5">
      {/* Saudação */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {greeting}! 👋
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          {today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          {alertCount > 0 && <span className="ml-2 text-orange-500 font-medium">· {alertCount} {alertCount === 1 ? 'item' : 'itens'} precisam de atenção</span>}
        </p>
      </div>

      {/* Cards métricas do mês */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Receita do Mês', value: formatCurrency(dash?.month?.revenue || 0), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Despesas do Mês', value: formatCurrency(dash?.month?.expenses || 0), icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Cirurgias no Mês', value: String(dash?.month?.surgeries || 0), icon: Scissors, color: 'text-brand-600', bg: 'bg-brand-50', suffix: 'cirurgias' },
          { label: 'Saldo Líquido', value: formatCurrency((financial?.netBalance) || 0), icon: CheckCircle2, color: (financial?.netBalance || 0) >= 0 ? 'text-green-600' : 'text-red-500', bg: (financial?.netBalance || 0) >= 0 ? 'bg-green-50' : 'bg-red-50' },
        ].map(c => (
          <div key={c.label} className="card p-4">
            <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center mb-3`}>
              <c.icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{c.label}</p>
            <p className={`text-lg font-bold mt-0.5 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Hoje */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Cirurgias de hoje */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Scissors className="w-4 h-4 text-red-500" />
            <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Cirurgias Hoje</h2>
            <span className={cn('badge ml-auto', todaySurgeries.length > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500')}>
              {todaySurgeries.length}
            </span>
          </div>
          {todaySurgeries.length === 0
            ? <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>Nenhuma cirurgia hoje</p>
            : todaySurgeries.map((s: any) => (
              <Link key={s.id} to={`/cirurgias/${s.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:opacity-80 transition">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-xs shrink-0">
                  {s.patient.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{s.patient.name}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>{s.patient.guardian.name}</p>
                </div>
                <p className="text-xs shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
                  {new Date(s.scheduledDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </Link>
            ))
          }
        </div>

        {/* Consultas de hoje */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Stethoscope className="w-4 h-4 text-indigo-500" />
            <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Consultas Hoje</h2>
            <span className={cn('badge ml-auto', todayConsultations.length > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500')}>
              {todayConsultations.length}
            </span>
          </div>
          {todayConsultations.length === 0
            ? <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>Nenhuma consulta hoje</p>
            : todayConsultations.map((c: any) => (
              <Link key={c.id} to={`/pacientes/${c.patientId}?tab=consulta`}
                className="flex items-center gap-3 p-2 rounded-lg hover:opacity-80 transition">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                  {c.patient.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{c.patient.name}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {new Date(c.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    {c.mode === 'ONLINE' && ' · 📹 Online'}
                  </p>
                </div>
              </Link>
            ))
          }
        </div>
      </div>

      {/* Cirurgias em andamento */}
      {activeSurgeries.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Em Andamento Agora</h2>
            <span className="badge bg-red-100 text-red-700 ml-auto">{activeSurgeries.length}</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {activeSurgeries.map((s: any) => (
              <Link key={s.id} to={`/cirurgias/${s.id}`}
                className="flex items-center gap-3 p-3 rounded-lg border transition hover:shadow-sm"
                style={{ borderColor: 'var(--color-card-border)' }}>
                <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold shrink-0">
                  {s.patient.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{s.patient.name}</p>
                  <span className={cn('badge text-xs mt-0.5', SURGERY_STATUS_COLORS[s.status])}>
                    {SURGERY_STATUS_LABELS[s.status]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Retornos da semana */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <RotateCcw className="w-4 h-4 text-teal-500" />
            <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Retornos (7 dias)</h2>
            <span className={cn('badge ml-auto', returnsWeek.length > 0 ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500')}>
              {returnsWeek.length}
            </span>
          </div>
          {returnsWeek.length === 0
            ? <p className="text-sm text-center py-3" style={{ color: 'var(--color-text-secondary)' }}>Nenhum retorno</p>
            : returnsWeek.slice(0, 5).map((r: any) => (
              <div key={r.id} className="flex items-center gap-2 py-1.5 border-b last:border-0" style={{ borderColor: 'var(--color-card-border)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{r.surgery?.patient?.name}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {new Date(r.returnDate).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            ))
          }
        </div>

        {/* Aguardando exames */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical className="w-4 h-4 text-yellow-500" />
            <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Aguardando Exames</h2>
            <span className={cn('badge ml-auto', pendingExams.length > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500')}>
              {pendingExams.length}
            </span>
          </div>
          {pendingExams.length === 0
            ? <p className="text-sm text-center py-3" style={{ color: 'var(--color-text-secondary)' }}>Nenhum pendente</p>
            : pendingExams.slice(0, 5).map((c: any) => (
              <Link key={c.id} to={`/pacientes/${c.patientId}?tab=consulta`}
                className="flex items-center gap-2 py-1.5 border-b last:border-0 hover:opacity-80 transition" style={{ borderColor: 'var(--color-card-border)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{c.patient?.name}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>🔬 Exames pré-op pendentes</p>
                </div>
              </Link>
            ))
          }
        </div>

        {/* Orçamentos aguardando */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-orange-500" />
            <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Orçamentos Pendentes</h2>
            <span className={cn('badge ml-auto', pendingBudgets.length > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500')}>
              {pendingBudgets.length}
            </span>
          </div>
          {pendingBudgets.length === 0
            ? <p className="text-sm text-center py-3" style={{ color: 'var(--color-text-secondary)' }}>Nenhum pendente</p>
            : pendingBudgets.slice(0, 5).map((b: any) => (
              <Link key={b.id} to={`/orcamentos/${b.id}`}
                className="flex items-center gap-2 py-1.5 border-b last:border-0 hover:opacity-80 transition" style={{ borderColor: 'var(--color-card-border)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{b.patient?.name}</p>
                  <p className="text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }}>{b.code}</p>
                </div>
                <p className="text-sm font-semibold shrink-0" style={{ color: 'var(--color-text-primary)' }}>
                  {formatCurrency(b.total)}
                </p>
              </Link>
            ))
          }
        </div>
      </div>

      {/* Gráfico cirurgias por mês */}
      {dash?.chart && (
        <div className="card p-4">
          <h2 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text-primary)' }}>Cirurgias — Últimos 6 Meses</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={dash.chart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', borderRadius: 8, fontSize: 12 }}
                formatter={(v: any) => [`${v} cirurgias`, '']}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {dash.chart.map((_: any, i: number) => (
                  <Cell key={i} fill={i === dash.chart.length - 1 ? 'var(--color-accent)' : '#cbd5e1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
