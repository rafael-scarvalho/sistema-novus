import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { formatCurrency, formatDate, BUDGET_STATUS_LABELS, BUDGET_STATUS_COLORS } from '../lib/utils'
import { cn } from '../lib/utils'
import { Plus, Search, FileText, ChevronRight } from 'lucide-react'

export default function BudgetsPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets', status],
    queryFn: () => api.get(`/budgets${status ? `?status=${status}` : ''}`).then((r) => r.data),
  })

  const filtered = budgets.filter((b: any) =>
    !search ||
    b.code.toLowerCase().includes(search.toLowerCase()) ||
    b.patient.name.toLowerCase().includes(search.toLowerCase())
  )

  const STATUS_TABS = [
    { value: '', label: 'Todos' },
    { value: 'RASCUNHO', label: 'Rascunho' },
    { value: 'ENVIADO', label: 'Enviados' },
    { value: 'APROVADO', label: 'Aprovados' },
    { value: 'RECUSADO', label: 'Recusados' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-sm text-gray-500">Crie e gerencie orçamentos cirúrgicos</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/orcamentos/novo')}>
          <Plus className="w-4 h-4" />
          Novo Orçamento
        </button>
      </div>

      <div className="card p-1 flex gap-1 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatus(tab.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
              status === tab.value ? 'bg-brand-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="input pl-9" placeholder="Buscar por código ou paciente..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="space-y-2">
        {isLoading && <p className="text-sm text-gray-400 text-center py-8">Carregando...</p>}
        {!isLoading && filtered.length === 0 && (
          <div className="card p-8 text-center">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Nenhum orçamento encontrado</p>
          </div>
        )}
        {filtered.map((b: any) => (
          <Link key={b.id} to={`/orcamentos/${b.id}`}
            className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-gray-900">{b.code}</p>
                <span className={cn('badge', BUDGET_STATUS_COLORS[b.status])}>
                  {BUDGET_STATUS_LABELS[b.status]}
                </span>
              </div>
              <p className="text-sm text-gray-500 truncate">
                {b.patient.name} · {b.patient.guardian.name}
              </p>
              {b.partner && <p className="text-xs text-gray-400">{b.partner.name}</p>}
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-gray-900">{formatCurrency(b.total)}</p>
              <p className="text-xs text-gray-400">{formatDate(b.createdAt)}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}
