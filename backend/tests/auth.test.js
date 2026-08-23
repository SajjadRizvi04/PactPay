import { describe, test, expect, vi, beforeEach } from 'vitest'

vi.mock('../src/db/client.js', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn()
    }
  }
}))

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn()
  }
}))

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn()
  }
}))

import prisma from '../src/db/client.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { registerUser, loginUser } from '../src/modules/auth/auth.service.js'

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('registerUser', () => {
    test('throws error if email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@test.com' })
      await expect(registerUser({
        name: 'Sajjad',
        email: 'test@test.com',
        password: '123456',
        role: 'CLIENT'
      })).rejects.toThrow('Email already in use')
    })

    test('hashes password before saving', async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      bcrypt.hash.mockResolvedValue('hashed-password')
      prisma.user.create.mockResolvedValue({
        id: '1',
        name: 'Sajjad',
        email: 'test@test.com',
        role: 'CLIENT'
      })

      await registerUser({
        name: 'Sajjad',
        email: 'test@test.com',
        password: '123456',
        role: 'CLIENT'
      })

      expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10)
    })

    test('never returns password in response', async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      bcrypt.hash.mockResolvedValue('hashed-password')
      prisma.user.create.mockResolvedValue({
        id: '1',
        name: 'Sajjad',
        email: 'test@test.com',
        role: 'CLIENT'
      })

      const result = await registerUser({
        name: 'Sajjad',
        email: 'test@test.com',
        password: '123456',
        role: 'CLIENT'
      })

      expect(result.password).toBeUndefined()
    })

    test('returns user without password on success', async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      bcrypt.hash.mockResolvedValue('hashed-password')
      prisma.user.create.mockResolvedValue({
        id: '1',
        name: 'Sajjad',
        email: 'test@test.com',
        role: 'CLIENT'
      })

      const result = await registerUser({
        name: 'Sajjad',
        email: 'test@test.com',
        password: '123456',
        role: 'CLIENT'
      })

      expect(result).toEqual({
        id: '1',
        name: 'Sajjad',
        email: 'test@test.com',
        role: 'CLIENT'
      })
    })
  })

  describe('loginUser', () => {
    test('throws error if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      await expect(loginUser({
        email: 'notfound@test.com',
        password: '123456'
      })).rejects.toThrow('Invalid Credentials')
    })

    test('throws error if password is wrong', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        password: 'hashed-password',
        role: 'CLIENT'
      })
      bcrypt.compare.mockResolvedValue(false)

      await expect(loginUser({
        email: 'test@test.com',
        password: 'wrongpassword'
      })).rejects.toThrow('Invalid Credentials')
    })

    test('returns same error for wrong email and wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      const error1 = await loginUser({
        email: 'wrong@test.com',
        password: '123456'
      }).catch(e => e.message)

      prisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        password: 'hashed',
        role: 'CLIENT'
      })
      bcrypt.compare.mockResolvedValue(false)
      const error2 = await loginUser({
        email: 'test@test.com',
        password: 'wrong'
      }).catch(e => e.message)

      expect(error1).toBe(error2)
    })

    test('returns token and user on success', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: '1',
        name: 'Sajjad',
        email: 'test@test.com',
        password: 'hashed-password',
        role: 'CLIENT'
      })
      bcrypt.compare.mockResolvedValue(true)
      jwt.sign.mockReturnValue('fake-jwt-token')

      const result = await loginUser({
        email: 'test@test.com',
        password: '123456'
      })

      expect(result.token).toBe('fake-jwt-token')
      expect(result.user.email).toBe('test@test.com')
    })

    test('never returns password in login response', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: '1',
        name: 'Sajjad',
        email: 'test@test.com',
        password: 'hashed-password',
        role: 'CLIENT'
      })
      bcrypt.compare.mockResolvedValue(true)
      jwt.sign.mockReturnValue('fake-jwt-token')

      const result = await loginUser({
        email: 'test@test.com',
        password: '123456'
      })

      expect(result.user.password).toBeUndefined()
    })
  })
})