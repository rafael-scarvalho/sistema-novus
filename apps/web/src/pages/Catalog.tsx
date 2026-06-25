import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/utils'
import { Plus, X, Package, Pencil, AlertTriangle, Archive } from 'lucide-react'
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

const EMPTY_FORM = {
  name: '', description: '', category: 'PROCEDIMENTO_CIRURGICO', unitPrice: '', unit: 'un',
  stockEnabled: false, stockQty: '0', stockMin: '0',
}

export default function CatalogPage() {
  const qc = useQueryClient()
  const [category, setCategory] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [showLowStock, setShowLowStock] = useState(false)

  const { data: items = [] } = useQuery({
    queryKey: ['catalog', category],
    queryFn: () => api.get(`/catalog${category ? `?category=${category}` : ''}`).then((r) => r.data),
  })

  const save = useMutation({
    mutationFn: () => editing
      ? api.put(`/catalog/${editing.id}`, {
          ...form,
          unitPrice: parseFloat(form.unitPrice),
          stockQty: parseFloat(form.stockQty) || 0,
          stockMin: parseFloat(form.stockMin) || 0,
        })
      : api.post('/catalog', {
          ...form,
          unitPrice: parseFloat(form.unitPrice),
          stockQty: parseFloat(form.stockQty) || 0,
          stockMin: parseFloat(form.stockMin) || 0,
        }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalog'] })
      setShowForm(false)
      setEditing(null)
      setForm({ ...EMPTY_FORM })
    },
  })

  function openEdit(item: any) {
    setEditing(item)
    setForm({
      name: item.name,
      description: item.description || '',
      category: item.category,
      unitPrice: String(item.unitPrice),
      unit: item.unit,
      stockEnabled: item.stockEnabled || false,
      stockQty: String(item.stockQty || 0),
      stockMin: String(item.stockMin || 0),
    })
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

  const lowStockItems = (items as any[]).filter(i => i.stockEnabled && i.stockQty <= i.stockMin)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Catálogo de Itens</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Procedimentos, materiais e serviços</p>
        </div>
        <div className="flex gap-2">
          {lowStockItems.length > 0 && (
            <button onClick={() => setShowLowStock(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-orange-100 text-orange-700 hover:bg-orange-200 transition">
              <AlertTriangle className="w-4 h-4" />
              {lowStockItems.length} estoque baixo
            </button>
          )}
          <button className="btn-primary" onClick={() => { setEditing(null); setForm({ ...EMPTY_FORM }); setShowForm(true) }}>
            <Plus className="w-4 h-4" /> Novo Item
          </button>
        </div>
      </div>

      {/* Filtro por categoria */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button key={c.value} onClick={() => setCategory(c.value)}
            className={cn('px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border',
              category === c.value
                ? 'bg-brand-500 text-white border-brand-500'
                : 'border-gray-200 hover:bg-gray-50')}
            style={category !== c.value ? { borderColor: 'var(--color-card-border)', color: 'var(--color-text-secondary)' } : {}}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Itens */}
      {items.length === 0 && (
        <div className="card p-8 text-center">
          <Package className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--color-text-secondary)' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Nenhum item cadastrado</p>
        </div>
      )}

      {category
        ? (
          <div className="space-y-2">
            {(items as any[]).map((item: any) => <CatalogItemRow key={item.id} item={item} onEdit={openEdit} />)}
          </div>
        )
        : Object.entries(grouped).map(([cat, catItems]: any) => (
          <div key={cat}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              {CATEGORIES.find((c) => c.value === cat)?.label || cat}
            </p>
            <div className="space-y-2">
              {catItems.map((item: any) => <CatalogItemRow key={item.id} item={item} onEdit={openEdit} />)}
            </div>
          </div>
        ))
      }

      {/* Modal estoque baixo */}
      {showLowStock && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-5 w-full max-w-md space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Itens com Estoque Baixo</h3>
              <button className="btn-ghost p-1 ml-auto" onClick={() => setShowLowStock(false)}><X className="w-4 h-4" /></button>
            </div>
            {lowStockItems.map((item: any) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
                <Archive className="w-4 h-4 text-orange-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-800">{item.name}</p>
                  <p className="text-xs text-orange-600">Estoque: {item.stockQty} {item.unit} · Mínimo: {item.stockMin}</p>
                </div>
                <button className="text-xs text-orange-700 underline" onClick={() => { openEdit(item); setShowLowStock(false) }}>
                  Editar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="card p-5 w-full max-w-md space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{editing ? 'Editar Item' : 'Novo Item'}</h3>
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

            {/* Controle de estoque */}
            <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--color-card-border)', backgroundColor: 'var(--color-bg)' }}>
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input type="checkbox" checked={form.stockEnabled}
                  onChange={e => setForm({ ...form, stockEnabled: e.target.checked })}
                  className="rounded" />
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Controlar estoque</span>
              </label>
              {form.stockEnabled && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div><label className="label">Qtd atual</label><input className="input" type="number" step="0.1" value={form.stockQty} onChange={f('stockQty')} /></div>
                  <div><label className="label">Qtd mínima</label><input className="input" type="number" step="0.1" value={form.stockMin} onChange={f('stockMin')} /></div>
                </div>
              )}
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
  const isLowStock = item.stockEnabled && item.stockQty <= item.stockMin

  return (
    <div className={cn('card p-3 flex items-center gap-3', isLowStock && 'border-orange-300')}
      style={isLowStock ? { borderColor: '#f97316' } : {}}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{item.name}</p>
          {isLowStock && <AlertTriangle className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
        </div>
        {item.description && <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>{item.description}</p>}
        {item.stockEnabled && (
          <p className={cn('text-xs mt-0.5', isLowStock ? 'text-orange-500 font-medium' : '')}
            style={!isLowStock ? { color: 'var(--color-text-secondary)' } : {}}>
            📦 Estoque: {item.stockQty} {item.unit}
            {isLowStock && ' · Estoque baixo!'}
          </p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(item.unitPrice)}</p>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>/{item.unit}</p>
      </div>
      <button className="btn-ghost p-1.5" onClick={() => onEdit(item)}>
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
