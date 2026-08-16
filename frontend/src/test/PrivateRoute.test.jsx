import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom'
import { describe, test, expect, beforeEach, afterEach } from 'vitest'

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to='/login' />
  return children
}

const renderWithRouter = (route) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path='/login' element={<div>Login Page</div>} />
        <Route
          path='/dashboard'
          element={
            <PrivateRoute>
              <div>Dashboard Page</div>
            </PrivateRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('PrivateRoute', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  test('redirects to login when no token exists', () => {
    renderWithRouter('/dashboard')
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  test('renders dashboard when token exists', () => {
    localStorage.setItem('token', 'fake-token')
    renderWithRouter('/dashboard')
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument()
  })
})