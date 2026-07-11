import { createDispute, getDispute, resolveDispute } from './dispute.service.js'

export const create = async (req,res)=> {
    try {
        const dispute= await createDispute(req.user.id, req.body)
        res.status(201).json(dispute)
    } catch (error){
        res.status(400).json({error: error.message})
    }
}

export const get = async (req,res) => {
    try {
        const dispute = await getDispute(req.params.id, req.user.id)
        res.status(200).json(dispute)
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

export const resolve = async (req, res) => {
  try {
    const dispute = await resolveDispute(req.params.id, req.user.id, req.body)
    res.status(200).json(dispute)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}