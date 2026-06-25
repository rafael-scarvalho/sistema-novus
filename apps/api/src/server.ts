import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server as SocketServer } from 'socket.io'

import authRoutes from './routes/auth'
import patientRoutes from './routes/patients'
import guardianRoutes from './routes/guardians'
import partnerRoutes from './routes/partners'
import catalogRoutes from './routes/catalog'
import budgetRoutes from './routes/budgets'
import surgeryRoutes from './routes/surgeries'
import financialRoutes from './routes/financial'
import portalRoutes from './routes/portal'
import whatsappRoutes from './routes/whatsapp'
import returnRoutes from './routes/returns'
import patientRecordRoutes from './routes/patientRecords'
import consultationRoutes from './routes/consultations'
import portalAuthRoutes from './routes/portalAuth'
import dashboardRoutes from './routes/dashboard'
import govbrRoutes from './routes/govbr'
import userRoutes from './routes/users'
import serviceOrderRoutes from './routes/serviceOrders'

const app = express()
const httpServer = createServer(app)

export const io = new SocketServer(httpServer, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173' },
})

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json())
app.use('/uploads', express.static(process.env.UPLOAD_DIR || './uploads'))

app.use('/api/auth', authRoutes)
app.use('/api/patients', patientRoutes)
app.use('/api/guardians', guardianRoutes)
app.use('/api/partners', partnerRoutes)
app.use('/api/catalog', catalogRoutes)
app.use('/api/budgets', budgetRoutes)
app.use('/api/surgeries', surgeryRoutes)
app.use('/api/financial', financialRoutes)
app.use('/api/portal', portalRoutes)
app.use('/api/whatsapp', whatsappRoutes)
app.use('/api/returns', returnRoutes)
app.use('/api/patients/:patientId/records', patientRecordRoutes)
app.use('/api/consultations', consultationRoutes)
app.use('/api/portal-auth', portalAuthRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/govbr', govbrRoutes)
app.use('/api/users', userRoutes)
app.use('/api/service-orders', serviceOrderRoutes)

io.on('connection', (socket) => {
  socket.on('join:surgery', (surgeryId: string) => {
    socket.join(`surgery:${surgeryId}`)
  })
})

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`🚀 Novus API rodando em http://localhost:${PORT}`)
})
