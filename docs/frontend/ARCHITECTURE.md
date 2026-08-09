# Frontend Architecture

## Overview

The frontend is a React SPA built with Vite. No Next.js, no SSR — just a client-side app that talks to the Express backend via Axios. The complexity in this project lives in the backend, not the frontend.

---

## Folder Structure

```
src/
├── pages/
│   ├── auth/
│   │   ├── Login.jsx
│   │   └── SignUp.jsx
│   ├── dashboard/
│   │   ├── Sidebar.jsx
│   │   ├── StatsCard.jsx
│   │   └── ContractsList.jsx
│   ├── Home.jsx
│   ├── Dashboard.jsx
│   ├── Contracts.jsx
│   ├── ContractNew.jsx
│   ├── ContractDetail.jsx
│   ├── MilestoneDetail.jsx
│   ├── ContractPayment.jsx
│   ├── DisputeDetail.jsx
│   └── Disputes.jsx
├── shared/
│   └── Navbar.jsx
├── components/
│   └── ui/          ← Shadcn components
├── assets/
│   └── hero.png
├── App.jsx
└── main.jsx
```

---

## Routing

All routes defined in `App.jsx` using React Router v6. Protected routes use a custom `PrivateRoute` component:

```jsx
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to='/login' />
  return children
}
```

Public routes: `/`, `/login`, `/signup`
Protected routes: all dashboard, contract, dispute pages

---

## State Management

No Redux. State is managed at the component level with `useState` and `useEffect`. Each page fetches its own data on mount.

Auth state (token and user) is stored in localStorage and read directly in components that need it.

---

## API Calls

All API calls use Axios directly in the component. The base URL comes from `import.meta.env.VITE_API_URL`. Token is read from localStorage and passed as Authorization header on every request.

---

## Responsive Design

Three breakpoints:
- Mobile: default (no prefix)
- Tablet: `sm:` (640px+)
- Desktop: `lg:` (1024px+)

The sidebar is the main responsive challenge. On mobile it's hidden and opens as a fixed overlay triggered by a hamburger button. On desktop it's always visible via `lg:translate-x-0`.

Every page that uses Sidebar accepts `open` and `onClose` props to control the mobile drawer state.

Key pattern on every page wrapper:
```jsx
<div className='min-h-screen bg-slate-50 flex overflow-x-hidden'>
  <Sidebar user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
  <main className='flex-1 lg:ml-64 px-4 sm:px-8 py-6 sm:py-8 w-full min-w-0'>
```

---

## Component Philosophy

Components are split into small, independently importable pieces for two reasons:

1. Framer Motion — animations added at component level, smaller components animate independently
2. Readability — Dashboard.jsx is 60 lines because it assembles three components

Dashboard components live in `pages/dashboard/` rather than `components/` because they're tightly coupled to the Dashboard page and not reused elsewhere.