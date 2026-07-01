export const validate = (schema) =>{
    return (req,res,next) => {
    const result = schema.safeParse(req.body)
    if(!result.success) {
        return res.status(400).json({error: result.error.format()})
    }
    req.body = result.data
    next()
}
} 