import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../utils/prisma'

const router = Router()

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !await bcrypt.compare(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Credenciais inválidas' })
  }
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '8h' }
  )
  res.json({ accessToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
})

router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({ data: { name, email, passwordHash, role } })
  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role })
})

export default router
