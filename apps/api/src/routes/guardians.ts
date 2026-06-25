import { Router } from 'express'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import prisma from '../utils/prisma'
import { requireAuth } from '../middleware/auth'
import { sendWhatsAppPortalCredentials } from '../services/whatsapp'

const router = Router()
router.use(requireAuth)

function generateUsername(name: string, cpf?: string | null): string {
  if (cpf) return cpf.replace(/\D/g, '').slice(0, 11)
  const clean = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '.').replace(/[^a-z.]/g, '')
  const suffix = randomBytes(2).toString('hex')
  return `${clean.slice(0, 15)}.${suffix}`
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

router.get('/', async (req, res) => {
  const { search } = req.query
  const guardians = await prisma.guardian.findMany({
    where: search ? {
      OR: [
        { name: { contains: String(search), mode: 'insensitive' } },
        { phone: { contains: String(search) } },
        { cpf: { contains: String(search) } },
      ]
    } : undefined,
    include: { patients: true },
    orderBy: { name: 'asc' },
  })
  res.json(guardians)
})

router.post('/', async (req, res) => {
  const { name, cpf, ...rest } = req.body

  const rawPassword = generatePassword()
  const username = generateUsername(name, cpf)
  const passwordHash = await bcrypt.hash(rawPassword, 10)

  const guardian = await prisma.guardian.create({
    data: { name, cpf, ...rest, portalUsername: username, portalPasswordHash: passwordHash },
  })

  res.status(201).json({ ...guardian, portalPasswordPlain: rawPassword })
})

router.put('/:id', async (req, res) => {
  const { portalPasswordHash, ...data } = req.body
  const guardian = await prisma.guardian.update({ where: { id: req.params.id }, data })
  res.json(guardian)
})

// Resetar (ou gerar) senha do portal
router.post('/:id/reset-password', async (req, res) => {
  const existing = await prisma.guardian.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Tutor não encontrado' })

  const rawPassword = generatePassword()
  const passwordHash = await bcrypt.hash(rawPassword, 10)

  // Gera username se ainda não tem
  const username = existing.portalUsername || generateUsername(existing.name, existing.cpf)

  const guardian = await prisma.guardian.update({
    where: { id: req.params.id },
    data: { portalPasswordHash: passwordHash, portalUsername: username, portalActive: true },
  })
  res.json({ username: guardian.portalUsername, password: rawPassword })
})

// Enviar credenciais do portal por WhatsApp
router.post('/:id/send-portal-credentials', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'Credenciais obrigatórias' })

  const guardian = await prisma.guardian.findUnique({ where: { id: req.params.id } })
  if (!guardian) return res.status(404).json({ error: 'Tutor não encontrado' })

  const phone = guardian.whatsapp || guardian.phone
  if (!phone) return res.status(400).json({ error: 'Tutor sem telefone cadastrado' })

  await sendWhatsAppPortalCredentials(phone, guardian.name, username, password)
  res.json({ sent: true })
})

// Ativar / desativar acesso ao portal
router.patch('/:id/portal-access', async (req, res) => {
  const { active } = req.body
  const guardian = await prisma.guardian.update({
    where: { id: req.params.id },
    data: { portalActive: active },
  })
  res.json(guardian)
})

// Legado: token de link direto
router.post('/:id/portal-token', async (req, res) => {
  const token = randomBytes(32).toString('hex')
  const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  const guardian = await prisma.guardian.update({
    where: { id: req.params.id },
    data: { portalToken: token, portalTokenExpiry: expiry },
  })
  const portalUrl = `${process.env.FRONTEND_URL}/portal/${token}`
  res.json({ token, portalUrl, expiresAt: expiry })
})

export default router
