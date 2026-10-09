export const validate = (schema) =>{
    return (req,res,next) => {
    const result = schema.safeParse(req.body)
    if(!result.success) {
        const message = result.error.issues
        .map(i => `${i.path.join('.')}: ${i.message}`)
        .join('; ')

        return res.status(400).json({error: message})
    }
    req.body = result.data
    next()
}
} 