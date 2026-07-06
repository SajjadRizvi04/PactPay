import { fundEscrow, verifyAndFundEscrow, releasePayment, refundPayment } from './payment.service.js'

export const fundEscrowHandler = async (req, res) => {
  try {
    const order = await fundEscrow(req.user.id, req.body)
    res.status(201).json(order)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

export const verifyAndFundEscrowHandler = async (req, res) => {
  try {
    const result = await verifyAndFundEscrow(req.body)
    res.status(200).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

export const releasePaymentHandler = async (req, res) => {
  try {
    const result = await releasePayment(req.user.id, req.body)
    res.status(200).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

export const refundPaymentHandler = async (req, res) => {
  try {
    const result = await refundPayment(req.user.id, req.body)
    res.status(200).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}