import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../lib/api'
import { Link } from 'react-router-dom'
import { Search, Plus, X, Users, ChevronRight } from 'lucide-react'

export default function PatientsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [credentials, setCredentials] = useState<{ username: string; password: string; guardianName: string } | null>(null)
  const [form, setForm] = useState({
    guardianName: '', guardianPhone: '', guardianWhatsapp: '', guardianEmail: '',
    name: '', species: 'CANINO', breed: '', sex: 'MACHO', weight: '',
  })

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients', search],
    queryFn: () => api.get(`/patients${search ? `?search=${search}` : ''}`).then((r) => r.data),
  })

  const create = useMutation({
    mutationFn: async () => {
      const guardian = await api.post('/guardians', {
        name: form.guardianName, phone: form.guardianPhone,
        whatsapp: form.guardianWhatsapp, email: form.guardianEmail,
      })
      await api.post('/patients', {
        name: form.name, species: form.species, breed: form.breed,
        sex: form.sex, weight: form.weight ? parseFloat(form.weight) : undefined,
        guardianId: guardian.data.id,
      })
      return guardian.data
    },
    onSuccess: (guardian) => {
      qc.invalidateQueries({ queryKey: ['patients'] })
      setShowNew(false)
      if (guardian.portalUsername && guardian.portalPasswordPlain) {
        setCredentials({
          username: guardian.portalUsername,
          password: guardian.portalPasswordPlain,
          guardianName: guardian.name,
        })
      }
      setForm({ guardianName: '', guardianPhone: '', guardianWhatsapp: '', guardianEmail: '', name: '', species: 'CANINO', breed: '', sex: 'MACHO', weight: '' })
    },
  })

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: e.target.value })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-sm text-gray-500">Gerencie pacientes e responsáveis</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4" /> Novo Paciente
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="input pl-9" placeholder="Buscar por nome do paciente ou tutor..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="space-y-2">
        {isLoading && <p className="text-center text-sm text-gray-400 py-8">Carregando...</p>}
        {!isLoading && patients.length === 0 && (
          <div className="card p-8 text-center">
            <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Nenhum paciente encontrado</p>
          </div>
        )}
        {patients.map((p: any) => (
          <Link key={p.id} to={`/pacientes/${p.id}`} className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center font-bold text-purple-600 shrink-0">
              {p.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{p.name}</p>
              <p className="text-sm text-gray-500 truncate">
                {p.species}{p.breed ? ` · ${p.breed}` : ''} · {p.sex}
                {p.weight ? ` · ${p.weight}kg` : ''}
              </p>
              <p className="text-xs text-gray-400">Tutor: {p.guardian.name} · {p.guardian.phone}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
          </Link>
        ))}
      </div>

      {/* Modal de credenciais geradas */}
      {credentials && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-sm space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 text-xl">🔐</span>
              </div>
              <h3 className="font-bold text-gray-900">Acesso criado!</h3>
              <p className="text-sm text-gray-500 mt-1">
                Credenciais do portal para <strong>{credentials.guardianName}</strong>
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Login</p>
                <p className="font-mono font-bold text-gray-900">{credentials.username}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Senha</p>
                <p className="font-mono font-bold text-gray-900">{credentials.password}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center">
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

      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="card p-5 w-full max-w-md max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Novo Paciente</h3>
              <button className="btn-ghost p-1" onClick={() => setShowNew(false)}><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tutor / Responsável</p>
            {[
              { label: 'Nome completo *', field: 'guardianName', type: 'text' },
              { label: 'Telefone *', field: 'guardianPhone', type: 'tel' },
              { label: 'WhatsApp', field: 'guardianWhatsapp', type: 'tel' },
              { label: 'E-mail', field: 'guardianEmail', type: 'email' },
            ].map(({ label, field, type }) => (
              <div key={field}>
                <label className="label">{label}</label>
                <input className="input" type={type} value={(form as any)[field]} onChange={f(field)} />
              </div>
            ))}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-2">Paciente (Animal)</p>
            <div>
              <label className="label">Nome do animal *</label>
              <input className="input" value={form.name} onChange={f('name')} />
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
            <div className="flex gap-2">
              <button className="btn-outline flex-1" onClick={() => setShowNew(false)}>Cancelar</button>
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
