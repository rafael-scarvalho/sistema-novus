import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { api } from '../lib/api'
import {
  formatCurrency, formatDate, BUDGET_STATUS_LABELS, BUDGET_STATUS_COLORS, PAYMENT_LABELS, cn,
} from '../lib/utils'
import { FileDown, CheckCircle2, X, MessageCircle } from 'lucide-react'

export default function BudgetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showApprove, setShowApprove] = useState(false)
  const [approveForm, setApproveForm] = useState({ approvedPaymentMethod: 'PIX', scheduledDate: '' })

  const { data: budget, isLoading } = useQuery({
    queryKey: ['budget', id],
    queryFn: () => api.get(`/budgets/${id}`).then((r) => r.data),
  })

  const sendWhatsApp = useMutation({
    mutationFn: () => api.post(`/budgets/${id}/send-whatsapp`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budget', id] }),
  })

  const approve = useMutation({
    mutationFn: () => api.post(`/budgets/${id}/approve`, approveForm),
    onSuccess: ({ data }) => {
      qc.invalidateQueries({ queryKey: ['budget', id] })
      navigate(`/cirurgias/${data.surgery.id}`)
    },
  })

  if (isLoading) return <div className="text-center py-12 text-gray-400">Carregando...</div>
  if (!budget) return <div className="text-center py-12 text-gray-400">Orçamento não encontrado</div>

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Cabeçalho */}
      <div className="card p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Orçamento</p>
            <h1 className="text-xl font-bold text-gray-900">{budget.code}</h1>
            <p className="text-sm text-gray-500">{formatDate(budget.createdAt)}</p>
          </div>
          <span className={cn('badge text-sm px-3 py-1', BUDGET_STATUS_COLORS[budget.status])}>
            {BUDGET_STATUS_LABELS[budget.status]}
          </span>
        </div>
      </div>

      {/* Paciente */}
      <div className="card p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Paciente</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><p className="text-gray-400 text-xs">Nome</p><p className="font-medium">{budget.patient.name}</p></div>
          <div><p className="text-gray-400 text-xs">Espécie</p><p>{budget.patient.species}</p></div>
          <div><p className="text-gray-400 text-xs">Tutor</p><p>{budget.patient.guardian.name}</p></div>
          <div><p className="text-gray-400 text-xs">Telefone</p><p>{budget.patient.guardian.phone}</p></div>
          {budget.partner && (
            <div className="col-span-2"><p className="text-gray-400 text-xs">Parceiro</p><p>{budget.partner.name}</p></div>
          )}
        </div>
      </div>

      {/* Itens */}
      <div className="card p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Itens do Orçamento</h2>
        <div className="space-y-2">
          {budget.items.map((item: any) => (
            <div key={item.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                {item.description && <p className="text-xs text-gray-400">{item.description}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-gray-400">{item.quantity}x {formatCurrency(item.unitPrice)}</p>
                {item.discount > 0 && <p className="text-xs text-red-400">-{formatCurrency(item.discount)}</p>}
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.total)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 space-y-1 text-right">
          <p className="text-sm text-gray-500">Subtotal: {formatCurrency(budget.subtotal)}</p>
          {budget.discount > 0 && (
            <p className="text-sm text-red-500">Desconto: -{formatCurrency(budget.discount)}</p>
          )}
          <p className="text-lg font-bold text-gray-900">Total: {formatCurrency(budget.total)}</p>
        </div>
      </div>

      {/* Formas de pagamento */}
      {budget.paymentOptions.length > 0 && (
        <div className="card p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Formas de Pagamento</h2>
          <div className="space-y-2">
            {budget.paymentOptions.map((opt: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {PAYMENT_LABELS[opt.method]}
                    {opt.installments ? ` (${opt.installments}x)` : ''}
                  </p>
                  {opt.discount && <p className="text-xs text-green-600">{opt.discount}% de desconto</p>}
                  {opt.notes && <p className="text-xs text-gray-400">{opt.notes}</p>}
                </div>
                <p className="font-bold text-gray-900">{formatCurrency(opt.total)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {budget.notes && (
        <div className="card p-4">
          <h2 className="font-semibold text-gray-900 mb-2">Observações</h2>
          <p className="text-sm text-gray-600">{budget.notes}</p>
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => sendWhatsApp.mutate()}
          disabled={sendWhatsApp.isPending}
          className="btn-outline text-green-600 border-green-200 hover:bg-green-50"
        >
          <MessageCircle className="w-4 h-4" />
          {sendWhatsApp.isPending ? 'Enviando...' : 'Enviar por WhatsApp'}
        </button>
        <a
          href={`/api/budgets/${id}/pdf`}
          target="_blank"
          rel="noreferrer"
          className="btn-outline"
        >
          <FileDown className="w-4 h-4" />
          Baixar PDF
        </a>
        {budget.status === 'ENVIADO' && (
          <button className="btn-primary" onClick={() => setShowApprove(true)}>
            <CheckCircle2 className="w-4 h-4" />
            Aprovar Orçamento
          </button>
        )}
        {budget.surgery && (
          <button
            className="btn-outline"
            onClick={() => navigate(`/cirurgias/${budget.surgery.id}`)}
          >
            Ver Cirurgia
          </button>
        )}
      </div>

      {/* Modal de aprovação */}
      {showApprove && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Aprovar Orçamento</h3>
              <button className="btn-ghost p-1" onClick={() => setShowApprove(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-500">
              Ao aprovar, uma cirurgia será criada automaticamente e o valor entrará no fluxo de caixa.
            </p>
            <div>
              <label className="label">Forma de Pagamento Aprovada</label>
              <select className="input" value={approveForm.approvedPaymentMethod}
                onChange={(e) => setApproveForm({ ...approveForm, approvedPaymentMethod: e.target.value })}>
                {budget.paymentOptions.map((o: any) => (
                  <option key={o.method} value={o.method}>{PAYMENT_LABELS[o.method]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Data da Cirurgia</label>
              <input className="input" type="datetime-local" value={approveForm.scheduledDate}
                onChange={(e) => setApproveForm({ ...approveForm, scheduledDate: e.target.value })} required />
            </div>
            <div className="flex gap-2">
              <button className="btn-outline flex-1" onClick={() => setShowApprove(false)}>Cancelar</button>
              <button
                className="btn-primary flex-1"
                disabled={!approveForm.scheduledDate || approve.isPending}
                onClick={() => approve.mutate()}
              >
                {approve.isPending ? 'Aprovando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
