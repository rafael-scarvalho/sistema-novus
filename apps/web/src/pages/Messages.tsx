import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { cn } from '../lib/utils'
import {
  Send, Search, MessageCircle, Clock, CheckCheck, Check,
  User, Scissors, Calendar, RotateCcw, ChevronRight, Wifi, WifiOff,
} from 'lucide-react'

// ── Respostas rápidas ────────────────────────────────────────────────────────
const QUICK_REPLIES = [
  { label: 'Confirmar consulta', text: 'Olá! Confirmo sua consulta agendada. Qualquer dúvida estamos à disposição. 🩺' },
  { label: 'Exames prontos', text: 'Olá! Os resultados dos exames do seu pet já estão disponíveis no portal. Acesse para visualizar. 📋' },
  { label: 'Cirurgia concluída', text: 'Olá! A cirurgia foi concluída com sucesso. Em breve atualizaremos o status no portal. 🐾' },
  { label: 'Aguardar retorno', text: 'Olá! Recebemos sua mensagem e retornaremos em breve. Obrigado pela compreensão! 😊' },
  { label: 'Solicitar exames', text: 'Olá! Para prosseguir com o agendamento, precisamos dos resultados dos exames pré-operatórios. Podemos ajudá-lo com a solicitação?' },
  { label: 'Confirmar alta', text: 'Ótima notícia! Seu pet recebeu alta e está liberado para ir para casa. Siga as instruções de cuidado pós-operatório. 🏠' },
]

// ── Dados simulados (substituídos pelo webhook quando WhatsApp estiver ativo) ─
const MOCK_CONVERSATIONS = [
  {
    id: '1', guardianName: 'Maria Silva', phone: '11999990001',
    lastMessage: 'Boa tarde! Queria saber como está o Rex após a cirurgia', lastAt: new Date(Date.now() - 5 * 60000),
    unread: 2, status: 'open', patientName: 'Rex', patientSpecies: 'CANINO',
    surgeryStatus: 'RECUPERACAO', nextReturn: new Date(Date.now() + 3 * 24 * 3600000),
    messages: [
      { id: 'm1', from: 'guardian', text: 'Boa tarde! Queria saber como está o Rex após a cirurgia', at: new Date(Date.now() - 25 * 60000) },
      { id: 'm2', from: 'guardian', text: 'Podem me dar um retorno?', at: new Date(Date.now() - 5 * 60000) },
    ],
  },
  {
    id: '2', guardianName: 'João Pereira', phone: '11999990002',
    lastMessage: 'Obrigado pela atenção! Até amanhã', lastAt: new Date(Date.now() - 2 * 3600000),
    unread: 0, status: 'resolved', patientName: 'Mia', patientSpecies: 'FELINO',
    surgeryStatus: 'ALTA_CONCEDIDA', nextReturn: null,
    messages: [
      { id: 'm3', from: 'team', text: 'Olá João! A Mia está se recuperando muito bem. Alta concedida! 🏠', at: new Date(Date.now() - 3 * 3600000) },
      { id: 'm4', from: 'guardian', text: 'Que alívio! Muito obrigado pela atenção de toda a equipe', at: new Date(Date.now() - 2.5 * 3600000) },
      { id: 'm5', from: 'guardian', text: 'Obrigado pela atenção! Até amanhã', at: new Date(Date.now() - 2 * 3600000) },
    ],
  },
  {
    id: '3', guardianName: 'Ana Costa', phone: '11999990003',
    lastMessage: 'Os exames ficam prontos até quando?', lastAt: new Date(Date.now() - 24 * 3600000),
    unread: 1, status: 'open', patientName: 'Bob', patientSpecies: 'CANINO',
    surgeryStatus: 'AGENDADA', nextReturn: null,
    messages: [
      { id: 'm6', from: 'guardian', text: 'Boa tarde! Fiz os exames do Bob ontem.', at: new Date(Date.now() - 25 * 3600000) },
      { id: 'm7', from: 'team', text: 'Olá Ana! Os resultados ficam disponíveis em até 48h. Iremos analisar e entrar em contato. 🔬', at: new Date(Date.now() - 24.5 * 3600000) },
      { id: 'm8', from: 'guardian', text: 'Os exames ficam prontos até quando?', at: new Date(Date.now() - 24 * 3600000) },
    ],
  },
]

const STATUS_LABEL: Record<string, string> = {
  AGENDADA: 'Cirurgia agendada', CHECKIN_REALIZADO: 'Check-in realizado',
  PREPARACAO_ANESTESICA: 'Prep. anestésica', EM_CIRURGIA: 'Em cirurgia',
  RECUPERACAO: 'Recuperação', INTERNACAO: 'Internação',
  ALTA_CONCEDIDA: 'Alta concedida', CANCELADA: 'Cancelada',
}
const STATUS_COLOR: Record<string, string> = {
  AGENDADA: 'bg-blue-100 text-blue-700', RECUPERACAO: 'bg-orange-100 text-orange-700',
  INTERNACAO: 'bg-pink-100 text-pink-700', ALTA_CONCEDIDA: 'bg-green-100 text-green-700',
  EM_CIRURGIA: 'bg-red-100 text-red-700', AGENDADA2: 'bg-blue-100 text-blue-700',
}

function formatTime(date: Date) {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 60000) return 'agora'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}min`
  if (diff < 86400000) return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export default function MessagesPage() {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string>(MOCK_CONVERSATIONS[0].id)
  const [input, setInput] = useState('')
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS)
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all')

  const whatsappConfigured = !!(
    import.meta.env.VITE_WHATSAPP_CONFIGURED === 'true' ||
    false // muda para true quando WhatsApp estiver ativo
  )

  const selected = conversations.find(c => c.id === selectedId)!

  const filtered = conversations.filter(c => {
    const matchSearch = c.guardianName.toLowerCase().includes(search.toLowerCase()) ||
      c.patientName.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || c.status === filter
    return matchSearch && matchFilter
  })

  const totalUnread = conversations.reduce((acc, c) => acc + c.unread, 0)

  function sendMessage(text: string) {
    if (!text.trim()) return
    setConversations(prev => prev.map(c => {
      if (c.id !== selectedId) return c
      return {
        ...c,
        lastMessage: text,
        lastAt: new Date(),
        messages: [...c.messages, { id: Date.now().toString(), from: 'team', text, at: new Date() }],
      }
    }))
    setInput('')
  }

  function markResolved() {
    setConversations(prev => prev.map(c =>
      c.id === selectedId ? { ...c, status: 'resolved', unread: 0 } : c
    ))
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-0 -m-4 lg:-m-6">
      {/* Banner quando WhatsApp não configurado */}
      {!whatsappConfigured && (
        <div className="mx-4 lg:mx-6 mt-4 lg:mt-6 mb-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <WifiOff className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">WhatsApp não conectado</p>
            <p className="text-xs text-amber-600 mt-0.5">
              As mensagens abaixo são uma prévia. Configure o WhatsApp Business para ativar o chat em tempo real.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-1 min-h-0 mx-4 lg:mx-6 mb-4 lg:mb-6 gap-4">
        {/* ── Lista de conversas ───────────────────────────────────────────── */}
        <div className="w-80 shrink-0 flex flex-col card overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-card-border)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>Mensagens</h2>
                {totalUnread > 0 && (
                  <span className="bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {totalUnread}
                  </span>
                )}
              </div>
              <div className={cn('flex items-center gap-1 text-xs font-medium', whatsappConfigured ? 'text-green-600' : 'text-gray-400')}>
                {whatsappConfigured ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {whatsappConfigured ? 'Conectado' : 'Offline'}
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input className="input pl-8 text-xs py-1.5" placeholder="Buscar conversa..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {/* Filtros */}
            <div className="flex gap-1 mt-2">
              {(['all', 'open', 'resolved'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={cn('flex-1 text-xs py-1 rounded-lg font-medium transition',
                    filter === f ? 'bg-green-500 text-white' : 'text-gray-500 hover:bg-gray-100')}>
                  {f === 'all' ? 'Todas' : f === 'open' ? 'Abertas' : 'Resolvidas'}
                </button>
              ))}
            </div>
          </div>

          {/* Conversas */}
          <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: 'var(--color-card-border)' }}>
            {filtered.length === 0 && (
              <div className="py-12 text-center">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-400">Nenhuma conversa</p>
              </div>
            )}
            {filtered.map(conv => (
              <button key={conv.id} onClick={() => { setSelectedId(conv.id); setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread: 0 } : c)) }}
                className={cn('w-full text-left px-4 py-3 transition-colors hover:bg-gray-50',
                  selectedId === conv.id && 'bg-green-50 border-l-2 border-green-500')}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                    {conv.guardianName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                        {conv.guardianName}
                      </p>
                      <span className="text-xs text-gray-400 shrink-0 ml-1">{formatTime(conv.lastAt)}</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-0.5">🐾 {conv.patientName}</p>
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
                      {conv.unread > 0 && (
                        <span className="bg-green-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center shrink-0">
                          {conv.unread}
                        </span>
                      )}
                      {conv.unread === 0 && conv.status === 'resolved' && (
                        <CheckCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Área de chat ─────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col card overflow-hidden min-w-0">
          {/* Header do chat */}
          <div className="px-4 py-3 border-b flex items-center gap-3" style={{ borderColor: 'var(--color-card-border)' }}>
            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold shrink-0">
              {selected.guardianName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{selected.guardianName}</p>
              <p className="text-xs text-gray-400">{selected.phone} · 🐾 {selected.patientName}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', selected.status === 'resolved' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700')}>
                {selected.status === 'resolved' ? 'Resolvida' : 'Aberta'}
              </span>
              {selected.status === 'open' && (
                <button onClick={markResolved}
                  className="text-xs px-2 py-1 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition">
                  Marcar resolvida
                </button>
              )}
            </div>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ backgroundColor: 'var(--color-bg)' }}>
            {selected.messages.map(msg => (
              <div key={msg.id} className={cn('flex', msg.from === 'team' ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm',
                  msg.from === 'team'
                    ? 'bg-green-500 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100')}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <p className={cn('text-[10px] mt-1 text-right', msg.from === 'team' ? 'text-green-100' : 'text-gray-400')}>
                    {formatTime(msg.at)}
                    {msg.from === 'team' && <CheckCheck className="w-3 h-3 inline ml-1" />}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Respostas rápidas */}
          <div className="px-4 py-2 border-t overflow-x-auto" style={{ borderColor: 'var(--color-card-border)' }}>
            <div className="flex gap-2 w-max">
              {QUICK_REPLIES.map(r => (
                <button key={r.label} onClick={() => sendMessage(r.text)}
                  className="shrink-0 text-xs px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full hover:bg-green-100 transition whitespace-nowrap">
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t flex gap-2 items-end" style={{ borderColor: 'var(--color-card-border)' }}>
            <textarea
              rows={1}
              className="input resize-none flex-1 leading-relaxed"
              placeholder="Digite sua mensagem..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              className="shrink-0 w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-xl flex items-center justify-center transition disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Painel de contexto do paciente ───────────────────────────────── */}
        <div className="w-64 shrink-0 flex flex-col gap-3">
          {/* Card do paciente */}
          <div className="card p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Paciente</p>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
                {selected.patientSpecies === 'FELINO' ? '🐱' : '🐶'}
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{selected.patientName}</p>
                <p className="text-xs text-gray-400">{selected.patientSpecies === 'FELINO' ? 'Felino' : 'Canino'}</p>
              </div>
            </div>
            {selected.surgeryStatus && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Status cirurgia</p>
                <span className={cn('text-xs px-2 py-1 rounded-full font-medium', STATUS_COLOR[selected.surgeryStatus] || 'bg-gray-100 text-gray-500')}>
                  {STATUS_LABEL[selected.surgeryStatus] || selected.surgeryStatus}
                </span>
              </div>
            )}
            {selected.nextReturn && (
              <div className="bg-teal-50 rounded-lg p-2">
                <p className="text-xs text-teal-600 font-medium flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" /> Retorno agendado
                </p>
                <p className="text-xs text-teal-700 mt-0.5">
                  {selected.nextReturn.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                </p>
              </div>
            )}
          </div>

          {/* Ações rápidas */}
          <div className="card p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ações rápidas</p>
            <Link to="/pacientes" className="flex items-center justify-between text-sm py-2 text-gray-600 hover:text-gray-900 transition">
              <span className="flex items-center gap-2"><User className="w-4 h-4 text-purple-400" /> Ver ficha</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            </Link>
            <Link to="/cirurgias" className="flex items-center justify-between text-sm py-2 text-gray-600 hover:text-gray-900 transition border-t" style={{ borderColor: 'var(--color-card-border)' }}>
              <span className="flex items-center gap-2"><Scissors className="w-4 h-4 text-red-400" /> Ver cirurgia</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            </Link>
            <Link to="/agenda" className="flex items-center justify-between text-sm py-2 text-gray-600 hover:text-gray-900 transition border-t" style={{ borderColor: 'var(--color-card-border)' }}>
              <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-400" /> Agendar consulta</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            </Link>
          </div>

          {/* Info do tutor */}
          <div className="card p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Tutor</p>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{selected.guardianName}</p>
            <p className="text-xs text-gray-400">{selected.phone}</p>
            <div className="flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3 text-gray-400" />
              <p className="text-xs text-gray-400">Última mensagem: {formatTime(selected.lastAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
