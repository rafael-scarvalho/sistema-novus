import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import { formatCurrency, PAYMENT_LABELS } from '../lib/utils'
import { Search, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '../lib/utils'

const PAYMENT_METHODS = ['PIX', 'DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'BOLETO', 'TRANSFERENCIA', 'PARCELADO']

interface BudgetItem {
  catalogItemId?: string
  name: string
  description: string
  quantity: number
  unitPrice: number
  discount: number
}

interface PaymentOption {
  method: string
  installments?: number
  discount?: number
  total: number
  notes: string
}

export default function BudgetNewPage() {
  const navigate = useNavigate()
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [selectedPartner, setSelectedPartner] = useState<any>(null)
  const [items, setItems] = useState<BudgetItem[]>([])
  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([{ method: 'PIX', total: 0, notes: '' }])
  const [notes, setNotes] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [catalogSearch, setCatalogSearch] = useState('')
  const [globalDiscount, setGlobalDiscount] = useState(0)
  const [showCatalog, setShowCatalog] = useState(false)

  const { data: patients = [] } = useQuery({
    queryKey: ['patients-search', patientSearch],
    queryFn: () => patientSearch.length >= 2
      ? api.get(`/patients?search=${patientSearch}`).then(r => r.data)
      : Promise.resolve([]),
    enabled: patientSearch.length >= 2,
  })

  const { data: partners = [] } = useQuery({
    queryKey: ['partners'],
    queryFn: () => api.get('/partners').then(r => r.data),
  })

  const { data: catalogItems = [] } = useQuery({
    queryKey: ['catalog'],
    queryFn: () => api.get('/catalog').then(r => r.data),
  })

  const filteredCatalog = catalogItems.filter((i: any) =>
    !catalogSearch || i.name.toLowerCase().includes(catalogSearch.toLowerCase())
  )

  const subtotal = items.reduce((s, i) => s + (i.quantity * i.unitPrice - i.discount), 0)
  const total = subtotal - globalDiscount

  function addFromCatalog(item: any) {
    setItems(prev => [...prev, {
      catalogItemId: item.id,
      name: item.name,
      description: item.description || '',
      quantity: 1,
      unitPrice: item.unitPrice,
      discount: 0,
    }])
    setShowCatalog(false)
    setCatalogSearch('')
    // Atualiza pagamentos automaticamente com novo total
    updatePaymentTotals(total + item.unitPrice)
  }

  function addManualItem() {
    setItems(prev => [...prev, { name: '', description: '', quantity: 1, unitPrice: 0, discount: 0 }])
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  function updateItem(idx: number, field: keyof BudgetItem, value: any) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  function updatePaymentTotals(newTotal: number) {
    setPaymentOptions(prev => prev.map(p => ({
      ...p,
      total: p.discount ? newTotal * (1 - p.discount / 100) : newTotal,
    })))
  }

  function addPaymentOption() {
    setPaymentOptions(prev => [...prev, { method: 'PIX', total, notes: '' }])
  }

  function removePaymentOption(idx: number) {
    setPaymentOptions(prev => prev.filter((_, i) => i !== idx))
  }

  function updatePayment(idx: number, field: keyof PaymentOption, value: any) {
    setPaymentOptions(prev => prev.map((p, i) => {
      if (i !== idx) return p
      const updated = { ...p, [field]: value }
      if (field === 'discount') {
        updated.total = total * (1 - (Number(value) || 0) / 100)
      }
      return updated
    }))
  }

  const create = useMutation({
    mutationFn: () => api.post('/budgets', {
      patientId: selectedPatient.id,
      partnerId: selectedPartner?.id,
      validUntil: validUntil || undefined,
      notes,
      discount: globalDiscount,
      items: items.map(i => ({
        catalogItemId: i.catalogItemId,
        name: i.name,
        description: i.description,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        discount: Number(i.discount),
      })),
      paymentOptions: paymentOptions.map(p => ({
        method: p.method,
        installments: p.installments ? Number(p.installments) : undefined,
        discount: p.discount ? Number(p.discount) : undefined,
        total: Number(p.total),
        notes: p.notes,
      })),
    }),
    onSuccess: ({ data }) => navigate(`/orcamentos/${data.id}`),
  })

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Novo Orçamento</h1>
        <p className="text-sm text-gray-500">Crie um orçamento detalhado para o procedimento</p>
      </div>

      {/* Paciente */}
      <div className="card p-4 space-y-3">
        <h2 className="font-semibold text-gray-900">Paciente</h2>
        {!selectedPatient ? (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input pl-9" placeholder="Digite o nome do paciente ou tutor..."
              value={patientSearch} onChange={e => setPatientSearch(e.target.value)} />
            {patients.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 mt-1 max-h-48 overflow-y-auto">
                {patients.map((p: any) => (
                  <button key={p.id} onClick={() => { setSelectedPatient(p); setPatientSearch('') }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                    <p className="font-medium text-sm text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.species}{p.breed ? ` · ${p.breed}` : ''} · Tutor: {p.guardian.name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 bg-brand-50 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center font-bold text-white text-sm">
              {selectedPatient.name[0]}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{selectedPatient.name}</p>
              <p className="text-xs text-gray-500">Tutor: {selectedPatient.guardian.name} · {selectedPatient.guardian.phone}</p>
            </div>
            <button onClick={() => setSelectedPatient(null)} className="text-xs text-gray-400 hover:text-red-500">Trocar</button>
          </div>
        )}

        {/* Parceiro */}
        <div>
          <label className="label">Parceiro / Clínica (opcional)</label>
          <select className="input" value={selectedPartner?.id || ''}
            onChange={e => setSelectedPartner(partners.find((p: any) => p.id === e.target.value) || null)}>
            <option value="">Sem parceiro</option>
            {partners.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Válido até</label>
            <input className="input" type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Itens */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Itens do Orçamento</h2>
          <div className="flex gap-2">
            <button onClick={() => setShowCatalog(v => !v)} className="btn-outline text-xs px-3 py-1.5">
              <Search className="w-3 h-3" /> Catálogo
            </button>
            <button onClick={addManualItem} className="btn-ghost text-xs px-3 py-1.5">
              <Plus className="w-3 h-3" /> Manual
            </button>
          </div>
        </div>

        {/* Busca no catálogo */}
        {showCatalog && (
          <div className="border border-brand-200 rounded-lg bg-brand-50 p-3 space-y-2">
            <input className="input bg-white" placeholder="Buscar no catálogo..."
              value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)} autoFocus />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredCatalog.slice(0, 20).map((item: any) => (
                <button key={item.id} onClick={() => addFromCatalog(item)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-white rounded-lg hover:bg-brand-50 border border-gray-100 text-left">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.category.replace(/_/g, ' ')}</p>
                  </div>
                  <p className="text-sm font-bold text-brand-600">{formatCurrency(item.unitPrice)}</p>
                </button>
              ))}
              {filteredCatalog.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-2">Nenhum item encontrado</p>
              )}
            </div>
          </div>
        )}

        {/* Lista de itens */}
        {items.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Adicione itens pelo catálogo ou manualmente</p>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="border border-gray-100 rounded-lg p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <input className="input text-sm font-medium" placeholder="Nome do item *"
                      value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)} />
                  </div>
                  <button onClick={() => removeItem(idx)} className="btn-ghost p-1.5 text-red-400 hover:text-red-600 shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input className="input text-sm text-gray-500" placeholder="Descrição (opcional)"
                  value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="label">Qtd</label>
                    <input className="input" type="number" min="0.1" step="0.1"
                      value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Valor unit. (R$)</label>
                    <input className="input" type="number" min="0" step="0.01"
                      value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Desconto (R$)</label>
                    <input className="input" type="number" min="0" step="0.01"
                      value={item.discount} onChange={e => updateItem(idx, 'discount', e.target.value)} />
                  </div>
                </div>
                <div className="text-right text-sm font-bold text-gray-900">
                  Subtotal: {formatCurrency(item.quantity * item.unitPrice - item.discount)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Totais */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 pt-3 space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Desconto geral (R$)</span>
              <input className="input w-32 text-right text-sm" type="number" min="0" step="0.01"
                value={globalDiscount} onChange={e => setGlobalDiscount(Number(e.target.value))} />
            </div>
            <div className="flex items-center justify-between font-bold text-gray-900">
              <span>TOTAL</span>
              <span className="text-lg">{formatCurrency(total)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Formas de pagamento */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Formas de Pagamento</h2>
          <button onClick={addPaymentOption} className="btn-ghost text-xs px-3 py-1.5">
            <Plus className="w-3 h-3" /> Adicionar
          </button>
        </div>
        {paymentOptions.map((opt, idx) => (
          <div key={idx} className="border border-gray-100 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <select className="input flex-1" value={opt.method}
                onChange={e => updatePayment(idx, 'method', e.target.value)}>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{PAYMENT_LABELS[m]}</option>)}
              </select>
              {paymentOptions.length > 1 && (
                <button onClick={() => removePaymentOption(idx)} className="btn-ghost p-1.5 text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {opt.method === 'PARCELADO' && (
                <div>
                  <label className="label">Parcelas</label>
                  <input className="input" type="number" min="2" max="36" placeholder="Ex: 12"
                    value={opt.installments || ''} onChange={e => updatePayment(idx, 'installments', e.target.value)} />
                </div>
              )}
              <div>
                <label className="label">Desconto (%)</label>
                <input className="input" type="number" min="0" max="100" step="0.1"
                  value={opt.discount || ''} onChange={e => updatePayment(idx, 'discount', e.target.value)} />
              </div>
              <div>
                <label className="label">Total (R$)</label>
                <input className="input font-bold" type="number" min="0" step="0.01"
                  value={opt.total} onChange={e => updatePayment(idx, 'total', e.target.value)} />
              </div>
            </div>
            <input className="input text-sm" placeholder="Observação (ex: com desconto à vista)"
              value={opt.notes} onChange={e => updatePayment(idx, 'notes', e.target.value)} />
          </div>
        ))}
      </div>

      {/* Observações */}
      <div className="card p-4">
        <label className="label">Observações do orçamento</label>
        <textarea className="input resize-none" rows={3} placeholder="Informações adicionais, condições especiais..."
          value={notes} onChange={e => setNotes(e.target.value)} />
      </div>

      {/* Ações */}
      <div className="flex gap-3">
        <button className="btn-outline flex-1" onClick={() => navigate('/orcamentos')}>Cancelar</button>
        <button
          className="btn-primary flex-1"
          disabled={!selectedPatient || items.length === 0 || create.isPending}
          onClick={() => create.mutate()}
        >
          {create.isPending ? 'Salvando...' : 'Criar Orçamento'}
        </button>
      </div>
    </div>
  )
}
