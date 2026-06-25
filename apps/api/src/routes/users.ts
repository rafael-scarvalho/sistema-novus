import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { requireAuth } from '../middleware/auth'
import prisma from '../utils/prisma'

const router = Router()
router.use(requireAuth)

// Lista todos os usuários
router.get('/', async (_req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true, role: true,
      active: true, phone: true, specialty: true,
      commissionRate: true, createdAt: true,
    },
    orderBy: { name: 'asc' },
  })
  res.json(users)
})

// Busca um usuário
router.get('/:id', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true, name: true, email: true, role: true,
      active: true, phone: true, specialty: true,
      commissionRate: true, createdAt: true,
    },
  })
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' })
  res.json(user)
})

// Cria usuário
router.post('/', async (req, res) => {
  const { name, email, password, role, phone, specialty, commissionRate } = req.body
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' })
  }
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role, phone, specialty, commissionRate: commissionRate ?? 0 },
    select: { id: true, name: true, email: true, role: true, phone: true, specialty: true, commissionRate: true, active: true },
  })
  res.status(201).json(user)
})

// Atualiza usuário
router.put('/:id', async (req, res) => {
  const { name, email, password, role, phone, specialty, commissionRate, active } = req.body
  const data: Record<string, unknown> = { name, email, role, phone, specialty, active }
  if (commissionRate !== undefined) data.commissionRate = commissionRate
  if (password) data.passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data,
    select: { id: true, name: true, email: true, role: true, phone: true, specialty: true, commissionRate: true, active: true },
  })
  res.json(user)
})

export default router
