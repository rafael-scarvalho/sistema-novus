import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import prisma from '../utils/prisma'
import { requireAuth } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'
const patientsDir = path.join(UPLOAD_DIR, 'patients')
if (!fs.existsSync(patientsDir)) fs.mkdirSync(patientsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, patientsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
  },
})
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true)
    else cb(new Error('Apenas imagens são permitidas'))
  },
})

router.get('/', async (req, res) => {
  const { search } = req.query
  const patients = await prisma.patient.findMany({
    where: search ? {
      OR: [
        { name: { contains: String(search), mode: 'insensitive' } },
        { guardian: { name: { contains: String(search), mode: 'insensitive' } } },
      ]
    } : undefined,
    include: { guardian: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json(patients)
})

router.get('/:id', async (req, res) => {
  const patient = await prisma.patient.findUnique({
    where: { id: req.params.id },
    include: {
      guardian: true,
      surgeries: { orderBy: { scheduledDate: 'desc' }, take: 5 },
      budgets: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  })
  if (!patient) return res.status(404).json({ error: 'Paciente não encontrado' })
  res.json(patient)
})

router.post('/', async (req, res) => {
  const patient = await prisma.patient.create({ data: req.body, include: { guardian: true } })
  res.status(201).json(patient)
})

router.put('/:id', async (req, res) => {
  const patient = await prisma.patient.update({
    where: { id: req.params.id },
    data: req.body,
    include: { guardian: true },
  })
  res.json(patient)
})

// POST /patients/:id/photo — faz upload da foto do paciente
router.post('/:id/photo', upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada' })

  const photoUrl = `uploads/patients/${req.file.filename}`

  // Remove foto anterior se existir
  const existing = await prisma.patient.findUnique({ where: { id: req.params.id }, select: { photoUrl: true } })
  if (existing?.photoUrl) {
    const oldPath = path.join(process.cwd(), existing.photoUrl)
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
  }

  const patient = await prisma.patient.update({
    where: { id: req.params.id },
    data: { photoUrl },
    include: { guardian: true },
  })
  res.json(patient)
})

export default router
