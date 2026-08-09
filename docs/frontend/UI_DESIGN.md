# UI Design

## Component Library

PactPay uses Shadcn/ui — accessible, unstyled components built on Radix UI primitives. Components used: Button, Input, Label, Textarea, Card, Badge, Select.

Shadcn components live in `src/components/ui/` and are never modified directly. Styling applied via Tailwind class overrides at the usage site.

---

## Color System

Two main color tokens defined in the Tailwind config and Shadcn theme:

- `bg-primary` — dark green used for sidebar, navbar, dark sections
- `text-accent` — teal/cyan used for logo highlight and key text

Status colors defined as plain objects in each component:

```js
const statusColors = {
  DRAFT: 'bg-slate-100 text-slate-600',
  ACTIVE: 'bg-blue-100 text-blue-600',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-600',
  COMPLETED: 'bg-green-100 text-green-600',
  DISPUTED: 'bg-red-100 text-red-600',
  CANCELLED: 'bg-slate-100 text-slate-400'
}
```

---

## Layout

**Public pages:** full-width with fixed Navbar

**App pages:** sidebar layout
- Sidebar: `fixed top-0 left-0 h-full w-64 z-50` on mobile, `lg:static` on desktop
- Main: `flex-1 lg:ml-64 w-full min-w-0`
- Wrapper: `min-h-screen flex overflow-x-hidden`

---

## Responsive Strategy

Three breakpoints: default (mobile), `sm:` (640px+), `lg:` (1024px+)

Sidebar on mobile is a fixed overlay with dark backdrop. Triggered by hamburger button. Closes on backdrop click or navigation.

```jsx
<aside className={`
  fixed top-0 left-0 h-full w-64 bg-primary flex flex-col z-50
  transition-transform duration-300
  ${open ? 'translate-x-0' : '-translate-x-full'}
  lg:translate-x-0 lg:static lg:z-auto
`}>
```

---

## Animations

Framer Motion used for two types:

**Page load** — elements animate in when page first renders:
```js
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.4 }}
```

**Scroll** — elements animate in when scrolled into view:
```js
initial='hidden'
whileInView='visible'
viewport={{ once: true }}
```

**Stagger** — lists animate in one after another:
```js
const stagger = {
  visible: { transition: { staggerChildren: 0.08 } }
}
```

`once: true` prevents re-animation on scroll out and back in.

Animated pages: Home, Dashboard, ContractDetail, Contracts, Disputes.

Not animated: Login, SignUp, ContractNew, MilestoneDetail, ContractPayment, DisputeDetail. Forms and payment pages should feel fast and focused.

---

## Razorpay Integration

Razorpay loaded as a script tag at runtime — not an npm package:

```js
const script = document.createElement('script')
script.src = 'https://checkout.razorpay.com/v1/checkout.js'
document.body.appendChild(script)
```

Once loaded, `window.Razorpay` is available. Checkout popup opened with `new window.Razorpay(options).open()`. The `handler` callback receives payment response and calls backend verification. Escrow ledger entry only written after verification succeeds.

---

## Component Splitting

Dashboard split into three files for clean separation and independent animation:
- `Sidebar.jsx` — navigation, user info, logout, mobile overlay
- `StatsCard.jsx` — stat calculations and display
- `ContractsList.jsx` — contract rows with progress bars

Rule used: if a section has its own data, logic, or animation, it becomes its own component.