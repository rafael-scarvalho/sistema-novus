import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../lib/api'
import { formatCurrency, formatDate, cn } from '../lib/utils'
import { TrendingUp, TrendingDown, Clock, Plus, Check } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  CIRURGIA: 'Cirurgia', CONSULTA: 'Consulta', MATERIAL: 'Material',
  REPASSE_PARCEIRO: 'Repasse Parceiro', IMPOSTO: 'Imposto', SALARIO: 'Salário',
  EQUIPAMENTO: 'Equipamento', OUTRO: 'Outro',
}

export default function FinancialPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'fluxo' | 'repasses'>('fluxo')
  const [type, setType] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [newTx, setNewTx] = useState({
    type: 'ENTRADA', category: 'CIRURGIA', description: '', amount: '',
    dueDate: new Date().toISOString().split('T')[0], notes: '',
  })

  const { data: summary } = useQuery({
    queryKey: ['financial-summary'],
    queryFn: () => api.get('/financial/summary').then((r) => r.data),
  })

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', type],
    queryFn: () => api.get(`/financial/transactions${type ? `?type=${type}` : ''}`).then((r) => r.data),
  })

  const { data: settlements = [] } = useQuery({
    queryKey: ['settlements'],
    queryFn: () => api.get('/financial/settlements').then((r) => r.data),
  })

  const payTx = useMutation({
    mutationFn: (id: string) => api.patch(`/financial/transactions/${id}/pay`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transactions'] }); qc.invalidateQueries({ queryKey: ['financial-summary'] }) },
  })

  const paySettlement = useMutation({
    mutationFn: (id: string) => api.patch(`/financial/settlements/${id}/pay`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settlements'] }); qc.invalidateQueries({ queryKey: ['financial-summary'] }) },
  })

  const createTx = useMutation({
    mutationFn: () => api.post('/financial/transactions', { ...newTx, amount: parseFloat(newTx.amount) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['financial-summary'] })
      setShowNew(false)
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-sm text-gray-500">Fluxo de caixa e repasses</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4" /> Lançamento
        </button>
      </div>

      {/* Cards de resumo */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Receita', value: summary.totalRevenue, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Despesas', value: summary.totalExpenses, icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50' },
            { label: 'A Receber', value: summary.pendingReceivables, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Repasses', value: summary.pendingSettlements, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
          ].map((c) => (
            <div key={c.label} className="card p-4">
              <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center mb-2`}>
                <c.icon className={`w-4 h-4 ${c.color}`} />
              </div>
              <p className="text-xs text-gray-500">{c.label}</p>
              <p className="text-base font-bold text-gray-900">{formatCurrency(c.value)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Saldo */}
      {summary && (
        <div className="card p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Saldo Líquido</p>
            <p className={`text-2xl font-bold ${summary.netBalance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {formatCurrency(summary.netBalance)}
            </p>
          </div>
        </div>
      )}

      {/* Abas */}
      <div className="card p-1 flex gap-1">
        {[{ v: 'fluxo', l: 'Fluxo de Caixa' }, { v: 'repasses', l: 'Repasses Parceiros' }].map((t) => (
          <button key={t.v} onClick={() => setTab(t.v as any)}
            className={cn('flex-1 py-2 text-sm font-medium rounded-lg transition-colors',
              tab === t.v ? 'bg-brand-500 text-white' : 'text-gray-600 hover:bg-gray-50')}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === 'fluxo' && (
        <>
          <div className="card p-1 flex gap-1">
            {[{ v: '', l: 'Todos' }, { v: 'ENTRADA', l: 'Entradas' }, { v: 'SAIDA', l: 'Saídas' }].map((t) => (
              <button key={t.v} onClick={() => setType(t.v)}
                className={cn('flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors',
                  type === t.v ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-50')}>
                {t.l}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {transactions.map((tx: any) => (
              <div key={tx.id} className="card p-3 flex items-center gap-3">
                <div className={cn('w-2 h-2 rounded-full shrink-0',
                  tx.type === 'ENTRADA' ? 'bg-green-500' : 'bg-red-400')} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{tx.description}</p>
                  <p className="text-xs text-gray-400">
                    {CATEGORY_LABELS[tx.category]} · {formatDate(tx.dueDate)}
                    {tx.partner && ` · ${tx.partner.name}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn('font-bold text-sm', tx.type === 'ENTRADA' ? 'text-green-600' : 'text-red-500')}>
                    {tx.type === 'ENTRADA' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </p>
                  {tx.status === 'PENDENTE' ? (
                    <button onClick={() => payTx.mutate(tx.id)}
                      className="text-xs text-brand-600 hover:underline">Marcar pago</button>
                  ) : (
                    <span className="text-xs text-green-600 flex items-center gap-0.5 justify-end">
                      <Check className="w-3 h-3" /> Pago
                    </span>
                  )}
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-6">Nenhum lançamento encontrado</p>
            )}
          </div>
        </>
      )}

      {tab === 'repasses' && (
        <div className="space-y-2">
          {settlements.map((s: any) => (
            <div key={s.id} className="card p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{s.partner.name}</p>
                <p className="text-xs text-gray-400">
                  {s.surgery?.patient?.name} · {s.commissionType === 'PERCENTUAL' ? `${s.commissionValue}%` : 'Fixo'}
                </p>
                <p className="text-xs text-gray-400">
                  Bruto: {formatCurrency(s.grossAmount)} → Repasse: {formatCurrency(s.commissionAmount)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-red-500">-{formatCurrency(s.commissionAmount)}</p>
                {s.status === 'PENDENTE' ? (
                  <button onClick={() => paySettlement.mutate(s.id)}
                    className="text-xs text-brand-600 hover:underline">Marcar pago</button>
                ) : (
                  <span className="text-xs text-green-600">Pago</span>
                )}
              </div>
            </div>
          ))}
          {settlements.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-6">Nenhum repasse pendente</p>
          )}
        </div>
      )}

      {/* Modal novo lançamento */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-sm space-y-3">
            <h3 className="font-semibold text-gray-900">Novo Lançamento</h3>
            <div className="grid grid-cols-2 gap-2">
              {['ENTRADA', 'SAIDA'].map((t) => (
                <button key={t} onClick={() => setNewTx({ ...newTx, type: t })}
                  className={cn('py-2 rounded-lg text-sm font-medium border transition-colors',
                    newTx.type === t ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-200 text-gray-600')}>
                  {t === 'ENTRADA' ? 'Entrada' : 'Saída'}
                </button>
              ))}
            </div>
            <div>
              <label className="label">Categoria</label>
              <select className="input" value={newTx.category}
                onChange={(e) => setNewTx({ ...newTx, category: e.target.value })}>
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Descrição</label>
              <input className="input" value={newTx.description}
                onChange={(e) => setNewTx({ ...newTx, description: e.target.value })} />
            </div>
            <div>
              <label className="label">Valor (R$)</label>
              <input className="input" type="number" step="0.01" value={newTx.amount}
                onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })} />
            </div>
            <div>
              <label className="label">Vencimento</label>
              <input className="input" type="date" value={newTx.dueDate}
                onChange={(e) => setNewTx({ ...newTx, dueDate: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <button className="btn-outline flex-1" onClick={() => setShowNew(false)}>Cancelar</button>
              <button className="btn-primary flex-1" onClick={() => createTx.mutate()}
                disabled={!newTx.description || !newTx.amount || createTx.isPending}>
                {createTx.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
