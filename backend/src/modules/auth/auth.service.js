import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../../db/client.js'
import config from '../../config/index.js'



export const registerUser = async ({name,email,password,role})=> {
    const existing = await prisma.user.findUnique({
        where: {
            email
        }
    }) 
    if(existing) throw new Error('Email already in use')
        const hashedPassword = await bcrypt.hash(password,10)
    
    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role
        }
    })
    return {id : user.id, name: user.name, email: user.email, role: user.role}

}

export const loginUser = async ({email,password}) => {
    const user = await prisma.user.findUnique({
        where: {email}
    })
    if(!user) throw new Error('Invalid Credentials')

    const valid = await bcrypt.compare(password,user.password)
    if(!valid) throw new Error('Invalid credentials')

    const token = jwt.sign({
        id: user.id,
        role: user.role
    }, config.JWT_SECRET,{expiresIn: '7d'})

    return {token, user: {id: user.id, name: user.name, email: user.email, role: user.role}}
}