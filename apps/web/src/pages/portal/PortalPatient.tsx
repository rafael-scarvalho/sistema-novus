import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { usePortalAuth } from '../../contexts/PortalAuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const STATUS_LABELS: Record<string, string> = {
  AGENDADA: 'Agendada', CHECKIN_REALIZADO: 'Check-in realizado',
  PREPARACAO_ANESTESICA: 'Preparação anestésica', EM_CIRURGIA: 'Em cirurgia',
  RECUPERACAO: 'Em recuperação', ALTA_CONCEDIDA: 'Alta concedida', CANCELADA: 'Cancelada',
}
const STATUS_COLOR: Record<string, string> = {
  AGENDADA: 'bg-blue-100 text-blue-700', CHECKIN_REALIZADO: 'bg-yellow-100 text-yellow-700',
  PREPARACAO_ANESTESICA: 'bg-orange-100 text-orange-700', EM_CIRURGIA: 'bg-red-100 text-red-700',
  RECUPERACAO: 'bg-purple-100 text-purple-700', ALTA_CONCEDIDA: 'bg-green-100 text-green-700',
  CANCELADA: 'bg-gray-100 text-gray-500',
}
const RECORD_TYPE_LABELS: Record<string, string> = {
  SURGERY_REPORT: 'Relatório Cirúrgico', EXAM_REPORT: 'Laudo de Exame',
  DOCUMENT: 'Documento', EXAM_REQUEST: 'Requisição de Exame', PRESCRIPTION: 'Receituário',
}
const PAYMENT_LABELS: Record<string, string> = {
  DINHEIRO: 'Dinheiro', PIX: 'PIX', CARTAO_CREDITO: 'Cartão de Crédito',
  CARTAO_DEBITO: 'Cartão de Débito', BOLETO: 'Boleto', TRANSFERENCIA: 'Transferência', PARCELADO: 'Parcelado',
}

type Tab = 'cirurgias' | 'orcamentos' | 'documentos'

export default function PortalPatient() {
  const { token, logout } = usePortalAuth()
  const { patientId } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('cirurgias')

  useEffect(() => {
    if (!token) { navigate('/portal/login'); return }
    fetch(`${API}/api/portal-auth/paciente/${patientId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setPatient)
      .catch(() => navigate('/portal/dashboard'))
      .finally(() => setLoading(false))
  }, [token, patientId])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-400">Carregando...</div>
    </div>
  )

  const TABS: { id: Tab; label: string }[] = [
    { id: 'cirurgias', label: '🔪 Cirurgias' },
    { id: 'orcamentos', label: '📋 Orçamentos' },
    { id: 'documentos', label: '📄 Documentos' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-600 text-white px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link to="/portal/dashboard" className="text-indigo-200 hover:text-white">‹</Link>
          <div>
            <div className="font-bold text-lg">{patient?.name}</div>
            <div className="text-indigo-200 text-sm">{patient?.breed || patient?.species}</div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto flex">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition ${
                tab === t.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* ── Cirurgias ── */}
        {tab === 'cirurgias' && (
          <>
            {patient?.surgeries?.length === 0 && (
              <div className="bg-white rounded-xl p-6 text-center text-gray-400">Nenhuma cirurgia registrada.</div>
            )}
            {patient?.surgeries?.map((surgery: any) => (
              <div key={surgery.id} className="bg-white rounded-xl shadow-sm p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {new Date(surgery.scheduledDate).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium mt-1 inline-block ${STATUS_COLOR[surgery.status] || 'bg-gray-100 text-gray-500'}`}>
                      {STATUS_LABELS[surgery.status] || surgery.status}
                    </span>
                  </div>
                </div>

                {/* Timeline de status */}
                {surgery.statusHistory?.length > 0 && (
                  <div className="border-l-2 border-indigo-100 pl-4 space-y-3">
                    {surgery.statusHistory.map((s: any) => (
                      <div key={s.id}>
                        <div className="text-xs text-gray-400">
                          {new Date(s.createdAt).toLocaleString('pt-BR')}
                        </div>
                        <div className="text-sm text-gray-700 font-medium">{STATUS_LABELS[s.status] || s.status}</div>
                        {s.message && <div className="text-sm text-gray-500">{s.message}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Informações pós-op */}
                {surgery.postOpDischargeSummary && (
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-xs font-semibold text-green-700 mb-1">Instruções de Alta</div>
                    <div className="text-sm text-green-800 whitespace-pre-line">{surgery.postOpDischargeSummary}</div>
                  </div>
                )}

                {surgery.postOpPrescriptions && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-xs font-semibold text-blue-700 mb-1">Prescrições</div>
                    <div className="text-sm text-blue-800 whitespace-pre-line">{surgery.postOpPrescriptions}</div>
                  </div>
                )}

                {surgery.postOpReturnDate && (
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <div className="text-xs font-semibold text-yellow-700 mb-1">📅 Retorno agendado</div>
                    <div className="text-sm text-yellow-800">
                      {new Date(surgery.postOpReturnDate).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                  </div>
                )}

                {/* Laudos anexados */}
                {surgery.postOpReportFiles?.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-600 mb-2">Laudos e relatórios</div>
                    <div className="space-y-1">
                      {surgery.postOpReportFiles.map((f: string, i: number) => (
                        <a key={i} href={`${API}/${f}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-indigo-600 hover:underline">
                          📎 Arquivo {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* ── Orçamentos ── */}
        {tab === 'orcamentos' && (
          <>
            {patient?.budgets?.length === 0 && (
              <div className="bg-white rounded-xl p-6 text-center text-gray-400">Nenhum orçamento disponível.</div>
            )}
            {patient?.budgets?.map((budget: any) => (
              <div key={budget.id} className="bg-white rounded-xl shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-sm font-bold text-indigo-600">{budget.code}</span>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {new Date(budget.createdAt).toLocaleDateString('pt-BR')}
                      {budget.validUntil && ` · Válido até ${new Date(budget.validUntil).toLocaleDateString('pt-BR')}`}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    budget.status === 'APROVADO' ? 'bg-green-100 text-green-700' :
                    budget.status === 'ENVIADO' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {budget.status}
                  </span>
                </div>

                <div className="divide-y divide-gray-100">
                  {budget.items?.map((item: any) => (
                    <div key={item.id} className="py-2 flex justify-between text-sm">
                      <span className="text-gray-700">{item.name} {item.quantity !== 1 && `× ${item.quantity}`}</span>
                      <span className="font-medium">R$ {item.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-3">
                  <div className="text-sm font-bold text-gray-900 text-right">Total: R$ {budget.total.toFixed(2)}</div>
                </div>

                {budget.paymentOptions?.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                    <div className="text-xs font-semibold text-gray-600 mb-1">Formas de pagamento</div>
                    {budget.paymentOptions.map((opt: any) => (
                      <div key={opt.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {PAYMENT_LABELS[opt.method] || opt.method}
                          {opt.installments ? ` (${opt.installments}x)` : ''}
                        </span>
                        <span className="font-medium">R$ {opt.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {budget.notes && (
                  <p className="text-xs text-gray-400 italic">{budget.notes}</p>
                )}
              </div>
            ))}
          </>
        )}

        {/* ── Documentos ── */}
        {tab === 'documentos' && (
          <>
            {patient?.records?.length === 0 && (
              <div className="bg-white rounded-xl p-6 text-center text-gray-400">Nenhum documento disponível.</div>
            )}
            {patient?.records?.map((record: any) => (
              <div key={record.id} className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-indigo-600 mb-1">
                      {RECORD_TYPE_LABELS[record.type] || record.type}
                    </div>
                    <div className="font-medium text-gray-900">{record.title}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {record.date
                        ? new Date(record.date).toLocaleDateString('pt-BR')
                        : new Date(record.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                    {record.content && (
                      <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{record.content}</p>
                    )}
                  </div>
                  {record.fileUrl && (
                    <a
                      href={`${API}/${record.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-3 flex-shrink-0 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-medium px-3 py-2 rounded-lg transition"
                    >
                      Baixar
                    </a>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </main>
    </div>
  )
}
