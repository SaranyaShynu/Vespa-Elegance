
const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

const generateInvoice = async (order, filepath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 })

      const dir = path.dirname(filepath)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

      const writeStream = fs.createWriteStream(filepath)
      doc.pipe(writeStream)

      // Header
      doc.fontSize(20).text('Invoice', { align: 'center' })
      doc.moveDown()
      doc.fontSize(12).text(`Order ID: ${order.orderId}`)
      doc.text(`Customer: ${order.user.name}`)
      doc.text(`Email: ${order.user.email}`)
      doc.moveDown()

      // Address
      if (order.address) {
        doc.text('Delivery Address:')
        doc.text(`${order.address.name}`)
        doc.text(`${order.address.street}, ${order.address.city}`)
        doc.text(`${order.address.state}, ${order.address.country} - ${order.address.zip}`)
        doc.moveDown()
      }

      // Products table
      doc.text('Products:')
      order.products.forEach((p, index) => {
        const name = p.productId?.name || 'Unknown Product'
        const price = p.productId?.price || 0
        const quantity = p.quantity || 1
        const total = price * quantity
        doc.text(`${index + 1}. ${name} - ₹${price} × ${quantity} = ₹${total}`)
      })
      doc.moveDown()

      // Totals
      doc.text(`Subtotal: ₹${order.price}`)
      if (order.discount) doc.text(`Discount: ₹${order.discount}`)
      doc.text(`Total: ₹${order.finalPrice}`)
      doc.moveDown()

      // Status
      doc.text(`Payment Method: ${order.paymentMethod}`)
      doc.text(`Payment Status: ${order.paymentStatus}`)
      doc.text(`Order Status: ${order.orderStatus}`)

      doc.end()

      writeStream.on('finish', () => resolve())
      writeStream.on('error', (err) => reject(err))
    } catch (err) {
      reject(err)
    }
  })
}

module.exports = generateInvoice
