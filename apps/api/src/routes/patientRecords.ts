import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import prisma from '../utils/prisma'
import { requireAuth } from '../middleware/auth'

const router = Router({ mergeParams: true })
router.use(requireAuth)

const upload = multer({
  dest: process.env.UPLOAD_DIR || './uploads',
  limits: { fileSize: 20 * 1024 * 1024 },
})

router.get('/', async (req, res) => {
  const records = await prisma.patientRecord.findMany({
    where: { patientId: req.params.patientId },
    orderBy: { createdAt: 'desc' },
  })
  res.json(records)
})

router.post('/', async (req, res) => {
  const record = await prisma.patientRecord.create({
    data: { ...req.body, patientId: req.params.patientId },
  })
  res.status(201).json(record)
})

router.delete('/:recordId', async (req, res) => {
  await prisma.patientRecord.delete({ where: { id: req.params.recordId } })
  res.status(204).end()
})

router.post('/files', upload.array('files', 10), async (req, res) => {
  const { type } = req.query
  const files = (req.files as Express.Multer.File[])
  const records = await Promise.all(files.map(f =>
    prisma.patientRecord.create({
      data: {
        patientId: req.params.patientId,
        type: String(type) as any,
        title: f.originalname,
        content: '',
        fileUrl: `/uploads/${f.filename}`,
      },
    })
  ))
  res.status(201).json(records)
})

export default router
