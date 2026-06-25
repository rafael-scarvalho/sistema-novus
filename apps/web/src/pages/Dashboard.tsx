import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/utils'
import { TrendingUp, TrendingDown, Clock, Scissors, FileText, AlertCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function DashboardPage() {
  const { data: summary } = useQuery({
    queryKey: ['financial-summary'],
    queryFn: () => api.get('/financial/summary').then((r) => r.data),
  })

  const { data: surgeries } = useQuery({
    queryKey: ['surgeries-today'],
    queryFn: () => api.get('/surgeries?status=AGENDADA').then((r) => r.data),
  })

  const { data: pendingBudgets } = useQuery({
    queryKey: ['budgets-pending'],
    queryFn: () => api.get('/budgets?status=ENVIADO').then((r) => r.data),
  })

  const cards = [
    {
      label: 'Receita Confirmada',
      value: formatCurrency(summary?.totalRevenue || 0),
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Despesas',
      value: formatCurrency(summary?.totalExpenses || 0),
      icon: TrendingDown,
      color: 'text-red-500',
      bg: 'bg-red-50',
    },
    {
      label: 'A Receber',
      value: formatCurrency(summary?.pendingReceivables || 0),
      icon: Clock,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      label: 'Repasses Pendentes',
      value: formatCurrency(summary?.pendingSettlements || 0),
      icon: AlertCircle,
      color: 'text-orange-500',
      bg: 'bg-orange-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Visão geral do seu negócio</p>
      </div>

      {/* Cards financeiros */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center mb-3`}>
              <c.icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Cirurgias agendadas */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Scissors className="w-4 h-4 text-brand-500" />
            <h2 className="font-semibold text-gray-900">Próximas Cirurgias</h2>
            <span className="badge bg-brand-50 text-brand-600 ml-auto">{surgeries?.length || 0}</span>
          </div>
          <div className="space-y-2">
            {surgeries?.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Nenhuma cirurgia agendada</p>
            )}
            {surgeries?.slice(0, 5).map((s: any) => (
              <a
                key={s.id}
                href={`/cirurgias/${s.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-xs font-bold text-brand-600">
                  {s.patient.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{s.patient.name}</p>
                  <p className="text-xs text-gray-400 truncate">{s.patient.guardian.name}</p>
                </div>
                <p className="text-xs text-gray-500 shrink-0">
                  {new Date(s.scheduledDate).toLocaleDateString('pt-BR')}
                </p>
              </a>
            ))}
          </div>
        </div>

        {/* Orçamentos aguardando */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-gray-900">Orçamentos Aguardando</h2>
            <span className="badge bg-amber-50 text-amber-600 ml-auto">{pendingBudgets?.length || 0}</span>
          </div>
          <div className="space-y-2">
            {pendingBudgets?.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum orçamento pendente</p>
            )}
            {pendingBudgets?.slice(0, 5).map((b: any) => (
              <a
                key={b.id}
                href={`/orcamentos/${b.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{b.code}</p>
                  <p className="text-xs text-gray-400 truncate">{b.patient.name}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900 shrink-0">
                  {formatCurrency(b.total)}
                </p>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Saldo */}
      {summary && (
        <div className="card p-4">
          <h2 className="font-semibold text-gray-900 mb-2">Saldo Líquido</h2>
          <p className={`text-3xl font-bold ${summary.netBalance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {formatCurrency(summary.netBalance)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Receitas confirmadas menos despesas pagas</p>
        </div>
      )}
    </div>
  )
}
