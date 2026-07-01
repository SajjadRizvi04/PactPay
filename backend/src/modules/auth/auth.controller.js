import { registerUser, loginUser } from "./auth.service.js"

export const register = async (req,res) => {
    try {
        const result = await registerUser(req.body)
        res.status(201).json(result)
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

export const login = async (req,res) => {
    try {
        const result = await loginUser(req.body)
        res.status(200).json(result)
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}