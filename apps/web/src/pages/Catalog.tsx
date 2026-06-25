import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/utils'
import { Plus, X, Package, Pencil } from 'lucide-react'
import { cn } from '../lib/utils'

const CATEGORIES = [
  { value: '', label: 'Todos' },
  { value: 'PROCEDIMENTO_CIRURGICO', label: 'Procedimento Cirúrgico' },
  { value: 'ANESTESIA', label: 'Anestesia' },
  { value: 'MATERIAL', label: 'Material' },
  { value: 'MEDICAMENTO', label: 'Medicamento' },
  { value: 'EXAME', label: 'Exame' },
  { value: 'CONSULTORIA', label: 'Consultoria' },
  { value: 'OUTRO', label: 'Outro' },
]

const EMPTY_FORM = { name: '', description: '', category: 'PROCEDIMENTO_CIRURGICO', unitPrice: '', unit: 'un' }

export default function CatalogPage() {
  const qc = useQueryClient()
  const [category, setCategory] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  const { data: items = [] } = useQuery({
    queryKey: ['catalog', category],
    queryFn: () => api.get(`/catalog${category ? `?category=${category}` : ''}`).then((r) => r.data),
  })

  const save = useMutation({
    mutationFn: () => editing
      ? api.put(`/catalog/${editing.id}`, { ...form, unitPrice: parseFloat(form.unitPrice) })
      : api.post('/catalog', { ...form, unitPrice: parseFloat(form.unitPrice) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalog'] })
      setShowForm(false)
      setEditing(null)
      setForm({ ...EMPTY_FORM })
    },
  })

  function openEdit(item: any) {
    setEditing(item)
    setForm({ name: item.name, description: item.description || '', category: item.category, unitPrice: String(item.unitPrice), unit: item.unit })
    setShowForm(true)
  }

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [field]: e.target.value })

  const grouped = items.reduce((acc: any, item: any) => {
    const cat = item.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Catálogo de Itens</h1>
          <p className="text-sm text-gray-500">Procedimentos, materiais e serviços para orçamentos</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditing(null); setForm({ ...EMPTY_FORM }); setShowForm(true) }}>
          <Plus className="w-4 h-4" /> Novo Item
        </button>
      </div>

      {/* Filtro por categoria */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button key={c.value} onClick={() => setCategory(c.value)}
            className={cn('px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border',
              category === c.value ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50')}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Itens */}
      {items.length === 0 && (
        <div className="card p-8 text-center">
          <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Nenhum item cadastrado</p>
        </div>
      )}

      {category
        ? (
          <div className="space-y-2">
            {items.map((item: any) => <CatalogItemRow key={item.id} item={item} onEdit={openEdit} />)}
          </div>
        )
        : Object.entries(grouped).map(([cat, catItems]: any) => (
          <div key={cat}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              {CATEGORIES.find((c) => c.value === cat)?.label || cat}
            </p>
            <div className="space-y-2">
              {catItems.map((item: any) => <CatalogItemRow key={item.id} item={item} onEdit={openEdit} />)}
            </div>
          </div>
        ))
      }

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="card p-5 w-full max-w-md space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{editing ? 'Editar Item' : 'Novo Item'}</h3>
              <button className="btn-ghost p-1" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></button>
            </div>
            <div><label className="label">Nome *</label><input className="input" value={form.name} onChange={f('name')} /></div>
            <div>
              <label className="label">Categoria</label>
              <select className="input" value={form.category} onChange={f('category')}>
                {CATEGORIES.filter((c) => c.value).map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div><label className="label">Descrição</label><textarea className="input resize-none" rows={2} value={form.description} onChange={f('description')} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="label">Valor unitário (R$) *</label><input className="input" type="number" step="0.01" value={form.unitPrice} onChange={f('unitPrice')} /></div>
              <div><label className="label">Unidade</label><input className="input" value={form.unit} onChange={f('unit')} placeholder="un, ml, h..." /></div>
            </div>
            <div className="flex gap-2">
              <button className="btn-outline flex-1" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn-primary flex-1" disabled={!form.name || !form.unitPrice || save.isPending} onClick={() => save.mutate()}>
                {save.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CatalogItemRow({ item, onEdit }: { item: any; onEdit: (item: any) => void }) {
  return (
    <div className="card p-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{item.name}</p>
        {item.description && <p className="text-xs text-gray-400 truncate">{item.description}</p>}
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-gray-900">{formatCurrency(item.unitPrice)}</p>
        <p className="text-xs text-gray-400">/{item.unit}</p>
      </div>
      <button className="btn-ghost p-1.5" onClick={() => onEdit(item)}>
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
