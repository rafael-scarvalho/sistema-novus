import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { SURGERY_STATUS_LABELS, SURGERY_STATUS_COLORS, formatDate, formatDateTime, cn } from '../lib/utils'
import { Scissors, CheckCircle2, Clock, FileText } from 'lucide-react'

const STATUS_FLOW = [
  'AGENDADA', 'CHECKIN_REALIZADO', 'PREPARACAO_ANESTESICA',
  'EM_CIRURGIA', 'RECUPERACAO', 'ALTA_CONCEDIDA',
]

export default function PortalPage() {
  const { token } = useParams<{ token: string }>()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['portal', token],
    queryFn: () => api.get(`/portal/${token}`).then((r) => r.data),
  })

  if (isLoading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <p className="text-gray-400">Carregando...</p>
    </div>
  )

  if (isError) return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">❌</span>
        </div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">Link inválido ou expirado</h1>
        <p className="text-sm text-gray-500">Entre em contato com a clínica para solicitar um novo acesso.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-900 to-brand-700 pb-8">
      {/* Header */}
      <div className="px-4 pt-8 pb-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-3">
          <Scissors className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-white">NOVUS</h1>
        <p className="text-blue-200 text-sm">Cirurgia Veterinária Avançada</p>
        <p className="text-white/80 text-sm mt-3">Olá, {data.guardian.name}!</p>
      </div>

      {/* Pacientes */}
      <div className="px-4 space-y-4">
        {data.patients.map((patient: any) => (
          <div key={patient.id} className="card p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center font-bold text-brand-600">
                {patient.name[0]}
              </div>
              <div>
                <p className="font-bold text-gray-900">{patient.name}</p>
                <p className="text-xs text-gray-500">{patient.species}{patient.breed ? ` · ${patient.breed}` : ''}</p>
              </div>
            </div>

            {patient.surgeries.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-2">Nenhuma cirurgia registrada</p>
            )}

            {patient.surgeries.map((surgery: any) => {
              const currentIdx = STATUS_FLOW.indexOf(surgery.status)

              return (
                <div key={surgery.id} className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-700">
                      {formatDate(surgery.scheduledDate)}
                    </p>
                    <span className={cn('badge', SURGERY_STATUS_COLORS[surgery.status])}>
                      {SURGERY_STATUS_LABELS[surgery.status]}
                    </span>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-2 mb-4">
                    {STATUS_FLOW.map((s, idx) => {
                      const done = idx < currentIdx
                      const active = idx === currentIdx
                      return (
                        <div key={s} className="flex items-center gap-3">
                          <div className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                            done ? 'bg-green-500' : active ? 'bg-brand-500' : 'bg-gray-100'
                          )}>
                            {done
                              ? <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                              : active
                                ? <Clock className="w-3 h-3 text-white animate-pulse" />
                                : <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                            }
                          </div>
                          <span className={cn(
                            'text-sm',
                            done ? 'text-gray-400 line-through' : active ? 'font-semibold text-gray-900' : 'text-gray-400'
                          )}>
                            {SURGERY_STATUS_LABELS[s]}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Laudos disponíveis */}
                  {surgery.postOpReportFiles?.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-blue-700 mb-2 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Laudos disponíveis
                      </p>
                      {surgery.postOpReportFiles.map((f: string) => (
                        <a
                          key={f}
                          href={`/api/portal/${token}/surgery/${surgery.id}/files/${f}`}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-xs text-brand-600 hover:underline py-0.5"
                        >
                          📎 {f}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Histórico de mensagens */}
                  {surgery.statusHistory.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-medium text-gray-500">Atualizações</p>
                      {surgery.statusHistory.slice(-3).reverse().map((h: any) => (
                        <div key={h.id} className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                          <span className="text-gray-400 mr-1">{formatDateTime(h.createdAt)}</span>
                          {h.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
