import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useRef } from 'react'
import { api } from '../lib/api'
import { Link } from 'react-router-dom'
import { Search, Plus, X, Users, ChevronRight, Camera, Loader2 } from 'lucide-react'
import { cn } from '../lib/utils'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const EMPTY_FORM = {
  // Tutor
  guardianName: '', guardianPhone: '', guardianWhatsapp: '',
  guardianEmail: '', guardianCpf: '', guardianBirthDate: '',
  guardianCep: '', guardianAddress: '',
  // Paciente
  name: '', species: 'CANINO', breed: '', sex: 'MACHO',
  birthDate: '', weight: '', microchip: '',
}

export default function PatientsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [credentials, setCredentials] = useState<{ username: string; password: string; guardianName: string } | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [cepLoading, setCepLoading] = useState(false)
  const [createdPatientId, setCreatedPatientId] = useState<string | null>(null)
  const photoRef = useRef<HTMLInputElement>(null)

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients', search],
    queryFn: () => api.get(`/patients${search ? `?search=${search}` : ''}`).then((r) => r.data),
  })

  const create = useMutation({
    mutationFn: async () => {
      const guardian = await api.post('/guardians', {
        name: form.guardianName,
        phone: form.guardianPhone,
        whatsapp: form.guardianWhatsapp || undefined,
        email: form.guardianEmail || undefined,
        cpf: form.guardianCpf || undefined,
        birthDate: form.guardianBirthDate ? new Date(form.guardianBirthDate).toISOString() : undefined,
        cep: form.guardianCep || undefined,
        address: form.guardianAddress || undefined,
      })
      const patient = await api.post('/patients', {
        name: form.name,
        species: form.species,
        breed: form.breed || undefined,
        sex: form.sex,
        birthDate: form.birthDate ? new Date(form.birthDate).toISOString() : undefined,
        weight: form.weight ? parseFloat(form.weight) : undefined,
        microchip: form.microchip || undefined,
        guardianId: guardian.data.id,
      })
      return { guardian: guardian.data, patient: patient.data }
    },
    onSuccess: async ({ guardian, patient }) => {
      // Upload da foto se selecionada
      if (photoFile && patient?.id) {
        const fd = new FormData()
        fd.append('photo', photoFile)
        const token = localStorage.getItem('token')
        await fetch(`${API_BASE}/api/patients/${patient.id}/photo`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        })
      }
      qc.invalidateQueries({ queryKey: ['patients'] })
      setShowNew(false)
      if (guardian.portalUsername && guardian.portalPasswordPlain) {
        setCredentials({
          username: guardian.portalUsername,
          password: guardian.portalPasswordPlain,
          guardianName: guardian.name,
        })
      }
      setForm({ ...EMPTY_FORM })
      setPhotoFile(null)
      setPhotoPreview('')
    },
  })

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function fetchCep(cep: string) {
    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8) return
    setCepLoading(true)
    try {
      const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await r.json()
      if (!data.erro) {
        setForm(prev => ({
          ...prev,
          guardianAddress: [data.logradouro, data.bairro, data.localidade, data.uf]
            .filter(Boolean).join(', '),
        }))
      }
    } catch { /* silently fail */ }
    finally { setCepLoading(false) }
  }

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: e.target.value })

  const maskCpf = (v: string) =>
    v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')

  const maskCep = (v: string) =>
    v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Pacientes</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Gerencie pacientes e responsáveis</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4" /> Novo Paciente
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
        <input className="input pl-9" placeholder="Buscar por nome do paciente ou tutor..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="space-y-2">
        {isLoading && <p className="text-center text-sm py-8" style={{ color: 'var(--color-text-secondary)' }}>Carregando...</p>}
        {!isLoading && patients.length === 0 && (
          <div className="card p-8 text-center">
            <Users className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--color-text-secondary)' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Nenhum paciente encontrado</p>
          </div>
        )}
        {patients.map((p: any) => (
          <Link key={p.id} to={`/pacientes/${p.id}`} className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 bg-purple-50 flex items-center justify-center">
              {p.photoUrl
                ? <img src={`${API_BASE}/${p.photoUrl}`} alt={p.name} className="w-full h-full object-cover" />
                : <span className="font-bold text-purple-600 text-lg">{p.name[0]}</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{p.name}</p>
              <p className="text-sm truncate" style={{ color: 'var(--color-text-secondary)' }}>
                {p.species}{p.breed ? ` · ${p.breed}` : ''} · {p.sex}
                {p.weight ? ` · ${p.weight}kg` : ''}
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Tutor: {p.guardian.name} · {p.guardian.phone}</p>
            </div>
            <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'var(--color-text-secondary)' }} />
          </Link>
        ))}
      </div>

      {/* Modal credenciais */}
      {credentials && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-sm space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 text-xl">🔐</span>
              </div>
              <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Acesso criado!</h3>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                Credenciais do portal para <strong>{credentials.guardianName}</strong>
              </p>
            </div>
            <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: 'var(--color-bg)' }}>
              <div>
                <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>Login</p>
                <p className="font-mono font-bold" style={{ color: 'var(--color-text-primary)' }}>{credentials.username}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>Senha</p>
                <p className="font-mono font-bold" style={{ color: 'var(--color-text-primary)' }}>{credentials.password}</p>
              </div>
            </div>
            <p className="text-xs text-center" style={{ color: 'var(--color-text-secondary)' }}>
              Anote ou envie por WhatsApp antes de fechar. A senha não será exibida novamente.
            </p>
            <div className="flex gap-2">
              <button className="btn-outline flex-1" onClick={() => {
                navigator.clipboard.writeText(`Login: ${credentials.username}\nSenha: ${credentials.password}`)
              }}>Copiar</button>
              <button className="btn-primary flex-1" onClick={() => setCredentials(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal novo paciente */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="card p-5 w-full max-w-lg max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Novo Paciente</h3>
              <button className="btn-ghost p-1" onClick={() => { setShowNew(false); setPhotoPreview(''); setPhotoFile(null) }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── SEÇÃO PACIENTE ── */}
            <div className="rounded-xl p-4 space-y-3 border" style={{ borderColor: 'var(--color-card-border)', backgroundColor: 'var(--color-bg)' }}>
              <p className="text-xs font-bold uppercase tracking-wide text-purple-600">🐾 Paciente (Animal)</p>

              {/* Foto do paciente */}
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => photoRef.current?.click()}
                  className={cn(
                    'w-20 h-20 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition hover:opacity-70 shrink-0 overflow-hidden',
                    photoPreview ? 'border-transparent' : 'border-gray-300'
                  )}>
                  {photoPreview
                    ? <img src={photoPreview} className="w-full h-full object-cover" />
                    : <>
                        <Camera className="w-6 h-6 text-gray-400 mb-1" />
                        <span className="text-[10px] text-gray-400 text-center leading-tight">Adicionar<br/>foto</span>
                      </>
                  }
                </button>
                <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                <div className="flex-1 space-y-2">
                  <div>
                    <label className="label">Nome do animal *</label>
                    <input className="input" value={form.name} onChange={f('name')} placeholder="Ex: Thor, Mel..." />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Espécie</label>
                  <select className="input" value={form.species} onChange={f('species')}>
                    <option value="CANINO">Canino</option>
                    <option value="FELINO">Felino</option>
                    <option value="EXOTICO">Exótico</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="label">Sexo</label>
                  <select className="input" value={form.sex} onChange={f('sex')}>
                    <option value="MACHO">Macho</option>
                    <option value="FEMEA">Fêmea</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Raça</label>
                  <input className="input" value={form.breed} onChange={f('breed')} />
                </div>
                <div>
                  <label className="label">Peso (kg)</label>
                  <input className="input" type="number" step="0.1" value={form.weight} onChange={f('weight')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Data de nascimento</label>
                  <input className="input" type="date" value={form.birthDate} onChange={f('birthDate')} />
                </div>
                <div>
                  <label className="label">Microchip</label>
                  <input className="input" value={form.microchip} onChange={f('microchip')} placeholder="Nº do chip" />
                </div>
              </div>
            </div>

            {/* ── SEÇÃO TUTOR ── */}
            <div className="rounded-xl p-4 space-y-3 border" style={{ borderColor: 'var(--color-card-border)', backgroundColor: 'var(--color-bg)' }}>
              <p className="text-xs font-bold uppercase tracking-wide text-blue-600">👤 Tutor / Responsável</p>

              <div>
                <label className="label">Nome completo *</label>
                <input className="input" value={form.guardianName} onChange={f('guardianName')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">CPF</label>
                  <input className="input" value={form.guardianCpf}
                    onChange={e => setForm({ ...form, guardianCpf: maskCpf(e.target.value) })}
                    maxLength={14} placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className="label">Data de nascimento</label>
                  <input className="input" type="date" value={form.guardianBirthDate} onChange={f('guardianBirthDate')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Telefone *</label>
                  <input className="input" type="tel" value={form.guardianPhone} onChange={f('guardianPhone')} />
                </div>
                <div>
                  <label className="label">WhatsApp</label>
                  <input className="input" type="tel" value={form.guardianWhatsapp} onChange={f('guardianWhatsapp')} />
                </div>
              </div>
              <div>
                <label className="label">E-mail</label>
                <input className="input" type="email" value={form.guardianEmail} onChange={f('guardianEmail')} />
              </div>

              {/* CEP com busca automática */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">CEP</label>
                  <div className="relative">
                    <input className="input pr-8" value={form.guardianCep}
                      onChange={e => {
                        const masked = maskCep(e.target.value)
                        setForm({ ...form, guardianCep: masked })
                        if (masked.replace(/\D/g, '').length === 8) fetchCep(masked)
                      }}
                      maxLength={9} placeholder="00000-000" />
                    {cepLoading && (
                      <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-gray-400" />
                    )}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="label">Endereço</label>
                  <input className="input" value={form.guardianAddress} onChange={f('guardianAddress')}
                    placeholder="Preenchido automaticamente pelo CEP" />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button className="btn-outline flex-1" onClick={() => { setShowNew(false); setPhotoPreview(''); setPhotoFile(null) }}>
                Cancelar
              </button>
              <button className="btn-primary flex-1"
                disabled={!form.guardianName || !form.guardianPhone || !form.name || create.isPending}
                onClick={() => create.mutate()}>
                {create.isPending ? 'Salvando...' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
