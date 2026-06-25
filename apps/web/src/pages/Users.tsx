import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/utils'
import { Plus, Pencil, UserCheck, UserX, X, Percent, Phone, Stethoscope } from 'lucide-react'

const ROLES: Record<string, string> = {
  ADMIN: 'Administrador',
  SURGEON: 'Cirurgião',
  ASSISTANT: 'Assistente',
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  SURGEON: 'bg-blue-100 text-blue-700',
  ASSISTANT: 'bg-gray-100 text-gray-600',
}

const EMPTY = {
  name: '', email: '', password: '', role: 'ASSISTANT',
  phone: '', specialty: '', commissionRate: 0, active: true,
}

export default function UsersPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null)
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY })

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data),
  })

  const save = useMutation({
    mutationFn: (data: typeof EMPTY) =>
      editing
        ? api.put(`/users/${(editing as { id: string }).id}`, data).then(r => r.data)
        : api.post('/users', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); closeModal() },
  })

  const toggleActive = useMutation({
    mutationFn: (user: { id: string; active: boolean; name: string; email: string; role: string; commissionRate: number }) =>
      api.put(`/users/${user.id}`, { ...user, active: !user.active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  function openNew() {
    setEditing(null)
    setForm({ ...EMPTY })
    setModal(true)
  }

  function openEdit(u: Record<string, unknown>) {
    setEditing(u)
    setForm({
      name: u.name as string,
      email: u.email as string,
      password: '',
      role: u.role as string,
      phone: (u.phone as string) || '',
      specialty: (u.specialty as string) || '',
      commissionRate: (u.commissionRate as number) || 0,
      active: u.active as boolean,
    })
    setModal(true)
  }

  function closeModal() { setModal(false); setEditing(null) }

  function f(k: keyof typeof EMPTY, v: unknown) {
    setForm(p => ({ ...p, [k]: v }))
  }

  const totalCommission = (users as Array<{ commissionRate: number; active: boolean }>)
    .filter(u => u.active)
    .reduce((s: number, u: { commissionRate: number }) => s + u.commissionRate, 0)

  if (isLoading) return <div className="text-center py-12 text-gray-400">Carregando...</div>

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Usuários / Veterinários</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {(users as Array<{ active: boolean }>).filter(u => u.active).length} ativos · comissões configuradas em {(users as Array<{ commissionRate: number }>).filter(u => u.commissionRate > 0).length} usuários
          </p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo Usuário
        </button>
      </div>

      {/* Cards */}
      <div className="grid gap-3">
        {(users as Array<Record<string, unknown>>).map(u => (
          <div key={u.id as string} className={`card p-4 flex items-center gap-4 ${!u.active ? 'opacity-50' : ''}`}>
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {(u.name as string)[0]}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{u.name as string}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role as string] || 'bg-gray-100 text-gray-600'}`}>
                  {ROLES[u.role as string] || u.role as string}
                </span>
                {!u.active && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inativo</span>}
              </div>
              <div className="text-sm flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                <span>{u.email as string}</span>
                {u.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{u.phone as string}</span>}
                {u.specialty && <span className="flex items-center gap-1"><Stethoscope className="w-3 h-3" />{u.specialty as string}</span>}
              </div>
            </div>

            {/* Comissão */}
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1 justify-end font-bold text-green-600">
                <Percent className="w-3.5 h-3.5" />
                <span>{u.commissionRate as number}%</span>
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>comissão</div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => openEdit(u)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Editar">
                <Pencil className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
              </button>
              <button
                onClick={() => toggleActive.mutate(u as { id: string; active: boolean; name: string; email: string; role: string; commissionRate: number })}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title={u.active ? 'Desativar' : 'Ativar'}
              >
                {u.active
                  ? <UserX className="w-4 h-4 text-red-400" />
                  : <UserCheck className="w-4 h-4 text-green-500" />
                }
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {editing ? 'Editar Usuário' : 'Novo Usuário'}
              </h2>
              <button onClick={closeModal}><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Nome completo *</label>
                <input className="input" value={form.name} onChange={e => f('name', e.target.value)} placeholder="Dr. João Silva" />
              </div>
              <div className="col-span-2">
                <label className="label">E-mail *</label>
                <input className="input" type="email" value={form.email} onChange={e => f('email', e.target.value)} placeholder="joao@clinica.com" />
              </div>
              <div className="col-span-2">
                <label className="label">{editing ? 'Nova senha (deixe em branco para manter)' : 'Senha *'}</label>
                <input className="input" type="password" value={form.password} onChange={e => f('password', e.target.value)} placeholder="••••••••" />
              </div>
              <div>
                <label className="label">Perfil</label>
                <select className="input" value={form.role} onChange={e => f('role', e.target.value)}>
                  <option value="ADMIN">Administrador</option>
                  <option value="SURGEON">Cirurgião</option>
                  <option value="ASSISTANT">Assistente</option>
                </select>
              </div>
              <div>
                <label className="label">Comissão (%)</label>
                <input
                  className="input"
                  type="number" min={0} max={100} step={0.5}
                  value={form.commissionRate}
                  onChange={e => f('commissionRate', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="label">Telefone</label>
                <input className="input" value={form.phone} onChange={e => f('phone', e.target.value)} placeholder="(11) 99999-9999" />
              </div>
              <div>
                <label className="label">Especialidade</label>
                <input className="input" value={form.specialty} onChange={e => f('specialty', e.target.value)} placeholder="Ortopedia, Oncologia..." />
              </div>
            </div>

            {/* Preview da comissão */}
            {form.commissionRate > 0 && (
              <div className="rounded-lg p-3 bg-green-50 border border-green-200 text-sm text-green-700">
                <span className="font-medium">Exemplo:</span> em um serviço de {formatCurrency(500)}, a comissão será{' '}
                <span className="font-bold">{formatCurrency(500 * form.commissionRate / 100)}</span>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button onClick={closeModal} className="btn-secondary">Cancelar</button>
              <button
                onClick={() => save.mutate(form)}
                disabled={save.isPending || !form.name || !form.email || (!editing && !form.password)}
                className="btn-primary"
              >
                {save.isPending ? 'Salvando...' : editing ? 'Salvar' : 'Criar Usuário'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
