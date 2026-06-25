import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { io } from 'socket.io-client'
import {
  SURGERY_STATUS_LABELS, SURGERY_STATUS_COLORS, formatDate, formatDateTime, cn,
} from '../lib/utils'
import { CheckCircle2, Clock, Upload, CalendarCheck, MessageCircle } from 'lucide-react'

const STATUS_FLOW = [
  'AGENDADA',
  'CHECKIN_REALIZADO',
  'PREPARACAO_ANESTESICA',
  'EM_CIRURGIA',
  'RECUPERACAO',
  'INTERNACAO',
  'ALTA_CONCEDIDA',
]

export default function SurgeryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'status' | 'preop' | 'transop' | 'postop'>('status')
  const [liveMessage, setLiveMessage] = useState<string | null>(null)

  const { data: surgery, isLoading } = useQuery({
    queryKey: ['surgery', id],
    queryFn: () => api.get(`/surgeries/${id}`).then((r) => r.data),
  })

  // WebSocket para atualizações em tempo real
  useEffect(() => {
    if (!id) return
    const socket = io('/', { path: '/socket.io' })
    socket.emit('join:surgery', id)
    socket.on('surgery:status', (data: any) => {
      setLiveMessage(data.message)
      qc.invalidateQueries({ queryKey: ['surgery', id] })
      setTimeout(() => setLiveMessage(null), 5000)
    })
    return () => { socket.disconnect() }
  }, [id, qc])

  const updateStatus = useMutation({
    mutationFn: (status: string) => api.post(`/surgeries/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['surgery', id] }),
  })

  const [showReturnModal, setShowReturnModal] = useState(false)
  const [returnDate, setReturnDate] = useState('')
  const [returnNotes, setReturnNotes] = useState('')

  const scheduleReturn = useMutation({
    mutationFn: () => api.post(`/surgeries/${id}/return`, { returnDate, notes: returnNotes }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['surgery', id] }); setShowReturnModal(false) },
  })

  const savePreOp = useMutation({
    mutationFn: (data: any) => api.put(`/surgeries/${id}/pre-op`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['surgery', id] }),
  })

  const saveTransOp = useMutation({
    mutationFn: (data: any) => api.put(`/surgeries/${id}/trans-op`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['surgery', id] }),
  })

  const savePostOp = useMutation({
    mutationFn: (data: any) => api.put(`/surgeries/${id}/post-op`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['surgery', id] }),
  })

  if (isLoading) return <div className="text-center py-12 text-gray-400">Carregando...</div>
  if (!surgery) return <div className="text-center py-12 text-gray-400">Cirurgia não encontrada</div>

  const currentIdx = STATUS_FLOW.indexOf(surgery.status)

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Cabeçalho */}
      <div className="card p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{surgery.patient.name}</h1>
            <p className="text-sm text-gray-500">
              Tutor: {surgery.patient.guardian.name} · {surgery.patient.guardian.phone}
            </p>
            {surgery.partner && (
              <p className="text-sm text-gray-500">Parceiro: {surgery.partner.name}</p>
            )}
            <p className="text-sm text-gray-500">
              Data: {formatDate(surgery.scheduledDate)} às{' '}
              {new Date(surgery.scheduledDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <span className={cn('badge text-sm px-3 py-1', SURGERY_STATUS_COLORS[surgery.status])}>
            {SURGERY_STATUS_LABELS[surgery.status]}
          </span>
        </div>

        {/* Live notification */}
        {liveMessage && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 animate-pulse">
            ✅ {liveMessage}
          </div>
        )}
      </div>

      {/* Timeline de status */}
      <div className="card p-4">
        <h2 className="font-semibold text-gray-900 mb-4">Status da Cirurgia</h2>
        <div className="relative">
          {/* Linha de progresso */}
          <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-100" />

          <div className="space-y-3">
            {STATUS_FLOW.map((s, idx) => {
              const done = idx < currentIdx
              const active = idx === currentIdx
              const next = idx === currentIdx + 1

              return (
                <div key={s} className="flex items-center gap-3 relative">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10',
                    done ? 'bg-green-500' : active ? 'bg-brand-500' : 'bg-gray-100'
                  )}>
                    {done
                      ? <CheckCircle2 className="w-4 h-4 text-white" />
                      : active
                        ? <Clock className="w-4 h-4 text-white animate-pulse" />
                        : <div className="w-2 h-2 rounded-full bg-gray-300" />
                    }
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className={cn(
                      'text-sm',
                      done ? 'text-gray-500 line-through' : active ? 'font-semibold text-gray-900' : 'text-gray-400'
                    )}>
                      {SURGERY_STATUS_LABELS[s]}
                    </span>
                    {next && surgery.status !== 'CANCELADA' && (
                      <button
                        onClick={() => updateStatus.mutate(s)}
                        disabled={updateStatus.isPending}
                        className="btn-primary text-xs px-3 py-1"
                      >
                        Avançar
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Histórico de notificações */}
        {surgery.statusHistory.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">Histórico de Notificações</p>
            <div className="space-y-1">
              {surgery.statusHistory.map((h: any) => (
                <div key={h.id} className="flex items-center gap-2 text-xs text-gray-500">
                  <span className={h.notifiedWhatsapp ? 'text-green-500' : 'text-gray-300'}>●</span>
                  <span className="flex-1">{h.message}</span>
                  <span>{formatDateTime(h.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Botões de ação */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setShowReturnModal(true)}
          className="btn-outline text-teal-600 border-teal-200 hover:bg-teal-50"
        >
          <CalendarCheck className="w-4 h-4" />
          Agendar Retorno
        </button>
      </div>

      {/* Modal de retorno */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-5 w-full max-w-sm space-y-4">
            <h3 className="font-semibold text-gray-900">Agendar Retorno Pós-Cirúrgico</h3>
            <div>
              <label className="label">Data do retorno *</label>
              <input className="input" type="datetime-local" value={returnDate}
                onChange={e => setReturnDate(e.target.value)} />
            </div>
            <div>
              <label className="label">Observações</label>
              <textarea className="input resize-none" rows={3}
                placeholder="Ex: Retirada de pontos, avaliação pós-laparoscopia..."
                value={returnNotes} onChange={e => setReturnNotes(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button className="btn-outline flex-1" onClick={() => setShowReturnModal(false)}>Cancelar</button>
              <button className="btn-primary flex-1"
                disabled={!returnDate || scheduleReturn.isPending}
                onClick={() => scheduleReturn.mutate()}>
                {scheduleReturn.isPending ? 'Agendando...' : 'Agendar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Abas pré/trans/pós */}
      <div className="card overflow-hidden">
        <div className="flex border-b border-gray-100">
          {(['status', 'preop', 'transop', 'postop'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 py-3 text-sm font-medium transition-colors',
                tab === t ? 'text-brand-600 border-b-2 border-brand-500' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {t === 'status' ? 'Resumo' : t === 'preop' ? 'Pré-Op' : t === 'transop' ? 'Trans-Op' : 'Pós-Op'}
            </button>
          ))}
        </div>

        <div className="p-4">
          {tab === 'status' && (
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">Paciente:</span> {surgery.patient.name} ({surgery.patient.species})</p>
              <p><span className="text-gray-500">Peso:</span> {surgery.patient.weight ? `${surgery.patient.weight}kg` : '—'}</p>
              <p><span className="text-gray-500">Orçamento:</span> {surgery.budget?.code}</p>
            </div>
          )}

          {tab === 'preop' && (
            <PreOpForm surgery={surgery} onSave={(d) => savePreOp.mutate(d)} saving={savePreOp.isPending} />
          )}
          {tab === 'transop' && (
            <TransOpForm surgery={surgery} onSave={(d) => saveTransOp.mutate(d)} saving={saveTransOp.isPending} />
          )}
          {tab === 'postop' && (
            <PostOpForm surgery={surgery} onSave={(d) => savePostOp.mutate(d)} saving={savePostOp.isPending} surgeryId={id!} />
          )}
        </div>
      </div>
    </div>
  )
}

function PreOpForm({ surgery, onSave, saving }: any) {
  const [form, setForm] = useState({
    anamnesis: surgery.preOpAnamnesis || '',
    anestheticRisk: surgery.preOpAnestheticRisk || 'BAIXO',
    anestheticProtocol: surgery.preOpAnestheticProtocol || '',
    observations: surgery.preOpObservations || '',
  })

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Anamnese Cirúrgica</label>
        <textarea className="input min-h-[80px] resize-none" value={form.anamnesis}
          onChange={(e) => setForm({ ...form, anamnesis: e.target.value })} />
      </div>
      <div>
        <label className="label">Risco Anestésico</label>
        <select className="input" value={form.anestheticRisk}
          onChange={(e) => setForm({ ...form, anestheticRisk: e.target.value })}>
          <option value="BAIXO">Baixo</option>
          <option value="MODERADO">Moderado</option>
          <option value="ALTO">Alto</option>
        </select>
      </div>
      <div>
        <label className="label">Protocolo Anestésico</label>
        <textarea className="input min-h-[60px] resize-none" value={form.anestheticProtocol}
          onChange={(e) => setForm({ ...form, anestheticProtocol: e.target.value })} />
      </div>
      <div>
        <label className="label">Observações</label>
        <textarea className="input min-h-[60px] resize-none" value={form.observations}
          onChange={(e) => setForm({ ...form, observations: e.target.value })} />
      </div>
      <button className="btn-primary" onClick={() => onSave(form)} disabled={saving}>
        {saving ? 'Salvando...' : 'Salvar Pré-Op'}
      </button>
    </div>
  )
}

function TransOpForm({ surgery, onSave, saving }: any) {
  const [form, setForm] = useState({
    techniques: surgery.transOpTechniques || '',
    intercurrences: surgery.transOpIntercurrences || '',
    anesthesiaNotes: surgery.transOpAnesthesiaNotes || '',
  })

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Técnicas Utilizadas</label>
        <textarea className="input min-h-[80px] resize-none" value={form.techniques}
          onChange={(e) => setForm({ ...form, techniques: e.target.value })} />
      </div>
      <div>
        <label className="label">Intercorrências</label>
        <textarea className="input min-h-[60px] resize-none" value={form.intercurrences}
          onChange={(e) => setForm({ ...form, intercurrences: e.target.value })} />
      </div>
      <div>
        <label className="label">Notas Anestésicas</label>
        <textarea className="input min-h-[60px] resize-none" value={form.anesthesiaNotes}
          onChange={(e) => setForm({ ...form, anesthesiaNotes: e.target.value })} />
      </div>
      <button className="btn-primary" onClick={() => onSave(form)} disabled={saving}>
        {saving ? 'Salvando...' : 'Salvar Trans-Op'}
      </button>
    </div>
  )
}

function PostOpForm({ surgery, onSave, saving, surgeryId }: any) {
  const [form, setForm] = useState({
    recoveryNotes: surgery.postOpRecoveryNotes || '',
    prescriptions: surgery.postOpPrescriptions || '',
    dischargeSummary: surgery.postOpDischargeSummary || '',
  })
  const [uploading, setUploading] = useState(false)
  const qc = useQueryClient()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return
    setUploading(true)
    const fd = new FormData()
    Array.from(e.target.files).forEach((f) => fd.append('files', f))
    await api.post(`/surgeries/${surgeryId}/files?type=post-op`, fd)
    qc.invalidateQueries({ queryKey: ['surgery', surgeryId] })
    setUploading(false)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Evolução / Notas de Recuperação</label>
        <textarea className="input min-h-[80px] resize-none" value={form.recoveryNotes}
          onChange={(e) => setForm({ ...form, recoveryNotes: e.target.value })} />
      </div>
      <div>
        <label className="label">Prescrições</label>
        <textarea className="input min-h-[80px] resize-none" value={form.prescriptions}
          onChange={(e) => setForm({ ...form, prescriptions: e.target.value })} />
      </div>
      <div>
        <label className="label">Sumário de Alta</label>
        <textarea className="input min-h-[60px] resize-none" value={form.dischargeSummary}
          onChange={(e) => setForm({ ...form, dischargeSummary: e.target.value })} />
      </div>

      {/* Upload de laudos */}
      <div>
        <label className="label">Laudos e Exames (PDF, imagens)</label>
        <label className="flex items-center gap-2 cursor-pointer btn-outline w-fit">
          <Upload className="w-4 h-4" />
          {uploading ? 'Enviando...' : 'Anexar Arquivos'}
          <input type="file" multiple className="hidden" onChange={handleUpload} accept=".pdf,.jpg,.jpeg,.png" />
        </label>
        {surgery.postOpReportFiles?.length > 0 && (
          <div className="mt-2 space-y-1">
            {surgery.postOpReportFiles.map((f: string) => (
              <a key={f} href={`/uploads/${f}`} target="_blank" rel="noreferrer"
                className="block text-xs text-brand-600 hover:underline">
                📎 {f}
              </a>
            ))}
          </div>
        )}
      </div>

      <button className="btn-primary" onClick={() => onSave(form)} disabled={saving}>
        {saving ? 'Salvando...' : 'Salvar Pós-Op'}
      </button>
    </div>
  )
}
