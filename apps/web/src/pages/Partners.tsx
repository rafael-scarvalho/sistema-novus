import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../lib/api'
import { Plus, X, Building2 } from 'lucide-react'

const TYPE_LABELS: Record<string, string> = {
  CLINICA: 'Clínica', HOSPITAL: 'Hospital', VETERINARIO: 'Veterinário', OUTRO: 'Outro',
}

export default function PartnersPage() {
  const qc = useQueryClient()
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({
    name: '', type: 'CLINICA', phone: '', email: '', cnpj: '', cpf: '',
    commissionType: 'NENHUM', commissionValue: '0', notes: '',
  })

  const { data: partners = [] } = useQuery({
    queryKey: ['partners'],
    queryFn: () => api.get('/partners').then((r) => r.data),
  })

  const create = useMutation({
    mutationFn: () => api.post('/partners', { ...form, commissionValue: parseFloat(form.commissionValue) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['partners'] }); setShowNew(false) },
  })

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [field]: e.target.value })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Parceiros</h1>
          <p className="text-sm text-gray-500">Clínicas, hospitais e veterinários parceiros</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4" /> Novo Parceiro
        </button>
      </div>

      <div className="space-y-2">
        {partners.length === 0 && (
          <div className="card p-8 text-center">
            <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Nenhum parceiro cadastrado</p>
          </div>
        )}
        {partners.map((p: any) => (
          <div key={p.id} className="card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center font-bold text-blue-600 shrink-0">
              {p.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900">{p.name}</p>
                <span className="badge bg-gray-100 text-gray-600">{TYPE_LABELS[p.type]}</span>
              </div>
              <p className="text-sm text-gray-500">{p.phone}{p.email ? ` · ${p.email}` : ''}</p>
              {p.commissionType !== 'NENHUM' && (
                <p className="text-xs text-orange-600">
                  Comissão: {p.commissionType === 'PERCENTUAL' ? `${p.commissionValue}%` : `R$ ${p.commissionValue}`}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="card p-5 w-full max-w-md max-h-[90vh] overflow-y-auto space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Novo Parceiro</h3>
              <button className="btn-ghost p-1" onClick={() => setShowNew(false)}><X className="w-4 h-4" /></button>
            </div>
            <div><label className="label">Nome *</label><input className="input" value={form.name} onChange={f('name')} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Tipo</label>
                <select className="input" value={form.type} onChange={f('type')}>
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div><label className="label">Telefone *</label><input className="input" type="tel" value={form.phone} onChange={f('phone')} /></div>
            </div>
            <div><label className="label">E-mail</label><input className="input" type="email" value={form.email} onChange={f('email')} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Comissão</label>
                <select className="input" value={form.commissionType} onChange={f('commissionType')}>
                  <option value="NENHUM">Sem comissão</option>
                  <option value="PERCENTUAL">Percentual (%)</option>
                  <option value="FIXO">Valor fixo (R$)</option>
                </select>
              </div>
              {form.commissionType !== 'NENHUM' && (
                <div>
                  <label className="label">{form.commissionType === 'PERCENTUAL' ? 'Percentual (%)' : 'Valor (R$)'}</label>
                  <input className="input" type="number" step="0.01" value={form.commissionValue} onChange={f('commissionValue')} />
                </div>
              )}
            </div>
            <div><label className="label">Observações</label><textarea className="input resize-none" rows={2} value={form.notes} onChange={f('notes')} /></div>
            <div className="flex gap-2">
              <button className="btn-outline flex-1" onClick={() => setShowNew(false)}>Cancelar</button>
              <button className="btn-primary flex-1" disabled={!form.name || !form.phone || create.isPending} onClick={() => create.mutate()}>
                {create.isPending ? 'Salvando...' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
