import { Router } from 'express'
import prisma from '../utils/prisma'
import { requireAuth } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  const partners = await prisma.partner.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  })
  res.json(partners)
})

router.post('/', async (req, res) => {
  const partner = await prisma.partner.create({ data: req.body })
  res.status(201).json(partner)
})

router.put('/:id', async (req, res) => {
  const partner = await prisma.partner.update({ where: { id: req.params.id }, data: req.body })
  res.json(partner)
})

router.get('/:id/settlements', async (req, res) => {
  const settlements = await prisma.partnerSettlement.findMany({
    where: { partnerId: req.params.id },
    include: { surgery: { include: { patient: true } } },
    orderBy: { createdAt: 'desc' },
  })
  res.json(settlements)
})

export default router
