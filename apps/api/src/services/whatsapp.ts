const STATUS_EMOJI: Record<string, string> = {
  AGENDADA: '📅',
  CHECKIN_REALIZADO: '✅',
  PREPARACAO_ANESTESICA: '💉',
  EM_CIRURGIA: '🔪',
  RECUPERACAO: '💊',
  INTERNACAO: '🏥',
  ALTA_CONCEDIDA: '🏠',
  CANCELADA: '❌',
}

const PAYMENT_LABELS: Record<string, string> = {
  DINHEIRO: 'Dinheiro', PIX: 'PIX', CARTAO_CREDITO: 'Cartão de Crédito',
  CARTAO_DEBITO: 'Cartão de Débito', BOLETO: 'Boleto', TRANSFERENCIA: 'Transferência', PARCELADO: 'Parcelado',
}

export async function sendWhatsAppBudget(phone: string, guardianName: string, budget: any): Promise<void> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!accessToken || !phoneNumberId) throw new Error('WhatsApp não configurado')

  const cleanPhone = phone.replace(/\D/g, '')
  const internationalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`

  const itemLines = budget.items.map((i: any) =>
    `  • ${i.name}: R$ ${i.total.toFixed(2)}`
  ).join('\n')

  const paymentLines = budget.paymentOptions.map((p: any) => {
    const label = PAYMENT_LABELS[p.method] || p.method
    const inst = p.installments ? ` (${p.installments}x)` : ''
    return `  💳 ${label}${inst}: *R$ ${p.total.toFixed(2)}*`
  }).join('\n')

  const portalUrl = process.env.FRONTEND_URL
    ? `${process.env.FRONTEND_URL}/portal/${budget.patient.guardian.portalToken || ''}`
    : ''

  const body = [
    `📋 *NOVUS Cirurgia Veterinária*`,
    `Olá, ${guardianName}! Segue o orçamento para *${budget.patient.name}*:`,
    '',
    `🔖 *${budget.code}*`,
    '',
    `*Itens:*`,
    itemLines,
    '',
    `*Formas de pagamento:*`,
    paymentLines,
    '',
    `💰 *Total: R$ ${budget.total.toFixed(2)}*`,
    budget.notes ? `\n📝 ${budget.notes}` : '',
    budget.validUntil ? `\n⏰ Válido até: ${new Date(budget.validUntil).toLocaleDateString('pt-BR')}` : '',
    '',
    `Para dúvidas ou aprovação, entre em contato conosco.`,
  ].filter(l => l !== undefined).join('\n')

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: internationalPhone,
        type: 'text',
        text: { body },
      }),
    }
  )
  if (!response.ok) {
    const err = await response.json()
    throw new Error(`WhatsApp API error: ${JSON.stringify(err)}`)
  }
}

export async function sendWhatsAppMeetLink(
  phone: string,
  guardianName: string,
  patientName: string,
  scheduledAt: Date,
  meetLink: string
): Promise<void> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!accessToken || !phoneNumberId) throw new Error('WhatsApp não configurado')

  const cleanPhone = phone.replace(/\D/g, '')
  const internationalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`

  const dateStr = scheduledAt.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const timeStr = scheduledAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const body = [
    `🩺 *NOVUS Cirurgia Veterinária*`,
    `Olá, ${guardianName}! Sua consulta pré-operatória foi agendada.`,
    '',
    `🐾 *Paciente:* ${patientName}`,
    `📅 *Data:* ${dateStr}`,
    `🕐 *Horário:* ${timeStr}`,
    '',
    `📹 *Link da consulta online (Google Meet):*`,
    meetLink,
    '',
    `Clique no link acima no horário agendado para entrar na consulta.`,
    `Em caso de dúvidas, entre em contato conosco.`,
  ].join('\n')

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: internationalPhone,
        type: 'text',
        text: { body },
      }),
    }
  )
  if (!response.ok) {
    const err = await response.json()
    throw new Error(`WhatsApp API error: ${JSON.stringify(err)}`)
  }
}

export async function sendWhatsAppPortalCredentials(
  phone: string,
  guardianName: string,
  username: string,
  password: string
): Promise<void> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!accessToken || !phoneNumberId) return // silencioso se não configurado

  const cleanPhone = phone.replace(/\D/g, '')
  const internationalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
  const portalUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/portal/login` : ''

  const body = [
    `🔐 *NOVUS Cirurgia Veterinária*`,
    `Olá, ${guardianName}! Seu acesso ao Portal do Responsável foi criado.`,
    ``,
    `👤 *Login:* ${username}`,
    `🔑 *Senha:* ${password}`,
    ``,
    portalUrl ? `🌐 *Acesse em:* ${portalUrl}` : '',
    ``,
    `No portal você pode acompanhar orçamentos, laudos e o status das cirurgias de seus pets.`,
    `Em caso de dúvidas, entre em contato conosco.`,
  ].filter(l => l !== undefined).join('\n')

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: internationalPhone,
        type: 'text',
        text: { body },
      }),
    }
  )
  if (!response.ok) console.error('WhatsApp credenciais error:', await response.json())
}

export async function sendWhatsAppStatusMessage(
  phone: string,
  guardianName: string,
  patientName: string,
  status: string,
  message: string
): Promise<void> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!accessToken || !phoneNumberId) throw new Error('WhatsApp não configurado')

  const emoji = STATUS_EMOJI[status] || '📋'
  const cleanPhone = phone.replace(/\D/g, '')
  const internationalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`

  const body = `${emoji} *NOVUS Cirurgia Veterinária*\n\nOlá, ${guardianName}!\n\n*Paciente:* ${patientName}\n*Status:* ${message}\n\nEm caso de dúvidas, entre em contato conosco.`

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: internationalPhone,
        type: 'text',
        text: { body },
      }),
    }
  )

  if (!response.ok) {
    const err = await response.json()
    throw new Error(`WhatsApp API error: ${JSON.stringify(err)}`)
  }
}
