import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { api } from '../lib/api'
import { formatDate, formatCurrency, SURGERY_STATUS_COLORS, SURGERY_STATUS_LABELS, BUDGET_STATUS_COLORS, BUDGET_STATUS_LABELS, cn } from '../lib/utils'
import { Plus, Upload, Trash2, FileText, Pill, Stethoscope, FlaskConical, FolderOpen, Scale, ChevronRight, Video, MapPin, MessageCircle, CheckCircle2, X, ExternalLink, KeyRound, Receipt } from 'lucide-react'
import ServiceOrders from '../components/ServiceOrders'

type Tab = 'resumo' | 'consulta' | 'exames' | 'receituario' | 'relatorio' | 'laudos' | 'documentos' | 'peso' | 'conta'

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'resumo')
  const [portalCredentials, setPortalCredentials] = useState<{ username: string; password: string } | null>(null)
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false)
  const [whatsAppSent, setWhatsAppSent] = useState(false)

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => api.get(`/patients/${id}`).then(r => r.data),
  })

  const { data: records } = useQuery({
    queryKey: ['patient-records', id],
    queryFn: () => api.get(`/patients/${id}/records`).then(r => r.data),
  })

  if (isLoading) return <div className="text-center py-12 text-gray-400">Carregando...</div>
  if (!patient) return <div className="text-center py-12 text-gray-400">Paciente não encontrado</div>

  const TABS = [
    { id: 'resumo', label: 'Resumo', icon: FileText },
    { id: 'conta', label: 'Conta / OS', icon: Receipt },
    { id: 'consulta', label: 'Consulta Pré-Op', icon: Stethoscope },
    { id: 'exames', label: 'Req. Exames', icon: FlaskConical },
    { id: 'receituario', label: 'Receituário', icon: Pill },
    { id: 'relatorio', label: 'Rel. Cirurgia', icon: Stethoscope },
    { id: 'laudos', label: 'Laudos', icon: FileText },
    { id: 'documentos', label: 'Documentos', icon: FolderOpen },
    { id: 'peso', label: 'Peso', icon: Scale },
  ]

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Header */}
      <div className="card p-4">
        <div className="flex items-start gap-4">
          {/* Foto do paciente */}
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-purple-100 flex items-center justify-center text-2xl font-bold text-purple-600 shrink-0">
            {patient.photoUrl
              ? <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/${patient.photoUrl}`} alt={patient.name} className="w-full h-full object-cover" />
              : patient.name[0]
            }
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{patient.name}</h1>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {patient.species}{patient.breed ? ` · ${patient.breed}` : ''} · {patient.sex}
              {patient.weight ? ` · ${patient.weight}kg` : ''}
              {patient.birthDate ? ` · Nasc: ${formatDate(patient.birthDate)}` : ''}
              {patient.microchip ? ` · Chip: ${patient.microchip}` : ''}
            </p>
            <div className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              <span>Tutor: <span className="font-medium">{patient.guardian.name}</span></span>
              {patient.guardian.cpf && <span> · CPF: {patient.guardian.cpf}</span>}
              {patient.guardian.phone && <span> · {patient.guardian.phone}</span>}
            </div>
            {(patient.guardian.address || patient.guardian.cep) && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                📍 {[patient.guardian.cep, patient.guardian.address].filter(Boolean).join(' — ')}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${patient.guardian.portalUsername ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {patient.guardian.portalUsername ? `🔐 Portal ativo · ${patient.guardian.portalUsername}` : '⚠️ Sem acesso ao portal'}
              </span>
              <button
                onClick={async () => {
                  const res = await api.post(`/guardians/${patient.guardian.id}/reset-password`)
                  setPortalCredentials(res.data)
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 underline underline-offset-2"
              >
                <KeyRound className="w-3 h-3" />
                {patient.guardian.portalUsername ? 'Resetar senha' : 'Gerar acesso'}
              </button>
            </div>
          </div>
          <Link to={`/orcamentos/novo?paciente=${patient.id}`} className="btn-primary text-xs">
            <Plus className="w-3 h-3" /> Orçamento
          </Link>
        </div>
      </div>

      {/* Modal de credenciais do portal */}
      {portalCredentials && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-sm space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <KeyRound className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-bold text-gray-900">Acesso ao Portal</h3>
              <p className="text-sm text-gray-500 mt-1">
                Credenciais para <strong>{patient.guardian.name}</strong>
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Login</p>
                <p className="font-mono font-bold text-gray-900">{portalCredentials.username}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Nova Senha</p>
                <p className="font-mono font-bold text-gray-900">{portalCredentials.password}</p>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center">
              A senha não será exibida novamente após fechar.
            </p>

            {/* Enviar por WhatsApp */}
            <button
              disabled={sendingWhatsApp || whatsAppSent}
              onClick={async () => {
                setSendingWhatsApp(true)
                try {
                  await api.post(`/guardians/${patient.guardian.id}/send-portal-credentials`, portalCredentials)
                  setWhatsAppSent(true)
                } catch {
                  alert('Erro ao enviar. Verifique se o WhatsApp está configurado.')
                } finally {
                  setSendingWhatsApp(false)
                }
              }}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition ${
                whatsAppSent
                  ? 'bg-green-100 text-green-700 cursor-default'
                  : 'bg-green-500 hover:bg-green-600 text-white disabled:opacity-50'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              {whatsAppSent ? '✓ Enviado por WhatsApp!' : sendingWhatsApp ? 'Enviando...' : `Enviar para ${patient.guardian.whatsapp || patient.guardian.phone}`}
            </button>

            <div className="flex gap-2">
              <button className="btn-outline flex-1" onClick={() => {
                navigator.clipboard.writeText(`Login: ${portalCredentials.username}\nSenha: ${portalCredentials.password}`)
              }}>
                Copiar
              </button>
              <button className="btn-primary flex-1" onClick={() => {
                setPortalCredentials(null)
                setWhatsAppSent(false)
                qc.invalidateQueries({ queryKey: ['patient', id] })
              }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Abas */}
      <div className="card overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-100">
          {TABS.map(({ id: tid, label, icon: Icon }) => (
            <button key={tid} onClick={() => setTab(tid as Tab)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-3 text-xs font-medium whitespace-nowrap transition-colors shrink-0',
                tab === tid ? 'text-brand-600 border-b-2 border-brand-500 bg-brand-50/50' : 'text-gray-500 hover:text-gray-700'
              )}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {tab === 'resumo' && <ResumoTab patient={patient} />}
          {tab === 'conta' && <ServiceOrders patientId={id!} />}
          {tab === 'consulta' && <ConsultaPreOpTab patientId={id!} patient={patient} />}
          {tab === 'exames' && <ExamesTab patientId={id!} records={records} qc={qc} />}
          {tab === 'receituario' && <ReceituarioTab patientId={id!} records={records} qc={qc} />}
          {tab === 'relatorio' && <RelatorioTab patientId={id!} records={records} qc={qc} />}
          {tab === 'laudos' && <LaudosTab patientId={id!} records={records} qc={qc} />}
          {tab === 'documentos' && <DocumentosTab patientId={id!} records={records} qc={qc} />}
          {tab === 'peso' && <PesoTab patient={patient} patientId={id!} records={records} qc={qc} />}
        </div>
      </div>
    </div>
  )
}

function ResumoTab({ patient }: { patient: any }) {
  return (
    <div className="space-y-4">
      {/* Cirurgias */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Cirurgias</h3>
        {patient.surgeries?.length === 0
          ? <p className="text-sm text-gray-400">Nenhuma cirurgia registrada</p>
          : patient.surgeries?.map((s: any) => (
            <Link key={s.id} to={`/cirurgias/${s.id}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <span className={cn('badge', SURGERY_STATUS_COLORS[s.status])}>{SURGERY_STATUS_LABELS[s.status]}</span>
              </div>
              <p className="text-xs text-gray-500">{formatDate(s.scheduledDate)}</p>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </Link>
          ))
        }
      </div>

      {/* Orçamentos */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Orçamentos</h3>
        {patient.budgets?.length === 0
          ? <p className="text-sm text-gray-400">Nenhum orçamento</p>
          : patient.budgets?.map((b: any) => (
            <Link key={b.id} to={`/orcamentos/${b.id}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <p className="text-sm font-medium text-gray-900 flex-1">{b.code}</p>
              <span className={cn('badge', BUDGET_STATUS_COLORS[b.status])}>{BUDGET_STATUS_LABELS[b.status]}</span>
              <p className="text-sm font-bold text-gray-900">{formatCurrency(b.total)}</p>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </Link>
          ))
        }
      </div>
    </div>
  )
}

function ExamesTab({ patientId, records, qc }: any) {
  const [form, setForm] = useState({ title: '', content: '' })
  const save = useMutation({
    mutationFn: () => api.post(`/patients/${patientId}/records`, { type: 'EXAM_REQUEST', ...form }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patient-records', patientId] }); setForm({ title: '', content: '' }) },
  })

  const examRecords = records?.filter((r: any) => r.type === 'EXAM_REQUEST') || []

  return (
    <RecordTab
      title="Requisição de Exames"
      icon="🧪"
      records={examRecords}
      form={form}
      setForm={setForm}
      onSave={() => save.mutate()}
      saving={save.isPending}
      placeholder="Descreva os exames solicitados: hemograma, bioquímico, ultrassom..."
      patientId={patientId}
      recordType="EXAM_REQUEST"
      qc={qc}
    />
  )
}

function ReceituarioTab({ patientId, records, qc }: any) {
  const [form, setForm] = useState({ title: '', content: '' })
  const save = useMutation({
    mutationFn: () => api.post(`/patients/${patientId}/records`, { type: 'PRESCRIPTION', ...form }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patient-records', patientId] }); setForm({ title: '', content: '' }) },
  })

  const list = records?.filter((r: any) => r.type === 'PRESCRIPTION') || []

  return (
    <RecordTab
      title="Receituário"
      icon="💊"
      records={list}
      form={form}
      setForm={setForm}
      onSave={() => save.mutate()}
      saving={save.isPending}
      placeholder="Medicamentos prescritos, dosagens, frequência e duração do tratamento..."
      patientId={patientId}
      recordType="PRESCRIPTION"
      qc={qc}
    />
  )
}

function RelatorioTab({ patientId, records, qc }: any) {
  const [form, setForm] = useState({ title: '', content: '' })
  const save = useMutation({
    mutationFn: () => api.post(`/patients/${patientId}/records`, { type: 'SURGERY_REPORT', ...form }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patient-records', patientId] }); setForm({ title: '', content: '' }) },
  })

  const list = records?.filter((r: any) => r.type === 'SURGERY_REPORT') || []

  return (
    <RecordTab
      title="Relatório de Cirurgia"
      icon="🔪"
      records={list}
      form={form}
      setForm={setForm}
      onSave={() => save.mutate()}
      saving={save.isPending}
      placeholder="Descrição detalhada do procedimento cirúrgico, técnicas, achados..."
      patientId={patientId}
      recordType="SURGERY_REPORT"
      qc={qc}
    />
  )
}

function LaudosTab({ patientId, records, qc }: any) {
  const [uploading, setUploading] = useState(false)
  const list = records?.filter((r: any) => r.type === 'EXAM_REPORT') || []

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return
    setUploading(true)
    const fd = new FormData()
    Array.from(e.target.files).forEach(f => fd.append('files', f))
    await api.post(`/patients/${patientId}/records/files?type=EXAM_REPORT`, fd)
    qc.invalidateQueries({ queryKey: ['patient-records', patientId] })
    setUploading(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Laudos de Exames</h3>
        <label className="btn-outline cursor-pointer">
          <Upload className="w-4 h-4" />
          {uploading ? 'Enviando...' : 'Anexar Laudo'}
          <input type="file" multiple className="hidden" accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
      {list.length === 0
        ? <p className="text-sm text-gray-400 text-center py-6">Nenhum laudo anexado</p>
        : list.map((r: any) => (
          <div key={r.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg">
            <FileText className="w-5 h-5 text-blue-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
              <p className="text-xs text-gray-400">{formatDate(r.createdAt)}</p>
            </div>
            {r.fileUrl && (
              <a href={r.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:underline">
                Abrir
              </a>
            )}
          </div>
        ))
      }
    </div>
  )
}

function DocumentosTab({ patientId, records, qc }: any) {
  const [uploading, setUploading] = useState(false)
  const list = records?.filter((r: any) => r.type === 'DOCUMENT') || []

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return
    setUploading(true)
    const fd = new FormData()
    Array.from(e.target.files).forEach(f => fd.append('files', f))
    await api.post(`/patients/${patientId}/records/files?type=DOCUMENT`, fd)
    qc.invalidateQueries({ queryKey: ['patient-records', patientId] })
    setUploading(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Documentos</h3>
        <label className="btn-outline cursor-pointer">
          <Upload className="w-4 h-4" />
          {uploading ? 'Enviando...' : 'Anexar Documento'}
          <input type="file" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
      {list.length === 0
        ? <p className="text-sm text-gray-400 text-center py-6">Nenhum documento</p>
        : list.map((r: any) => (
          <div key={r.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg">
            <FolderOpen className="w-5 h-5 text-orange-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
              <p className="text-xs text-gray-400">{formatDate(r.createdAt)}</p>
            </div>
            {r.fileUrl && (
              <a href={r.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:underline">
                Abrir
              </a>
            )}
          </div>
        ))
      }
    </div>
  )
}

function PesoTab({ patient, patientId, records, qc }: any) {
  const [newWeight, setNewWeight] = useState('')
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0])
  const list = records?.filter((r: any) => r.type === 'WEIGHT').sort(
    (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  ) || []

  const save = useMutation({
    mutationFn: () => api.post(`/patients/${patientId}/records`, {
      type: 'WEIGHT', title: `${newWeight}kg`, content: newWeight, date: newDate,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patient-records', patientId] }); setNewWeight('') },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Evolução do Peso</h3>
        <p className="text-xs text-gray-400">
          Peso atual: <span className="font-bold text-gray-700">{patient.weight ? `${patient.weight}kg` : '—'}</span>
        </p>
      </div>

      {/* Gráfico simples */}
      {list.length > 1 && (
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-end gap-1 h-20">
            {list.map((r: any, i: number) => {
              const w = parseFloat(r.content)
              const max = Math.max(...list.map((x: any) => parseFloat(x.content)))
              const pct = (w / max) * 100
              return (
                <div key={r.id} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-gray-500">{w}kg</span>
                  <div className="w-full bg-brand-400 rounded-t" style={{ height: `${pct * 0.6}px` }} />
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-[9px] text-gray-400 mt-1">
            <span>{formatDate(list[0]?.createdAt)}</span>
            <span>{formatDate(list[list.length - 1]?.createdAt)}</span>
          </div>
        </div>
      )}

      {/* Registros */}
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {list.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Nenhum registro de peso</p>}
        {[...list].reverse().map((r: any) => (
          <div key={r.id} className="flex items-center justify-between p-2 border-b border-gray-50">
            <p className="text-sm font-bold text-gray-900">{r.content} kg</p>
            <p className="text-xs text-gray-400">{formatDate(r.date || r.createdAt)}</p>
          </div>
        ))}
      </div>

      {/* Novo peso */}
      <div className="flex gap-2">
        <input className="input w-28" type="number" step="0.1" placeholder="Ex: 8.5"
          value={newWeight} onChange={e => setNewWeight(e.target.value)} />
        <span className="flex items-center text-sm text-gray-500">kg</span>
        <input className="input flex-1" type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
        <button className="btn-primary" disabled={!newWeight || save.isPending} onClick={() => save.mutate()}>
          Registrar
        </button>
      </div>
    </div>
  )
}

// Jornada do paciente — exibida no topo da aba
const WORKFLOW_STEPS = [
  { key: 'CONSULTA', label: 'Consulta', emoji: '🩺' },
  { key: 'EXAMES_PRE_OP', label: 'Exames Pré-Op', emoji: '🔬' },
  { key: 'CIRURGIA_AGENDADA', label: 'Cirurgia Agendada', emoji: '📅' },
  { key: 'EXAMES_POS_OP', label: 'Exames Pós-Op', emoji: '💊' },
  { key: 'FINALIZADO', label: 'Finalizado', emoji: '✅' },
]

const WORKFLOW_COLORS: Record<string, string> = {
  CONSULTA: 'bg-indigo-500',
  EXAMES_PRE_OP: 'bg-yellow-500',
  CIRURGIA_AGENDADA: 'bg-blue-500',
  EXAMES_POS_OP: 'bg-orange-500',
  FINALIZADO: 'bg-green-500',
}

function WorkflowStepper({ current, consultationId, onUpdate }: {
  current: string
  consultationId: string
  onUpdate: () => void
}) {
  const qc = useQueryClient()
  const currentIndex = WORKFLOW_STEPS.findIndex(s => s.key === current)

  const updateWorkflow = useMutation({
    mutationFn: (workflowStatus: string) =>
      api.patch(`/consultations/${consultationId}/workflow`, { workflowStatus }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['consultations'] }); onUpdate() },
  })

  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Jornada do Paciente</p>
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full text-white', WORKFLOW_COLORS[current] || 'bg-gray-400')}>
          {WORKFLOW_STEPS.find(s => s.key === current)?.emoji} {WORKFLOW_STEPS.find(s => s.key === current)?.label}
        </span>
      </div>

      {/* Barra de progresso */}
      <div className="flex items-center gap-1">
        {WORKFLOW_STEPS.map((step, i) => {
          const isActive = i === currentIndex
          const isDone = i < currentIndex
          return (
            <div key={step.key} className="flex items-center flex-1 min-w-0">
              <button
                title={`Avançar para: ${step.label}`}
                onClick={() => updateWorkflow.mutate(step.key)}
                disabled={updateWorkflow.isPending}
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all border-2',
                  isDone ? 'bg-green-500 border-green-500 text-white' :
                  isActive ? `${WORKFLOW_COLORS[step.key]} border-current text-white scale-110 shadow-md` :
                  'bg-white border-gray-300 text-gray-400 hover:border-gray-400'
                )}
              >
                {isDone ? '✓' : step.emoji}
              </button>
              {i < WORKFLOW_STEPS.length - 1 && (
                <div className={cn('h-1 flex-1 mx-1 rounded-full transition-all', i < currentIndex ? 'bg-green-400' : 'bg-gray-200')} />
              )}
            </div>
          )
        })}
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs text-gray-400 px-0.5">
        {WORKFLOW_STEPS.map((step) => (
          <span key={step.key} className="text-center leading-tight" style={{ width: `${100 / WORKFLOW_STEPS.length}%` }}>
            {step.label}
          </span>
        ))}
      </div>

      {/* Botões de avanço rápido */}
      <div className="flex gap-2 pt-1">
        {currentIndex > 0 && (
          <button
            onClick={() => updateWorkflow.mutate(WORKFLOW_STEPS[currentIndex - 1].key)}
            disabled={updateWorkflow.isPending}
            className="btn-ghost text-xs px-2 py-1 text-gray-500 border border-gray-200"
          >
            ← Voltar
          </button>
        )}
        {currentIndex < WORKFLOW_STEPS.length - 1 && (
          <button
            onClick={() => updateWorkflow.mutate(WORKFLOW_STEPS[currentIndex + 1].key)}
            disabled={updateWorkflow.isPending}
            className="btn-primary text-xs px-3 py-1 ml-auto"
          >
            Avançar para {WORKFLOW_STEPS[currentIndex + 1].emoji} {WORKFLOW_STEPS[currentIndex + 1].label} →
          </button>
        )}
      </div>
    </div>
  )
}

function ConsultaPreOpTab({ patientId, patient }: { patientId: string; patient: any }) {
  const qc = useQueryClient()
  const [showNew, setShowNew] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({
    scheduledAt: '', mode: 'PRESENCIAL',
    anamnesis: '', physicalExam: '', anestheticRisk: 'BAIXO',
    preOpExams: '', anestheticProtocol: '', surgicalPlan: '', observations: '',
  })

  const { data: consultations = [], isLoading } = useQuery({
    queryKey: ['consultations', patientId],
    queryFn: () => api.get(`/consultations?patientId=${patientId}`).then(r => r.data),
  })

  const create = useMutation({
    mutationFn: () => api.post('/consultations', { ...form, patientId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['consultations', patientId] }); setShowNew(false); resetForm() },
  })

  const update = useMutation({
    mutationFn: () => api.put(`/consultations/${editId}`, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['consultations', patientId] }); setEditId(null); resetForm() },
  })

  const complete = useMutation({
    mutationFn: (id: string) => api.patch(`/consultations/${id}/complete`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consultations', patientId] }),
  })

  const cancel = useMutation({
    mutationFn: (id: string) => api.patch(`/consultations/${id}/cancel`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consultations', patientId] }),
  })

  const sendMeet = useMutation({
    mutationFn: (id: string) => api.post(`/consultations/${id}/send-meet`, {}),
  })

  function resetForm() {
    setForm({ scheduledAt: '', mode: 'PRESENCIAL', anamnesis: '', physicalExam: '', anestheticRisk: 'BAIXO', preOpExams: '', anestheticProtocol: '', surgicalPlan: '', observations: '' })
  }

  function openEdit(c: any) {
    setEditId(c.id)
    setForm({
      scheduledAt: new Date(c.scheduledAt).toISOString().slice(0, 16),
      mode: c.mode,
      anamnesis: c.anamnesis || '',
      physicalExam: c.physicalExam || '',
      anestheticRisk: c.anestheticRisk || 'BAIXO',
      preOpExams: c.preOpExams || '',
      anestheticProtocol: c.anestheticProtocol || '',
      surgicalPlan: c.surgicalPlan || '',
      observations: c.observations || '',
    })
  }

  const STATUS_COLORS: Record<string, string> = {
    AGENDADA: 'bg-blue-100 text-blue-700',
    REALIZADA: 'bg-green-100 text-green-700',
    CANCELADA: 'bg-gray-100 text-gray-500',
  }
  const STATUS_LABELS: Record<string, string> = {
    AGENDADA: 'Agendada', REALIZADA: 'Realizada', CANCELADA: 'Cancelada',
  }

  const RISK_COLORS: Record<string, string> = {
    BAIXO: 'text-green-600', MODERADO: 'text-yellow-600', ALTO: 'text-red-600',
  }

  const showForm = showNew || editId !== null

  // A consulta mais recente não cancelada define a jornada do paciente
  const activeConsultation = consultations.find((c: any) => c.status !== 'CANCELADA')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">🩺 Consulta Pré-Operatória</h3>
        <button onClick={() => { setShowNew(true); setEditId(null); resetForm() }} className="btn-primary text-xs px-3 py-1.5">
          <Plus className="w-3 h-3" /> Nova Consulta
        </button>
      </div>

      {/* Status de Jornada — exibido sempre que há uma consulta ativa */}
      {activeConsultation && (
        <WorkflowStepper
          current={activeConsultation.workflowStatus || 'CONSULTA'}
          consultationId={activeConsultation.id}
          onUpdate={() => qc.invalidateQueries({ queryKey: ['consultations', patientId] })}
        />
      )}

      {/* Formulário */}
      {showForm && (
        <div className="border border-brand-200 bg-brand-50 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-900 text-sm">
              {editId ? 'Editar Consulta' : 'Agendar Consulta'}
            </p>
            <button onClick={() => { setShowNew(false); setEditId(null) }} className="btn-ghost p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modalidade */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'PRESENCIAL', label: 'Presencial', icon: MapPin },
              { value: 'ONLINE', label: 'Online (Google Meet)', icon: Video },
            ].map(({ value, label, icon: Icon }) => (
              <button key={value} onClick={() => setForm(f => ({ ...f, mode: value }))}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-lg border-2 transition-colors text-sm font-medium',
                  form.mode === value
                    ? value === 'ONLINE' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                )}>
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            ))}
          </div>

          {form.mode === 'ONLINE' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 flex items-start gap-2">
              <Video className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Um link do Google Meet será gerado automaticamente e enviado por WhatsApp para <strong>{patient.guardian.name}</strong>.</span>
            </div>
          )}

          <div>
            <label className="label">Data e hora da consulta *</label>
            <input className="input bg-white" type="datetime-local"
              value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
          </div>

          {/* Dados clínicos */}
          <div className="border-t border-brand-200 pt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Dados Clínicos (pode preencher depois)</p>
            <div className="space-y-3">
              <div>
                <label className="label">Anamnese</label>
                <textarea className="input bg-white resize-none" rows={3}
                  placeholder="Histórico clínico, queixas, medicações em uso..."
                  value={form.anamnesis} onChange={e => setForm(f => ({ ...f, anamnesis: e.target.value }))} />
              </div>
              <div>
                <label className="label">Exame Físico</label>
                <textarea className="input bg-white resize-none" rows={3}
                  placeholder="Achados do exame físico, parâmetros vitais..."
                  value={form.physicalExam} onChange={e => setForm(f => ({ ...f, physicalExam: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Risco Anestésico</label>
                  <select className="input bg-white" value={form.anestheticRisk}
                    onChange={e => setForm(f => ({ ...f, anestheticRisk: e.target.value }))}>
                    <option value="BAIXO">Baixo</option>
                    <option value="MODERADO">Moderado</option>
                    <option value="ALTO">Alto</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Exames Pré-Op Solicitados</label>
                <textarea className="input bg-white resize-none" rows={2}
                  placeholder="Hemograma, bioquímico, ECG, ultrassom..."
                  value={form.preOpExams} onChange={e => setForm(f => ({ ...f, preOpExams: e.target.value }))} />
              </div>
              <div>
                <label className="label">Protocolo Anestésico Proposto</label>
                <textarea className="input bg-white resize-none" rows={2}
                  placeholder="MPA, indução, manutenção..."
                  value={form.anestheticProtocol} onChange={e => setForm(f => ({ ...f, anestheticProtocol: e.target.value }))} />
              </div>
              <div>
                <label className="label">Plano Cirúrgico</label>
                <textarea className="input bg-white resize-none" rows={2}
                  placeholder="Procedimento proposto, técnica, material necessário..."
                  value={form.surgicalPlan} onChange={e => setForm(f => ({ ...f, surgicalPlan: e.target.value }))} />
              </div>
              <div>
                <label className="label">Observações</label>
                <textarea className="input bg-white resize-none" rows={2}
                  value={form.observations} onChange={e => setForm(f => ({ ...f, observations: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="btn-outline flex-1" onClick={() => { setShowNew(false); setEditId(null) }}>Cancelar</button>
            <button
              className="btn-primary flex-1"
              disabled={!form.scheduledAt || create.isPending || update.isPending}
              onClick={() => editId ? update.mutate() : create.mutate()}
            >
              {create.isPending || update.isPending
                ? (form.mode === 'ONLINE' ? 'Gerando Meet...' : 'Salvando...')
                : editId ? 'Salvar' : form.mode === 'ONLINE' ? '📹 Agendar + Gerar Meet' : 'Agendar'}
            </button>
          </div>
        </div>
      )}

      {/* Lista de consultas */}
      {isLoading && <p className="text-sm text-gray-400 text-center py-4">Carregando...</p>}
      {!isLoading && consultations.length === 0 && !showForm && (
        <p className="text-sm text-gray-400 text-center py-6">Nenhuma consulta pré-operatória registrada</p>
      )}

      {consultations.map((c: any) => (
        <div key={c.id} className="border border-gray-100 rounded-xl p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('badge', STATUS_COLORS[c.status])}>{STATUS_LABELS[c.status]}</span>
                <span className={cn('badge', c.mode === 'ONLINE' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600')}>
                  {c.mode === 'ONLINE' ? '📹 Online' : '🏥 Presencial'}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {new Date(c.scheduledAt).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                {' às '}
                {new Date(c.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {/* Ações */}
            <div className="flex gap-1 flex-wrap">
              {c.googleMeetLink && (
                <>
                  <a href={c.googleMeetLink} target="_blank" rel="noreferrer"
                    className="btn-outline text-blue-600 border-blue-200 hover:bg-blue-50 text-xs px-2 py-1">
                    <Video className="w-3.5 h-3.5" /> Entrar
                  </a>
                  <button onClick={() => sendMeet.mutate(c.id)}
                    className="btn-ghost text-green-600 p-1.5" title="Reenviar link por WhatsApp">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </>
              )}
              {c.status === 'AGENDADA' && (
                <>
                  <button onClick={() => openEdit(c)} className="btn-ghost p-1.5 text-gray-500" title="Editar">
                    ✏️
                  </button>
                  <button onClick={() => complete.mutate(c.id)} className="btn-ghost p-1.5 text-green-600" title="Marcar realizada">
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => cancel.mutate(c.id)} className="btn-ghost p-1.5 text-red-400" title="Cancelar">
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Link do Meet */}
          {c.googleMeetLink && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-2 flex items-center gap-2">
              <Video className="w-4 h-4 text-blue-500 shrink-0" />
              <a href={c.googleMeetLink} target="_blank" rel="noreferrer"
                className="text-xs text-blue-600 hover:underline truncate flex-1">
                {c.googleMeetLink}
              </a>
              <ExternalLink className="w-3 h-3 text-blue-400 shrink-0" />
            </div>
          )}

          {/* Dados clínicos */}
          {(c.anamnesis || c.physicalExam || c.anestheticRisk || c.preOpExams || c.surgicalPlan) && (
            <details className="mt-2">
              <summary className="text-xs font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700">
                Ver dados clínicos
              </summary>
              <div className="mt-3 space-y-2 text-sm">
                {c.anestheticRisk && (
                  <p>
                    <span className="text-gray-500 text-xs">Risco anestésico:</span>{' '}
                    <span className={cn('font-semibold', RISK_COLORS[c.anestheticRisk])}>{c.anestheticRisk}</span>
                  </p>
                )}
                {c.anamnesis && (
                  <div><p className="text-xs text-gray-400 mb-0.5">Anamnese</p><p className="text-gray-700 whitespace-pre-line">{c.anamnesis}</p></div>
                )}
                {c.physicalExam && (
                  <div><p className="text-xs text-gray-400 mb-0.5">Exame Físico</p><p className="text-gray-700 whitespace-pre-line">{c.physicalExam}</p></div>
                )}
                {c.preOpExams && (
                  <div><p className="text-xs text-gray-400 mb-0.5">Exames Solicitados</p><p className="text-gray-700 whitespace-pre-line">{c.preOpExams}</p></div>
                )}
                {c.anestheticProtocol && (
                  <div><p className="text-xs text-gray-400 mb-0.5">Protocolo Anestésico</p><p className="text-gray-700 whitespace-pre-line">{c.anestheticProtocol}</p></div>
                )}
                {c.surgicalPlan && (
                  <div><p className="text-xs text-gray-400 mb-0.5">Plano Cirúrgico</p><p className="text-gray-700 whitespace-pre-line">{c.surgicalPlan}</p></div>
                )}
                {c.observations && (
                  <div><p className="text-xs text-gray-400 mb-0.5">Observações</p><p className="text-gray-700 whitespace-pre-line">{c.observations}</p></div>
                )}
              </div>
            </details>
          )}
        </div>
      ))}
    </div>
  )
}

function RecordTab({ title, icon, records, form, setForm, onSave, saving, placeholder, patientId, recordType, qc }: any) {
  const [showForm, setShowForm] = useState(false)
  const remove = useMutation({
    mutationFn: (recordId: string) => api.delete(`/patients/${patientId}/records/${recordId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patient-records', patientId] }),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{icon} {title}</h3>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary text-xs px-3 py-1.5">
          <Plus className="w-3 h-3" /> Novo
        </button>
      </div>

      {showForm && (
        <div className="border border-brand-200 bg-brand-50 rounded-lg p-3 space-y-2">
          <input className="input bg-white" placeholder="Título (ex: Pré-cirúrgico 15/06)"
            value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <textarea className="input bg-white resize-none" rows={4} placeholder={placeholder}
            value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
          <div className="flex gap-2">
            <button className="btn-outline text-xs flex-1" onClick={() => setShowForm(false)}>Cancelar</button>
            <button className="btn-primary text-xs flex-1" disabled={!form.title || !form.content || saving}
              onClick={() => { onSave(); setShowForm(false) }}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {records.length === 0 && !showForm
        ? <p className="text-sm text-gray-400 text-center py-6">Nenhum registro ainda</p>
        : records.map((r: any) => (
          <div key={r.id} className="border border-gray-100 rounded-lg p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{r.title}</p>
                <p className="text-xs text-gray-400 mb-2">{formatDate(r.createdAt)}</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{r.content}</p>
              </div>
              <button onClick={() => remove.mutate(r.id)} className="btn-ghost p-1 text-red-400 hover:text-red-600 shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))
      }
    </div>
  )
}
