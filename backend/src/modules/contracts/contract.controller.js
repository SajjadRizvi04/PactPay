import { createContract, getContract, updateContractStatus, submitMileStone } from "./contract.service.js";

export const create = async (req,res)=> {
    try {
        const contract = await createContract(req.user.id,req.body)
        res.status(201).json(contract)
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

export const get = async (req,res)=> {
    try {
        const contract = await getContract(req.params.id,req.user.id)
        res.status(201).json(contract)
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

export const updateStatus = async(req,res)=> {
    try {
        const contract = await updateContractStatus(req.params.id, req.user.id, req.body.status)
        res.status(200).json(contract)
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

export const submit = async(req,res)=> {
    try {
        const milestone = await submitMileStone(req.params.contractId, req.params.milestoneId, req.user.id)
        res.status(200).json(milestone)
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}