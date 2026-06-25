import { Router } from 'express'
import crypto from 'crypto'
import prisma from '../utils/prisma'

const router = Router()

const GOVBR_BASE = process.env.GOVBR_ENV === 'production'
  ? 'https://sso.acesso.gov.br'
  : 'https://sso.staging.acesso.gov.br'

const CLIENT_ID     = process.env.GOVBR_CLIENT_ID     || ''
const CLIENT_SECRET = process.env.GOVBR_CLIENT_SECRET || ''
const REDIRECT_URI  = process.env.GOVBR_REDIRECT_URI  || 'http://localhost:3001/api/govbr/callback'
const PORTAL_URL    = process.env.FRONTEND_URL         || 'http://localhost:5173'

// Gera hash SHA-256 do orçamento (identificador único do conteúdo no momento da assinatura)
function hashBudget(budget: any): string {
  const payload = JSON.stringify({
    id: budget.id,
    code: budget.code,
    total: budget.total,
    items: budget.items?.map((i: any) => ({ name: i.name, quantity: i.quantity, unitPrice: i.unitPrice, total: i.total })),
    patientId: budget.patientId,
  })
  return crypto.createHash('sha256').update(payload).digest('hex')
}

// GET /api/govbr/authorize?budgetId=...&portalToken=...
// O portal chama esse endpoint para gerar a URL de redirecionamento ao Gov.br
router.get('/authorize', (req, res) => {
  const { budgetId, portalToken } = req.query
  if (!budgetId || !portalToken) return res.status(400).json({ error: 'budgetId e portalToken obrigatórios' })
  if (!CLIENT_ID) return res.status(503).json({ error: 'Integração Gov.br não configurada. Defina GOVBR_CLIENT_ID no .env' })

  // state codifica o budgetId e portalToken para recuperar após o callback
  const state = Buffer.from(JSON.stringify({ budgetId, portalToken })).toString('base64url')

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: 'openid+profile+email+phone+govbr_confiabilidades',
    redirect_uri: REDIRECT_URI,
    nonce: crypto.randomBytes(16).toString('hex'),
    state,
  })

  res.json({ url: `${GOVBR_BASE}/authorize?${params.toString()}` })
})

// GET /api/govbr/callback — Gov.br redireciona aqui após autenticação
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query

  if (error) {
    return res.redirect(`${PORTAL_URL}/portal/dashboard?govbr_error=${error}`)
  }
  if (!code || !state) {
    return res.redirect(`${PORTAL_URL}/portal/dashboard?govbr_error=missing_params`)
  }

  let budgetId: string
  let portalToken: string
  try {
    const decoded = JSON.parse(Buffer.from(String(state), 'base64url').toString('utf-8'))
    budgetId = decoded.budgetId
    portalToken = decoded.portalToken
  } catch {
    return res.redirect(`${PORTAL_URL}/portal/dashboard?govbr_error=invalid_state`)
  }

  // 1. Troca o code por access_token
  let govbrToken: any
  try {
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
    const tokenRes = await fetch(`${GOVBR_BASE}/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: String(code),
        redirect_uri: REDIRECT_URI,
      }),
    })
    govbrToken = await tokenRes.json()
    if (!govbrToken.access_token) throw new Error('no access_token')
  } catch {
    return res.redirect(`${PORTAL_URL}/portal/dashboard?govbr_error=token_exchange_failed`)
  }

  // 2. Busca dados do usuário (CPF, nome, nível de confiabilidade)
  let userInfo: any
  try {
    const infoRes = await fetch(`${GOVBR_BASE}/userinfo`, {
      headers: { Authorization: `Bearer ${govbrToken.access_token}` },
    })
    userInfo = await infoRes.json()
  } catch {
    return res.redirect(`${PORTAL_URL}/portal/dashboard?govbr_error=userinfo_failed`)
  }

  const govCpf = String(userInfo.sub || userInfo.cpf || '').replace(/\D/g, '')
  const govLevel = userInfo.nivel_conta || userInfo.amr?.[0] || 'bronze'

  if (!govCpf) {
    return res.redirect(`${PORTAL_URL}/portal/dashboard?govbr_error=cpf_not_found`)
  }

  // 3. Valida o portal token e busca o guardian
  let guardianId: string
  try {
    const jwt = await import('jsonwebtoken')
    const JWT_SECRET = process.env.JWT_SECRET || 'novus_jwt_secret_change_in_prod'
    const payload = jwt.default.verify(portalToken, JWT_SECRET) as any
    if (payload.scope !== 'GUARDIAN_PORTAL') throw new Error('invalid scope')
    guardianId = payload.guardianId
  } catch {
    return res.redirect(`${PORTAL_URL}/portal/login?govbr_error=session_expired`)
  }

  // 4. Confirma que o CPF do Gov.br bate com o CPF cadastrado do tutor
  const guardian = await prisma.guardian.findUnique({ where: { id: guardianId } })
  if (!guardian) {
    return res.redirect(`${PORTAL_URL}/portal/login?govbr_error=guardian_not_found`)
  }

  const guardianCpf = (guardian.cpf || '').replace(/\D/g, '')
  if (guardianCpf && govCpf && guardianCpf !== govCpf) {
    return res.redirect(`${PORTAL_URL}/portal/paciente/error?govbr_error=cpf_mismatch`)
  }

  // 5. Busca o orçamento e verifica que pertence ao guardian
  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
    include: {
      patient: true,
      items: true,
    },
  })

  if (!budget) {
    return res.redirect(`${PORTAL_URL}/portal/dashboard?govbr_error=budget_not_found`)
  }
  if (budget.patient.guardianId !== guardianId) {
    return res.redirect(`${PORTAL_URL}/portal/dashboard?govbr_error=unauthorized`)
  }
  if (budget.signedAt) {
    return res.redirect(`${PORTAL_URL}/portal/paciente/${budget.patientId}?tab=orcamentos&govbr=already_signed`)
  }

  // 6. Grava a assinatura
  const docHash = hashBudget(budget)
  await prisma.budget.update({
    where: { id: budgetId },
    data: {
      signedAt: new Date(),
      signedCpf: govCpf,
      signedGovLevel: govLevel,
      signedDocHash: docHash,
      signatureData: JSON.stringify({
        method: 'govbr_oauth2',
        cpf: govCpf,
        name: userInfo.name || userInfo.nome,
        level: govLevel,
        docHash,
        timestamp: new Date().toISOString(),
      }),
    },
  })

  // 7. Redireciona de volta ao portal com sucesso
  res.redirect(`${PORTAL_URL}/portal/paciente/${budget.patientId}?tab=orcamentos&govbr=signed`)
})

export default router
