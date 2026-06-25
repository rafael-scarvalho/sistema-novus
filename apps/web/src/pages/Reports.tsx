import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, LineChart, Line, CartesianGrid,
} from 'recharts'
import { TrendingUp, Scissors, RotateCcw, Users, DollarSign } from 'lucide-react'

export default function ReportsPage() {
  const { data: dash } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then(r => r.data),
  })

  const { data: financial } = useQuery({
    queryKey: ['financial-summary'],
    queryFn: () => api.get('/financial/summary').then(r => r.data),
  })

  const { data: surgeries } = useQuery({
    queryKey: ['surgeries-all'],
    queryFn: () => api.get('/surgeries?limit=200').then(r => r.data),
  })

  const { data: returns } = useQuery({
    queryKey: ['returns-all'],
    queryFn: () => api.get('/returns').then(r => r.data),
  })

  // Calcula estatísticas a partir dos dados locais
  const surgeriesList: any[] = Array.isArray(surgeries) ? surgeries : (surgeries?.data || [])
  const returnsList: any[] = Array.isArray(returns) ? returns : (returns?.data || [])

  // Distribuição por espécie
  const speciesCount: Record<string, number> = {}
  surgeriesList.forEach(s => {
    const sp = s.patient?.species || 'OUTRO'
    speciesCount[sp] = (speciesCount[sp] || 0) + 1
  })
  const SPECIES_LABEL: Record<string, string> = {
    CANINO: 'Canino', FELINO: 'Felino', EXOTICO: 'Exótico', OUTRO: 'Outro',
  }
  const speciesData = Object.entries(speciesCount).map(([k, v]) => ({ name: SPECIES_LABEL[k] || k, value: v }))
  const COLORS = ['#2563eb', '#f59e0b', '#10b981', '#8b5cf6']

  // Status de retornos
  const returnsDone = returnsList.filter(r => r.status === 'REALIZADO').length
  const returnsPending = returnsList.filter(r => r.status === 'PENDENTE').length
  const returnRate = returnsList.length ? ((returnsDone / returnsList.length) * 100).toFixed(0) : '0'

  // Ticket médio
  const completedSurgeries = surgeriesList.filter(s => s.status === 'ALTA_CONCEDIDA')
  const avgTicket = completedSurgeries.length
    ? completedSurgeries.reduce((acc, s) => acc + (s.budget?.total || 0), 0) / completedSurgeries.length
    : 0

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Relatórios e Métricas</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Visão geral de desempenho da clínica</p>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total de Cirurgias', value: String(surgeriesList.filter(s => s.status !== 'CANCELADA').length), icon: Scissors, color: 'text-brand-600', bg: 'bg-brand-50' },
          { label: 'Ticket Médio', value: formatCurrency(avgTicket), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Taxa de Retorno', value: `${returnRate}%`, icon: RotateCcw, color: 'text-teal-600', bg: 'bg-teal-50' },
          { label: 'Receita Total', value: formatCurrency(financial?.totalRevenue || 0), icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
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

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Cirurgias por mês */}
        {dash?.chart && (
          <div className="card p-4">
            <h2 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text-primary)' }}>Cirurgias por Mês</h2>
            <ResponsiveContainer width="100%" height={180}>
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

        {/* Distribuição por espécie */}
        <div className="card p-4">
          <h2 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text-primary)' }}>Distribuição por Espécie</h2>
          {speciesData.length === 0
            ? <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>Sem dados ainda</p>
            : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={speciesData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} paddingAngle={3}>
                    {speciesData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 12, color: 'var(--color-text-secondary)' }} />
                </PieChart>
              </ResponsiveContainer>
            )
          }
        </div>
      </div>

      {/* Retornos */}
      <div className="card p-4">
        <h2 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text-primary)' }}>Status de Retornos</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total', value: returnsList.length, color: 'text-brand-600' },
            { label: 'Realizados', value: returnsDone, color: 'text-green-600' },
            { label: 'Pendentes', value: returnsPending, color: 'text-orange-500' },
          ].map(r => (
            <div key={r.label} className="text-center p-4 rounded-xl" style={{ backgroundColor: 'var(--color-bg)' }}>
              <p className={`text-3xl font-bold ${r.color}`}>{r.value}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{r.label}</p>
            </div>
          ))}
        </div>
        {returnsList.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Taxa de realização</p>
              <p className="text-xs font-semibold text-green-600">{returnRate}%</p>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg)' }}>
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${returnRate}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Financeiro resumido */}
      {financial && (
        <div className="card p-4">
          <h2 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text-primary)' }}>Resumo Financeiro</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Receita Total', value: formatCurrency(financial.totalRevenue || 0), color: 'text-green-600' },
              { label: 'Despesas', value: formatCurrency(financial.totalExpenses || 0), color: 'text-red-500' },
              { label: 'Saldo', value: formatCurrency(financial.netBalance || 0), color: (financial.netBalance || 0) >= 0 ? 'text-green-600' : 'text-red-500' },
            ].map(f => (
              <div key={f.label} className="text-center p-4 rounded-xl" style={{ backgroundColor: 'var(--color-bg)' }}>
                <p className={`text-2xl font-bold ${f.color}`}>{f.value}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{f.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
