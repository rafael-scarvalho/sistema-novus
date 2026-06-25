import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { SURGERY_STATUS_COLORS, SURGERY_STATUS_LABELS, cn } from '../lib/utils'
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalIcon, ExternalLink, Stethoscope, Scissors } from 'lucide-react'

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

const STATUS_DOT: Record<string, string> = {
  AGENDADA: 'bg-blue-400',
  CHECKIN_REALIZADO: 'bg-purple-400',
  PREPARACAO_ANESTESICA: 'bg-yellow-400',
  EM_CIRURGIA: 'bg-red-500',
  RECUPERACAO: 'bg-orange-400',
  ALTA_CONCEDIDA: 'bg-green-500',
  CANCELADA: 'bg-gray-300',
}

export default function CalendarPage() {
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showNewSurgery, setShowNewSurgery] = useState(false)
  const [showNewConsult, setShowNewConsult] = useState(false)

  const { data: surgeries = [] } = useQuery({
    queryKey: ['surgeries-all'],
    queryFn: () => api.get('/surgeries').then(r => r.data),
  })

  const { data: returns = [] } = useQuery({
    queryKey: ['returns-all'],
    queryFn: () => api.get('/returns').then(r => r.data),
  })

  const { data: consultations = [] } = useQuery({
    queryKey: ['consultations-all'],
    queryFn: () => api.get('/consultations').then(r => r.data),
  })

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  function prevMonth() { setCurrentDate(new Date(year, month - 1, 1)) }
  function nextMonth() { setCurrentDate(new Date(year, month + 1, 1)) }

  function getSurgeriesForDay(day: number) {
    return surgeries.filter((s: any) => {
      const d = new Date(s.scheduledDate)
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
    })
  }

  function getReturnsForDay(day: number) {
    return returns.filter((r: any) => {
      const d = new Date(r.returnDate)
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
    })
  }

  function getConsultationsForDay(day: number) {
    return consultations.filter((c: any) => {
      const d = new Date(c.scheduledAt)
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
    })
  }

  const selectedDaySurgeries = selectedDay ? getSurgeriesForDay(selectedDay.getDate()) : []
  const selectedDayReturns = selectedDay ? getReturnsForDay(selectedDay.getDate()) : []
  const selectedDayConsultations = selectedDay ? getConsultationsForDay(selectedDay.getDate()) : []

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear()
  const isSelected = (d: number) =>
    !!(selectedDay && d === selectedDay.getDate() && month === selectedDay.getMonth() && year === selectedDay.getFullYear())

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Agenda</h1>
          <p className="text-sm text-gray-500">Cirurgias, consultas e retornos</p>
        </div>
        {/* Botão com menu dropdown */}
        <div className="relative">
          <button className="btn-primary" onClick={() => setShowMenu(m => !m)}>
            <Plus className="w-4 h-4" /> Novo Agendamento
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 w-48 overflow-hidden">
                <button
                  onClick={() => { setShowMenu(false); setShowNewSurgery(true) }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Scissors className="w-4 h-4 text-red-500" />
                  Nova Cirurgia
                </button>
                <button
                  onClick={() => { setShowMenu(false); setShowNewConsult(true) }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100"
                >
                  <Stethoscope className="w-4 h-4 text-indigo-500" />
                  Nova Consulta
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-4">
        {/* Calendário */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="btn-ghost p-2"><ChevronLeft className="w-4 h-4" /></button>
            <h2 className="font-bold text-gray-900">{MONTHS[month]} {year}</h2>
            <button onClick={nextMonth} className="btn-ghost p-2"><ChevronRight className="w-4 h-4" /></button>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />
              const daySurgeries = getSurgeriesForDay(day)
              const dayReturns = getReturnsForDay(day)
              const dayConsults = getConsultationsForDay(day)
              const hasEvents = daySurgeries.length > 0 || dayReturns.length > 0 || dayConsults.length > 0

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(new Date(year, month, day))}
                  className={cn(
                    'relative aspect-square flex flex-col items-center justify-start pt-1 rounded-lg text-sm transition-colors',
                    isToday(day) && 'ring-2 ring-brand-500',
                    isSelected(day) ? 'bg-brand-500 text-white' : hasEvents ? 'bg-brand-50 hover:bg-brand-100' : 'hover:bg-gray-50',
                  )}
                >
                  <span className={cn('text-xs font-medium leading-none', isSelected(day) ? 'text-white' : isToday(day) ? 'text-brand-600' : 'text-gray-700')}>
                    {day}
                  </span>
                  <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center px-0.5">
                    {daySurgeries.slice(0, 2).map((s: any) => (
                      <span key={s.id} className={cn('w-1.5 h-1.5 rounded-full', STATUS_DOT[s.status] || 'bg-blue-400')} />
                    ))}
                    {dayConsults.slice(0, 2).map((c: any) => (
                      <span key={c.id} className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    ))}
                    {dayReturns.slice(0, 1).map((r: any) => (
                      <span key={r.id} className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                    ))}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" />Cirurgia</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-400" />Consulta pré-op</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />Em cirurgia</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />Alta</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-400" />Retorno</span>
          </div>
        </div>

        {/* Painel lateral */}
        <div className="card p-4">
          {!selectedDay ? (
            <div className="text-center py-8">
              <CalIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Selecione um dia para ver os agendamentos</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">
                {selectedDay.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>

              {selectedDaySurgeries.length === 0 && selectedDayReturns.length === 0 && selectedDayConsultations.length === 0 && (
                <p className="text-sm text-gray-400">Nenhum agendamento neste dia</p>
              )}

              {/* Consultas */}
              {selectedDayConsultations.map((c: any) => (
                <Link key={c.id} to={`/pacientes/${c.patient?.id}?tab=consulta`}
                  className="block border border-indigo-100 bg-indigo-50 rounded-lg p-3 hover:shadow-sm transition-shadow">
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-indigo-600">CONSULTA PRÉ-OP{c.mode === 'ONLINE' ? ' · Online' : ''}</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{c.patient?.name}</p>
                      <p className="text-xs text-gray-500">{new Date(c.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-indigo-300 shrink-0 mt-0.5" />
                  </div>
                </Link>
              ))}

              {/* Cirurgias */}
              {selectedDaySurgeries.map((s: any) => (
                <Link key={s.id} to={`/cirurgias/${s.id}`}
                  className="block border border-gray-100 rounded-lg p-3 hover:shadow-sm transition-shadow">
                  <div className="flex items-start gap-2">
                    <span className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', STATUS_DOT[s.status])} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-400">CIRURGIA</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{s.patient.name}</p>
                      <p className="text-xs text-gray-500 truncate">Tutor: {s.patient.guardian.name}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(s.scheduledDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <span className={cn('badge mt-1', SURGERY_STATUS_COLORS[s.status])}>
                        {SURGERY_STATUS_LABELS[s.status]}
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-0.5" />
                  </div>
                </Link>
              ))}

              {/* Retornos */}
              {selectedDayReturns.map((r: any) => (
                <div key={r.id} className="border border-teal-100 bg-teal-50 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-teal-700">RETORNO</p>
                      <p className="text-sm font-medium text-gray-900">{r.surgery?.patient?.name}</p>
                      <p className="text-xs text-gray-500">{r.notes}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showNewSurgery && <NewSurgeryModal onClose={() => setShowNewSurgery(false)} />}
      {showNewConsult && <NewConsultModal onClose={() => setShowNewConsult(false)} />}
    </div>
  )
}

// ── Modal Nova Cirurgia ──────────────────────────────────────────────────────

function NewSurgeryModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [budgetId, setBudgetId] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')

  const { data: patients = [] } = useQuery({
    queryKey: ['patients-search', patientSearch],
    queryFn: () => patientSearch.length >= 2 ? api.get(`/patients?search=${patientSearch}`).then(r => r.data) : Promise.resolve([]),
    enabled: patientSearch.length >= 2,
  })

  const { data: patientBudgets = [] } = useQuery({
    queryKey: ['budgets-patient', selectedPatient?.id],
    queryFn: () => api.get(`/budgets?status=APROVADO&patientId=${selectedPatient.id}`).then(r => r.data),
    enabled: !!selectedPatient,
  })

  const create = useMutation({
    mutationFn: () => api.post('/surgeries/direct', { patientId: selectedPatient.id, budgetId, scheduledDate }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['surgeries-all'] }); onClose() },
  })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="card p-5 w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-red-500" />
            <h3 className="font-semibold text-gray-900">Agendar Cirurgia</h3>
          </div>
          <button className="btn-ghost p-1" onClick={onClose}><X className="w-4 h-4" /></button>
        </div>

        {!selectedPatient ? (
          <div className="relative">
            <label className="label">Paciente</label>
            <input className="input" placeholder="Digite o nome..." value={patientSearch}
              onChange={e => setPatientSearch(e.target.value)} />
            {patients.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 mt-1">
                {patients.map((p: any) => (
                  <button key={p.id} onClick={() => { setSelectedPatient(p); setPatientSearch('') }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.guardian.name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-2 bg-brand-50 rounded-lg flex items-center justify-between">
            <p className="text-sm font-medium">{selectedPatient.name}</p>
            <button onClick={() => setSelectedPatient(null)} className="text-xs text-gray-400 hover:text-red-500">Trocar</button>
          </div>
        )}

        {selectedPatient && (
          <div>
            <label className="label">Orçamento aprovado (opcional)</label>
            <select className="input" value={budgetId} onChange={e => setBudgetId(e.target.value)}>
              <option value="">Sem orçamento vinculado</option>
              {patientBudgets.map((b: any) => (
                <option key={b.id} value={b.id}>{b.code} — R$ {b.total.toFixed(2)}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="label">Data e hora *</label>
          <input className="input" type="datetime-local" value={scheduledDate}
            onChange={e => setScheduledDate(e.target.value)} />
        </div>

        <div className="flex gap-2">
          <button className="btn-outline flex-1" onClick={onClose}>Cancelar</button>
          <button className="btn-primary flex-1"
            disabled={!selectedPatient || !scheduledDate || create.isPending}
            onClick={() => create.mutate()}>
            {create.isPending ? 'Agendando...' : 'Agendar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal Nova Consulta Pré-Op ───────────────────────────────────────────────

function NewConsultModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [scheduledAt, setScheduledAt] = useState('')
  const [mode, setMode] = useState<'PRESENCIAL' | 'ONLINE'>('PRESENCIAL')

  const { data: patients = [] } = useQuery({
    queryKey: ['patients-search-consult', patientSearch],
    queryFn: () => patientSearch.length >= 2 ? api.get(`/patients?search=${patientSearch}`).then(r => r.data) : Promise.resolve([]),
    enabled: patientSearch.length >= 2,
  })

  const create = useMutation({
    mutationFn: () => api.post('/consultations', {
      patientId: selectedPatient.id,
      scheduledAt,
      mode,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consultations-all'] })
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="card p-5 w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-indigo-500" />
            <h3 className="font-semibold text-gray-900">Nova Consulta Pré-Op</h3>
          </div>
          <button className="btn-ghost p-1" onClick={onClose}><X className="w-4 h-4" /></button>
        </div>

        {!selectedPatient ? (
          <div className="relative">
            <label className="label">Paciente</label>
            <input className="input" placeholder="Digite o nome..." value={patientSearch}
              onChange={e => setPatientSearch(e.target.value)} />
            {patients.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 mt-1">
                {patients.map((p: any) => (
                  <button key={p.id} onClick={() => { setSelectedPatient(p); setPatientSearch('') }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.guardian.name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-2 bg-indigo-50 rounded-lg flex items-center justify-between">
            <p className="text-sm font-medium">{selectedPatient.name}</p>
            <button onClick={() => setSelectedPatient(null)} className="text-xs text-gray-400 hover:text-red-500">Trocar</button>
          </div>
        )}

        <div>
          <label className="label">Data e hora *</label>
          <input className="input" type="datetime-local" value={scheduledAt}
            onChange={e => setScheduledAt(e.target.value)} />
        </div>

        <div>
          <label className="label">Modalidade</label>
          <div className="grid grid-cols-2 gap-2">
            {(['PRESENCIAL', 'ONLINE'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={cn('border rounded-lg py-2 text-sm font-medium transition', mode === m ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50')}>
                {m === 'PRESENCIAL' ? '🏥 Presencial' : '📹 Online (Meet)'}
              </button>
            ))}
          </div>
          {mode === 'ONLINE' && (
            <p className="text-xs text-indigo-500 mt-1">O link do Google Meet será criado automaticamente.</p>
          )}
        </div>

        <div className="flex gap-2">
          <button className="btn-outline flex-1" onClick={onClose}>Cancelar</button>
          <button className="btn-primary flex-1"
            disabled={!selectedPatient || !scheduledAt || create.isPending}
            onClick={() => create.mutate()}>
            {create.isPending ? 'Agendando...' : 'Agendar'}
          </button>
        </div>
      </div>
    </div>
  )
}
