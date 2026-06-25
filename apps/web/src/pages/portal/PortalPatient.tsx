import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { usePortalAuth } from '../../contexts/PortalAuthContext'
import { useQueryClient } from '@tanstack/react-query'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const STATUS_LABELS: Record<string, string> = {
  AGENDADA: 'Agendada', CHECKIN_REALIZADO: 'Check-in realizado',
  PREPARACAO_ANESTESICA: 'Preparação anestésica', EM_CIRURGIA: 'Em cirurgia',
  RECUPERACAO: 'Em recuperação', INTERNACAO: 'Internação', ALTA_CONCEDIDA: 'Alta concedida', CANCELADA: 'Cancelada',
}
const STATUS_COLOR: Record<string, string> = {
  AGENDADA: 'bg-blue-100 text-blue-700', CHECKIN_REALIZADO: 'bg-yellow-100 text-yellow-700',
  PREPARACAO_ANESTESICA: 'bg-orange-100 text-orange-700', EM_CIRURGIA: 'bg-red-100 text-red-700',
  RECUPERACAO: 'bg-purple-100 text-purple-700', INTERNACAO: 'bg-pink-100 text-pink-700',
  ALTA_CONCEDIDA: 'bg-green-100 text-green-700', CANCELADA: 'bg-gray-100 text-gray-500',
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

                {/* Assinatura digital */}
                {budget.status === 'ENVIADO' && !budget.signedAt && (
                  <SignBudgetButton budgetId={budget.id} />
                )}
                {budget.signedAt && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-xl space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-green-800">
                      <span>✅</span>
                      <span>Assinado digitalmente</span>
                      {budget.signedGovLevel && (
                        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-200 text-green-800 capitalize">
                          Gov.br · {budget.signedGovLevel}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-green-700">
                      {new Date(budget.signedAt).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}
                      {budget.signedCpf && ` · CPF ${budget.signedCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}`}
                    </p>
                    {budget.signedDocHash && (
                      <p className="text-[10px] text-green-600 font-mono break-all opacity-60">
                        Hash: {budget.signedDocHash}
                      </p>
                    )}
                  </div>
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

function SignBudgetButton({ budgetId }: { budgetId: string }) {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const token = localStorage.getItem('portal_token')
  const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  // Verifica feedback da URL após retorno do Gov.br
  const searchParams = new URLSearchParams(window.location.search)
  const govbrResult = searchParams.get('govbr')
  const govbrError = searchParams.get('govbr_error')

  async function redirectToGovBr() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(
        `${API}/api/govbr/authorize?budgetId=${budgetId}&portalToken=${token}`
      )
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setLoading(false)
        return
      }
      // Redireciona o tutor para o Gov.br
      window.location.href = data.url
    } catch {
      setError('Erro ao conectar com o serviço Gov.br. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setShowModal(true)}
        className="w-full py-3 rounded-xl text-white text-sm font-semibold transition flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(135deg, #1351b4 0%, #071d41 100%)' }}>
        <img
          src="https://www.gov.br/++theme++padrao_govbr/img/govbr-logo-white.png"
          alt="Gov.br"
          className="h-4"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <span>Assinar com Gov.br</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
            {/* Header azul Gov.br */}
            <div className="px-6 py-5 text-white" style={{ background: 'linear-gradient(135deg, #1351b4 0%, #071d41 100%)' }}>
              <div className="text-xs font-medium opacity-80 mb-1">Assinatura eletrônica</div>
              <h3 className="font-bold text-lg leading-snug">Assinar com sua conta Gov.br</h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2 text-sm text-gray-600">
                <p>Você será redirecionado para o <strong className="text-gray-900">Gov.br</strong> para autenticar com CPF e senha.</p>
                <p>Após confirmar sua identidade, a assinatura será registrada automaticamente com:</p>
                <ul className="space-y-1 ml-4 list-disc text-xs">
                  <li>CPF verificado pelo Governo Federal</li>
                  <li>Nível de confiabilidade da conta</li>
                  <li>Hash criptográfico do documento</li>
                  <li>Data e hora exata da assinatura</li>
                </ul>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  ⚠️ {error === 'Integração Gov.br não configurada. Defina GOVBR_CLIENT_ID no .env'
                    ? 'Integração Gov.br ainda não configurada. Entre em contato com a clínica.'
                    : error}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => { setShowModal(false); setError('') }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                  Cancelar
                </button>
                <button onClick={redirectToGovBr} disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #1351b4 0%, #071d41 100%)' }}>
                  {loading ? 'Redirecionando...' : 'Continuar no Gov.br'}
                </button>
              </div>

              <p className="text-[11px] text-gray-400 text-center">
                Assinatura eletrônica avançada com validade jurídica conforme Lei 14.063/2020
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Feedback após retorno do Gov.br (via URL ?govbr=signed) */}
      {govbrResult === 'signed' && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 text-center">
          ✅ Orçamento assinado com sucesso via Gov.br!
        </div>
      )}
      {(govbrResult === 'already_signed') && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 text-center">
          ℹ️ Este orçamento já estava assinado.
        </div>
      )}
      {govbrError === 'cpf_mismatch' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-center">
          ⚠️ O CPF da conta Gov.br não corresponde ao CPF cadastrado. Entre em contato com a clínica.
        </div>
      )}
    </>
  )
}
