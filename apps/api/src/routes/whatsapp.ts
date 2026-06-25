import { Router } from 'express'

const router = Router()

// Webhook de verificação do Meta
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    res.status(200).send(challenge)
  } else {
    res.sendStatus(403)
  }
})

// Webhook de mensagens recebidas (para futuras respostas dos tutores)
router.post('/webhook', (req, res) => {
  console.log('WhatsApp webhook:', JSON.stringify(req.body))
  res.sendStatus(200)
})

export default router
