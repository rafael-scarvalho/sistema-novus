import PDFDocument from 'pdfkit'

const PAYMENT_LABELS: Record<string, string> = {
  DINHEIRO: 'Dinheiro',
  PIX: 'PIX',
  CARTAO_CREDITO: 'Cartão de Crédito',
  CARTAO_DEBITO: 'Cartão de Débito',
  BOLETO: 'Boleto',
  TRANSFERENCIA: 'Transferência Bancária',
  PARCELADO: 'Parcelado',
}

export async function generateBudgetPdf(budget: any): Promise<PDFKit.PDFDocument> {
  const doc = new PDFDocument({ margin: 50 })

  // Cabeçalho
  doc.fontSize(20).font('Helvetica-Bold').text('NOVUS', { align: 'center' })
  doc.fontSize(10).font('Helvetica').text('Cirurgia Veterinária Avançada & Videolaparoscopia', { align: 'center' })
  doc.moveDown()
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()
  doc.moveDown()

  // Informações do orçamento
  doc.fontSize(14).font('Helvetica-Bold').text(`ORÇAMENTO ${budget.code}`)
  doc.fontSize(10).font('Helvetica')
  doc.text(`Data: ${new Date(budget.createdAt).toLocaleDateString('pt-BR')}`)
  if (budget.validUntil) {
    doc.text(`Válido até: ${new Date(budget.validUntil).toLocaleDateString('pt-BR')}`)
  }
  doc.moveDown()

  // Paciente e tutor
  doc.fontSize(12).font('Helvetica-Bold').text('PACIENTE')
  doc.fontSize(10).font('Helvetica')
  doc.text(`Nome: ${budget.patient.name}`)
  doc.text(`Espécie/Raça: ${budget.patient.species}${budget.patient.breed ? ` - ${budget.patient.breed}` : ''}`)
  doc.text(`Tutor: ${budget.patient.guardian.name}`)
  doc.text(`Telefone: ${budget.patient.guardian.phone}`)
  if (budget.partner) {
    doc.text(`Clínica/Parceiro: ${budget.partner.name}`)
  }
  doc.moveDown()

  // Itens
  doc.fontSize(12).font('Helvetica-Bold').text('ITENS DO ORÇAMENTO')
  doc.moveDown(0.5)

  // Cabeçalho da tabela
  doc.fontSize(9).font('Helvetica-Bold')
  doc.text('Item', 50, doc.y, { width: 240, continued: true })
  doc.text('Qtd', { width: 50, align: 'center', continued: true })
  doc.text('Valor Unit.', { width: 100, align: 'right', continued: true })
  doc.text('Desconto', { width: 80, align: 'right', continued: true })
  doc.text('Total', { width: 80, align: 'right' })
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()

  doc.font('Helvetica').fontSize(9)
  for (const item of budget.items) {
    const y = doc.y + 2
    doc.text(item.name, 50, y, { width: 240, continued: true })
    doc.text(String(item.quantity), { width: 50, align: 'center', continued: true })
    doc.text(formatCurrency(item.unitPrice), { width: 100, align: 'right', continued: true })
    doc.text(formatCurrency(item.discount || 0), { width: 80, align: 'right', continued: true })
    doc.text(formatCurrency(item.total), { width: 80, align: 'right' })
  }

  doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).stroke()
  doc.moveDown()

  // Totais
  doc.fontSize(10).font('Helvetica')
  doc.text(`Subtotal: ${formatCurrency(budget.subtotal)}`, { align: 'right' })
  if (budget.discount > 0) {
    doc.text(`Desconto: -${formatCurrency(budget.discount)}`, { align: 'right' })
  }
  doc.fontSize(12).font('Helvetica-Bold')
  doc.text(`TOTAL: ${formatCurrency(budget.total)}`, { align: 'right' })
  doc.moveDown()

  // Formas de pagamento
  if (budget.paymentOptions.length > 0) {
    doc.fontSize(12).font('Helvetica-Bold').text('FORMAS DE PAGAMENTO')
    doc.moveDown(0.5)
    for (const option of budget.paymentOptions) {
      const label = PAYMENT_LABELS[option.method] || option.method
      const installmentInfo = option.installments ? ` (${option.installments}x)` : ''
      const discountInfo = option.discount ? ` - ${option.discount}% desconto` : ''
      doc.fontSize(10).font('Helvetica')
      doc.text(`• ${label}${installmentInfo}${discountInfo}: ${formatCurrency(option.total)}`)
      if (option.notes) doc.text(`  ${option.notes}`, { indent: 10 })
    }
    doc.moveDown()
  }

  // Observações
  if (budget.notes) {
    doc.fontSize(12).font('Helvetica-Bold').text('OBSERVAÇÕES')
    doc.fontSize(10).font('Helvetica').text(budget.notes)
  }

  // Rodapé
  doc.moveDown(2)
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()
  doc.fontSize(8).font('Helvetica').text(
    'Este orçamento é válido pelo prazo indicado. Para aprovação, entre em contato conosco.',
    { align: 'center' }
  )

  doc.end()
  return doc
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
