import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { formatDate, cn } from '../lib/utils'
import { CalendarCheck, AlertCircle, CheckCircle2, Clock, MessageCircle } from 'lucide-react'

export default function ReturnsPage() {
  const qc = useQueryClient()

  const { data: returns = [], isLoading } = useQuery({
    queryKey: ['returns-all'],
    queryFn: () => api.get('/returns').then(r => r.data),
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const overdue = returns.filter((r: any) => new Date(r.returnDate) < today && r.status === 'PENDENTE')
  const upcoming = returns.filter((r: any) => {
    const d = new Date(r.returnDate)
    return d >= today && r.status === 'PENDENTE'
  })
  const completed = returns.filter((r: any) => r.status === 'REALIZADO')

  const complete = useMutation({
    mutationFn: (id: string) => api.patch(`/returns/${id}/complete`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['returns-all'] }),
  })

  const notifyWhatsApp = useMutation({
    mutationFn: (id: string) => api.post(`/returns/${id}/notify`, {}),
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Retornos Pós-Cirúrgicos</h1>
        <p className="text-sm text-gray-500">Acompanhamento e alertas de retorno</p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3 text-center">
          <AlertCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-red-500">{overdue.length}</p>
          <p className="text-xs text-gray-500">Atrasados</p>
        </div>
        <div className="card p-3 text-center">
          <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-blue-500">{upcoming.length}</p>
          <p className="text-xs text-gray-500">Próximos</p>
        </div>
        <div className="card p-3 text-center">
          <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-green-500">{completed.length}</p>
          <p className="text-xs text-gray-500">Realizados</p>
        </div>
      </div>

      {/* Atrasados */}
      {overdue.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" /> Retornos Atrasados
          </h2>
          <div className="space-y-2">
            {overdue.map((r: any) => (
              <ReturnCard key={r.id} r={r} onComplete={() => complete.mutate(r.id)} onNotify={() => notifyWhatsApp.mutate(r.id)} overdue />
            ))}
          </div>
        </div>
      )}

      {/* Próximos */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-blue-600 mb-2 flex items-center gap-1">
            <Clock className="w-4 h-4" /> Próximos Retornos
          </h2>
          <div className="space-y-2">
            {upcoming.map((r: any) => (
              <ReturnCard key={r.id} r={r} onComplete={() => complete.mutate(r.id)} onNotify={() => notifyWhatsApp.mutate(r.id)} />
            ))}
          </div>
        </div>
      )}

      {isLoading && <p className="text-center text-sm text-gray-400 py-8">Carregando...</p>}
      {!isLoading && returns.length === 0 && (
        <div className="card p-8 text-center">
          <CalendarCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Nenhum retorno agendado</p>
          <p className="text-xs text-gray-400 mt-1">Retornos são criados no pós-op de cada cirurgia</p>
        </div>
      )}

      {/* Realizados */}
      {completed.length > 0 && (
        <details className="card">
          <summary className="p-4 cursor-pointer text-sm font-medium text-gray-600 select-none">
            Realizados ({completed.length})
          </summary>
          <div className="px-4 pb-4 space-y-2">
            {completed.map((r: any) => (
              <div key={r.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0 opacity-60">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{r.surgery?.patient?.name}</p>
                  <p className="text-xs text-gray-400">{r.notes}</p>
                </div>
                <p className="text-xs text-gray-400">{formatDate(r.returnDate)}</p>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

function ReturnCard({ r, onComplete, onNotify, overdue }: any) {
  const daysUntil = Math.ceil((new Date(r.returnDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className={cn('card p-3', overdue ? 'border-red-200 bg-red-50' : daysUntil <= 2 ? 'border-yellow-200 bg-yellow-50' : '')}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/cirurgias/${r.surgeryId}`} className="text-sm font-semibold text-gray-900 hover:text-brand-600">
              {r.surgery?.patient?.name}
            </Link>
            {overdue && <span className="badge bg-red-100 text-red-600">Atrasado {Math.abs(daysUntil)}d</span>}
            {!overdue && daysUntil <= 2 && <span className="badge bg-yellow-100 text-yellow-700">Em {daysUntil}d</span>}
            {!overdue && daysUntil > 2 && <span className="badge bg-blue-100 text-blue-700">Em {daysUntil}d</span>}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatDate(r.returnDate)} · {r.surgery?.patient?.guardian?.name}
          </p>
          {r.notes && <p className="text-xs text-gray-600 mt-1">{r.notes}</p>}
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={onNotify} title="Lembrete WhatsApp"
            className="btn-ghost p-1.5 text-green-600 hover:bg-green-50">
            <MessageCircle className="w-4 h-4" />
          </button>
          <button onClick={onComplete}
            className="btn-ghost p-1.5 text-green-600 hover:bg-green-50" title="Marcar como realizado">
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
