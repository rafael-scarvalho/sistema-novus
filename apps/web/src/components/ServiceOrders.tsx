import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { formatCurrency, formatDate, cn } from '../lib/utils'
import { Plus, Trash2, CheckCircle2, DollarSign, X, ChevronDown, ChevronUp, Receipt } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  ABERTA: 'bg-yellow-100 text-yellow-700',
  FECHADA: 'bg-blue-100 text-blue-700',
  PAGA: 'bg-green-100 text-green-700',
  CANCELADA: 'bg-red-100 text-red-600',
}

const STATUS_LABELS: Record<string, string> = {
  ABERTA: 'Aberta',
  FECHADA: 'Fechada',
  PAGA: 'Paga',
  CANCELADA: 'Cancelada',
}

const PAYMENT_METHODS = [
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'PIX', label: 'PIX' },
  { value: 'CARTAO_CREDITO', label: 'Cartão de Crédito' },
  { value: 'CARTAO_DEBITO', label: 'Cartão de Débito' },
  { value: 'TRANSFERENCIA', label: 'Transferência' },
]

interface CatalogItem { id: string; name: string; unitPrice: number; category: string }
interface OrderItem { id: string; name: string; quantity: number; unitPrice: number; commissionRate: number; commissionAmount: number; total: number }
interface ServiceOrder {
  id: string; status: string; notes: string; total: number; totalCommission: number
  createdAt: string; paidAt?: string; paymentMethod?: string
  vet: { id: string; name: string; commissionRate: number }
  items: OrderItem[]
}
interface User { id: string; name: string; role: string; commissionRate: number; active: boolean }

export default function ServiceOrders({ patientId }: { patientId: string }) {
  const qc = useQueryClient()
  const [newModal, setNewModal] = useState(false)
  const [payModal, setPayModal] = useState<ServiceOrder | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('PIX')

  // Form nova OS
  const [selectedVet, setSelectedVet] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<Array<{ catalogItemId: string; name: string; quantity: number; unitPrice: number }>>([])
  const [addingItem, setAddingItem] = useState(false)
  const [newItem, setNewItem] = useState({ catalogItemId: '', name: '', quantity: 1, unitPrice: 0 })

  const { data: orders = [] } = useQuery<ServiceOrder[]>({
    queryKey: ['service-orders', patientId],
    queryFn: () => api.get(`/service-orders/patient/${patientId}`).then(r => r.data),
  })

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data),
  })

  const { data: catalog = [] } = useQuery<CatalogItem[]>({
    queryKey: ['catalog'],
    queryFn: () => api.get('/catalog').then(r => r.data),
  })

  const vets = users.filter(u => u.active && (u.role === 'SURGEON' || u.role === 'ADMIN'))
  const selectedVetData = users.find(u => u.id === selectedVet)

  const createOrder = useMutation({
    mutationFn: () => api.post('/service-orders', { patientId, vetId: selectedVet, notes, items }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-orders', patientId] })
      setNewModal(false)
      setItems([])
      setNotes('')
      setSelectedVet('')
    },
  })

  const removeItem = useMutation({
    mutationFn: ({ orderId, itemId }: { orderId: string; itemId: string }) =>
      api.delete(`/service-orders/${orderId}/items/${itemId}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-orders', patientId] }),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status, paymentMethod }: { id: string; status: string; paymentMethod?: string }) =>
      api.patch(`/service-orders/${id}/status`, { status, paymentMethod }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-orders', patientId] })
      setPayModal(null)
    },
  })

  function addItemToList() {
    if (!newItem.name || newItem.unitPrice <= 0) return
    setItems(p => [...p, { ...newItem }])
    setNewItem({ catalogItemId: '', name: '', quantity: 1, unitPrice: 0 })
    setAddingItem(false)
  }

  function selectCatalogItem(id: string) {
    const item = catalog.find(c => c.id === id)
    if (item) setNewItem(p => ({ ...p, catalogItemId: id, name: item.name, unitPrice: item.unitPrice }))
  }

  const previewTotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const previewCommission = previewTotal * ((selectedVetData?.commissionRate || 0) / 100)

  const openOrders = orders.filter(o => o.status === 'ABERTA')
  const closedOrders = orders.filter(o => o.status !== 'ABERTA')
  const totalAberto = openOrders.reduce((s, o) => s + o.total, 0)

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          {totalAberto > 0 && (
            <div className="flex items-center gap-2 text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
              <Receipt className="w-4 h-4" />
              <span className="text-sm font-medium">Conta em aberto: <strong>{formatCurrency(totalAberto)}</strong></span>
            </div>
          )}
        </div>
        <button onClick={() => setNewModal(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Nova OS
        </button>
      </div>

      {orders.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">Nenhuma ordem de serviço lançada</div>
      )}

      {/* OSs Abertas */}
      {openOrders.map(order => (
        <OrderCard
          key={order.id}
          order={order}
          expanded={expanded === order.id}
          onToggle={() => setExpanded(expanded === order.id ? null : order.id)}
          onRemoveItem={(itemId) => removeItem.mutate({ orderId: order.id, itemId })}
          onClose={() => updateStatus.mutate({ id: order.id, status: 'FECHADA' })}
          onPay={() => setPayModal(order)}
        />
      ))}

      {/* OSs Fechadas/Pagas */}
      {closedOrders.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Histórico</h3>
          {closedOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              expanded={expanded === order.id}
              onToggle={() => setExpanded(expanded === order.id ? null : order.id)}
            />
          ))}
        </div>
      )}

      {/* Modal Nova OS */}
      {newModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Nova Ordem de Serviço</h2>
              <button onClick={() => setNewModal(false)}><X className="w-5 h-5" /></button>
            </div>

            {/* Veterinário */}
            <div>
              <label className="label">Veterinário responsável *</label>
              <select className="input" value={selectedVet} onChange={e => setSelectedVet(e.target.value)}>
                <option value="">Selecione...</option>
                {vets.map(v => (
                  <option key={v.id} value={v.id}>{v.name} — {v.commissionRate}% comissão</option>
                ))}
              </select>
            </div>

            {/* Itens */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Procedimentos / Serviços</label>
                <button onClick={() => setAddingItem(true)} className="text-xs text-blue-600 flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Adicionar
                </button>
              </div>

              {items.length === 0 && !addingItem && (
                <p className="text-sm text-gray-400 py-2">Nenhum item adicionado ainda</p>
              )}

              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm py-1.5 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <span className="flex-1">{item.name}</span>
                  <span className="text-gray-500">{item.quantity}x</span>
                  <span className="font-medium">{formatCurrency(item.quantity * item.unitPrice)}</span>
                  <button onClick={() => setItems(p => p.filter((_, j) => j !== i))} className="text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {addingItem && (
                <div className="border rounded-lg p-3 space-y-2 mt-2" style={{ borderColor: 'var(--color-border)' }}>
                  <select className="input text-sm" value={newItem.catalogItemId} onChange={e => selectCatalogItem(e.target.value)}>
                    <option value="">Selecionar do catálogo (opcional)</option>
                    {catalog.map(c => <option key={c.id} value={c.id}>{c.name} — {formatCurrency(c.unitPrice)}</option>)}
                  </select>
                  <input className="input text-sm" placeholder="Nome do procedimento *" value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label text-xs">Qtd</label>
                      <input className="input text-sm" type="number" min={1} value={newItem.quantity} onChange={e => setNewItem(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} />
                    </div>
                    <div>
                      <label className="label text-xs">Valor unitário (R$)</label>
                      <input className="input text-sm" type="number" min={0} step={0.01} value={newItem.unitPrice} onChange={e => setNewItem(p => ({ ...p, unitPrice: parseFloat(e.target.value) || 0 }))} />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setAddingItem(false)} className="btn-secondary text-xs py-1">Cancelar</button>
                    <button onClick={addItemToList} className="btn-primary text-xs py-1">Adicionar</button>
                  </div>
                </div>
              )}
            </div>

            {/* Observações */}
            <div>
              <label className="label">Observações</label>
              <textarea className="input min-h-[60px] resize-none" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anotações sobre o atendimento..." />
            </div>

            {/* Preview */}
            {items.length > 0 && selectedVet && (
              <div className="rounded-lg p-3 space-y-1 text-sm" style={{ background: 'var(--color-bg-secondary)' }}>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-secondary)' }}>Total dos serviços</span>
                  <span className="font-bold">{formatCurrency(previewTotal)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Comissão {selectedVetData?.commissionRate}% — {selectedVetData?.name}</span>
                  <span className="font-bold">{formatCurrency(previewCommission)}</span>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button onClick={() => setNewModal(false)} className="btn-secondary">Cancelar</button>
              <button
                onClick={() => createOrder.mutate()}
                disabled={createOrder.isPending || !selectedVet || items.length === 0}
                className="btn-primary"
              >
                {createOrder.isPending ? 'Lançando...' : 'Lançar OS'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pagamento */}
      {payModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Registrar Pagamento</h2>
              <button onClick={() => setPayModal(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="rounded-lg p-3 space-y-1 text-sm" style={{ background: 'var(--color-bg-secondary)' }}>
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>{formatCurrency(payModal.total)}</span>
              </div>
              <div className="flex justify-between text-green-600 text-xs">
                <span>Comissão {payModal.vet.name}</span>
                <span>{formatCurrency(payModal.totalCommission)}</span>
              </div>
            </div>
            <div>
              <label className="label">Forma de pagamento</label>
              <select className="input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPayModal(null)} className="btn-secondary flex-1">Cancelar</button>
              <button
                onClick={() => updateStatus.mutate({ id: payModal.id, status: 'PAGA', paymentMethod })}
                disabled={updateStatus.isPending}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {updateStatus.isPending ? 'Salvando...' : 'Confirmar Pagamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function OrderCard({
  order, expanded, onToggle, onRemoveItem, onClose, onPay,
}: {
  order: ServiceOrder
  expanded: boolean
  onToggle: () => void
  onRemoveItem?: (itemId: string) => void
  onClose?: () => void
  onPay?: () => void
}) {
  const isOpen = order.status === 'ABERTA'
  return (
    <div className={cn('card overflow-hidden', isOpen && 'border-yellow-300')} style={isOpen ? { borderWidth: 1 } : {}}>
      {/* Cabeçalho do card */}
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-left">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>
              {STATUS_LABELS[order.status]}
            </span>
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {order.vet.name}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {formatDate(order.createdAt)}
            </span>
          </div>
          <div className="flex gap-4 mt-1 text-sm">
            <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(order.total)}</span>
            <span className="text-green-600 text-xs">Comissão: {formatCurrency(order.totalCommission)}</span>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: 'var(--color-text-secondary)' }} />
          : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: 'var(--color-text-secondary)' }} />}
      </button>

      {/* Itens expandidos */}
      {expanded && (
        <div className="border-t px-4 pb-4 space-y-3" style={{ borderColor: 'var(--color-border)' }}>
          <div className="space-y-1 pt-3">
            {order.items.map(item => (
              <div key={item.id} className="flex items-center gap-2 text-sm py-1">
                <span className="flex-1" style={{ color: 'var(--color-text-primary)' }}>{item.name}</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>{item.quantity}x {formatCurrency(item.unitPrice)}</span>
                <span className="font-medium w-20 text-right">{formatCurrency(item.total)}</span>
                {isOpen && onRemoveItem && (
                  <button onClick={() => onRemoveItem(item.id)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {order.notes && (
            <p className="text-xs italic" style={{ color: 'var(--color-text-secondary)' }}>"{order.notes}"</p>
          )}

          {order.paidAt && (
            <p className="text-xs text-green-600">Pago em {formatDate(order.paidAt)} · {order.paymentMethod?.replace('_', ' ')}</p>
          )}

          {/* Ações */}
          {isOpen && (
            <div className="flex gap-2 pt-1">
              {onClose && (
                <button onClick={onClose} className="btn-secondary text-xs py-1.5 flex items-center gap-1">
                  Fechar OS
                </button>
              )}
              {onPay && (
                <button onClick={onPay} className="btn-primary text-xs py-1.5 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" /> Registrar Pagamento
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
