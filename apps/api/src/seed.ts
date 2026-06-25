import 'dotenv/config'
import bcrypt from 'bcryptjs'
import prisma from './utils/prisma'

async function main() {
  // Usuário admin
  const passwordHash = await bcrypt.hash('novus2024', 10)
  await prisma.user.upsert({
    where: { email: 'admin@novusvet.com' },
    update: {},
    create: { name: 'Administrador', email: 'admin@novusvet.com', passwordHash, role: 'ADMIN' },
  })

  // Catálogo inicial de itens
  const items = [
    { name: 'Videolaparoscopia Diagnóstica', category: 'PROCEDIMENTO_CIRURGICO', unitPrice: 1800, unit: 'procedimento' },
    { name: 'Videolaparoscopia Cirúrgica', category: 'PROCEDIMENTO_CIRURGICO', unitPrice: 3500, unit: 'procedimento' },
    { name: 'Ovariossalpingohisterectomia Laparoscópica', category: 'PROCEDIMENTO_CIRURGICO', unitPrice: 2800, unit: 'procedimento' },
    { name: 'Orquiectomia Laparoscópica', category: 'PROCEDIMENTO_CIRURGICO', unitPrice: 2200, unit: 'procedimento' },
    { name: 'Colecistectomia Laparoscópica', category: 'PROCEDIMENTO_CIRURGICO', unitPrice: 4500, unit: 'procedimento' },
    { name: 'Biópsia Laparoscópica', category: 'PROCEDIMENTO_CIRURGICO', unitPrice: 1500, unit: 'procedimento' },
    { name: 'Anestesia Geral Inalatória', category: 'ANESTESIA', unitPrice: 600, unit: 'procedimento' },
    { name: 'MPA (Medicação Pré-Anestésica)', category: 'ANESTESIA', unitPrice: 150, unit: 'protocolo' },
    { name: 'Fluidoterapia', category: 'ANESTESIA', unitPrice: 80, unit: 'dia' },
    { name: 'Kit Laparoscopia Descartável', category: 'MATERIAL', unitPrice: 350, unit: 'kit' },
    { name: 'Fio de sutura (monocryl 3-0)', category: 'MATERIAL', unitPrice: 45, unit: 'un' },
    { name: 'Dipirona 500mg/ml', category: 'MEDICAMENTO', unitPrice: 25, unit: 'ampola' },
    { name: 'Meloxicam 0,5mg/ml', category: 'MEDICAMENTO', unitPrice: 35, unit: 'frasco' },
    { name: 'Hemograma Completo', category: 'EXAME', unitPrice: 90, unit: 'exame' },
    { name: 'Bioquímico (perfil pré-cirúrgico)', category: 'EXAME', unitPrice: 180, unit: 'painel' },
    { name: 'Ultrassonografia Abdominal', category: 'EXAME', unitPrice: 220, unit: 'exame' },
    { name: 'Consultoria Técnica Cirúrgica', category: 'CONSULTORIA', unitPrice: 500, unit: 'h' },
  ]

  for (const item of items) {
    await prisma.catalogItem.upsert({
      where: { id: item.name.toLowerCase().replace(/\s+/g, '-') },
      update: { unitPrice: item.unitPrice },
      create: { id: item.name.toLowerCase().replace(/\s+/g, '-'), ...item as any },
    })
  }

  console.log('✅ Seed concluído!')
  console.log('📧 Login: admin@novusvet.com')
  console.log('🔑 Senha: novus2024')
}

main().catch(console.error).finally(() => prisma.$disconnect())
