import { Router } from 'express'
import prisma from '../utils/prisma'
import { requireAuth } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  const { category } = req.query
  const items = await prisma.catalogItem.findMany({
    where: {
      active: true,
      ...(category ? { category: category as any } : {}),
    },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })
  res.json(items)
})

router.post('/', async (req, res) => {
  const item = await prisma.catalogItem.create({ data: req.body })
  res.status(201).json(item)
})

router.put('/:id', async (req, res) => {
  const item = await prisma.catalogItem.update({ where: { id: req.params.id }, data: req.body })
  res.json(item)
})

router.delete('/:id', async (req, res) => {
  await prisma.catalogItem.update({ where: { id: req.params.id }, data: { active: false } })
  res.status(204).end()
})

export default router
