import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { formatDate, SURGERY_STATUS_LABELS, SURGERY_STATUS_COLORS } from '../lib/utils'
import { Scissors, Search, ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'

const STATUS_TABS = [
  { value: '', label: 'Todas' },
  { value: 'AGENDADA', label: 'Agendadas' },
  { value: 'EM_CIRURGIA', label: 'Em Cirurgia' },
  { value: 'RECUPERACAO', label: 'Recuperação' },
  { value: 'ALTA_CONCEDIDA', label: 'Alta' },
]

export default function SurgeriesPage() {
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')

  const { data: surgeries = [], isLoading } = useQuery({
    queryKey: ['surgeries', status],
    queryFn: () => api.get(`/surgeries${status ? `?status=${status}` : ''}`).then((r) => r.data),
  })

  const filtered = surgeries.filter((s: any) =>
    !search ||
    s.patient.name.toLowerCase().includes(search.toLowerCase()) ||
    s.patient.guardian.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cirurgias</h1>
          <p className="text-sm text-gray-500">Gerencie os procedimentos cirúrgicos</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-1 flex gap-1 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatus(tab.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
              status === tab.value
                ? 'bg-brand-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Buscar por paciente ou tutor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {isLoading && <p className="text-sm text-gray-400 text-center py-8">Carregando...</p>}
        {!isLoading && filtered.length === 0 && (
          <div className="card p-8 text-center">
            <Scissors className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Nenhuma cirurgia encontrada</p>
          </div>
        )}
        {filtered.map((s: any) => (
          <Link
            key={s.id}
            to={`/cirurgias/${s.id}`}
            className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center font-bold text-brand-600 shrink-0">
              {s.patient.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-gray-900">{s.patient.name}</p>
                <span className={cn('badge', SURGERY_STATUS_COLORS[s.status])}>
                  {SURGERY_STATUS_LABELS[s.status]}
                </span>
              </div>
              <p className="text-sm text-gray-500 truncate">
                Tutor: {s.patient.guardian.name}
                {s.partner && ` · Parceiro: ${s.partner.name}`}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-medium text-gray-700">{formatDate(s.scheduledDate)}</p>
              <p className="text-xs text-gray-400">
                {new Date(s.scheduledDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}
