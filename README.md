# PactPay

An AI-powered escrow platform for freelancers and clients. The core idea is simple — freelancers and clients don't trust each other, and for good reason. Clients worry the freelancer will take money and disappear. Freelancers worry the client will reject good work and refuse to pay. PactPay holds funds in escrow and uses AI to assess whether milestone work is actually complete before any payment is released.

This is my main portfolio project, built while learning backend architecture, financial systems, and AI integration.

---

## What it does

- Client creates a contract with milestones — each with a title, description, amount, and due date
- Client funds the escrow via Razorpay — money is held until work is verified
- Freelancer submits each milestone with notes and a link to their work
- Gemini AI assesses the submission against the milestone requirements
- If AI recommends approval, client gets notified to confirm the release
- If AI recommends changes, freelancer is notified to fix the work
- If AI can't determine completion, a dispute is created for manual review
- If client goes silent for 14 days after a milestone is submitted, funds auto-release to the freelancer
- If freelancer abandons the project for 14 days, further payments lock

The most important design decision: **the AI never directly triggers any payment**. It only recommends. A human always confirms before money moves.

---

## Tech Stack

**Backend**
- Node.js + Express
- PostgreSQL + Prisma
- BullMQ + Redis (Memurai on Windows, Upstash in production)
- Gemini AI via `@google/genai`
- Razorpay
- JWT + bcrypt

**Frontend**
- React + Vite
- Shadcn/ui + Tailwind CSS
- Framer Motion
- Axios

---

## Project Structure

```
pactpay/
├── README.md
├── docs/
│   ├── backend/
│   │   ├── ARCHITECTURE.md
│   │   ├── PAYMENT_FLOW.md
│   │   ├── AI_DESIGN.md
│   │   ├── STATE_MACHINE.md
│   │   └── GHOST_DETECTION.md
│   └── frontend/
│       ├── ARCHITECTURE.md
│       ├── PAGES.md
│       └── UI_DESIGN.md
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── config/
│   │   ├── db/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── contracts/
│   │   │   ├── payments/
│   │   │   ├── ai/
│   │   │   ├── disputes/
│   │   │   └── users/
│   │   ├── jobs/
│   │   ├── middleware/
│   │   └── utils/
│   ├── app.js
│   └── server.js
└── frontend/
    └── src/
        ├── pages/
        ├── components/
        └── shared/
```

---

## Running locally

**Prerequisites**
- Node.js 18+
- PostgreSQL
- Redis or Memurai (Windows)

**Backend setup**

```bash
cd backend
npm install
cp .env.example .env
# fill in your values
npx prisma migrate dev
node server.js
```

**Frontend setup**

```bash
cd frontend
npm install
cp .env.example .env
# fill in your values
npm run dev
```

---

## Environment variables

See `backend/.env.example` and `frontend/.env.example` for the full list.

**Backend needs:**
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — any long random string
- `PORT` — server port (5000 locally, 10000 on Render)
- `RAZORPAY_KEY_ID` — from razorpay.com dashboard
- `RAZORPAY_KEY_SECRET` — from razorpay.com dashboard
- `GEMINI_API_KEY` — from aistudio.google.com
- `REDIS_URL` — local Redis or Upstash URL

**Frontend needs:**
- `VITE_API_URL` — backend URL
- `VITE_RAZORPAY_KEY_ID` — public Razorpay key

---

## API Endpoints

**Auth**
```
POST /api/auth/register
POST /api/auth/login
```

**Contracts**
```
POST   /api/contracts
GET    /api/contracts
GET    /api/contracts/:id
PATCH  /api/contracts/:id/status
POST   /api/contracts/:contractId/milestones/:milestoneId/submit
```

**Payments**
```
POST /api/payments/fund
POST /api/payments/verify
POST /api/payments/release
POST /api/payments/refund
```

**AI**
```
POST /api/ai/assess
```

**Disputes**
```
POST  /api/disputes
GET   /api/disputes
GET   /api/disputes/:id
PATCH /api/disputes/:id/resolve
```

**Users**
```
GET /api/users/search?email=
```

---

## Documentation

**Backend**
- [Architecture](./docs/backend/ARCHITECTURE.md) — folder structure, request lifecycle, three circle model
- [Payment Flow](./docs/backend/PAYMENT_FLOW.md) — escrow flow, append-only ledger, idempotency, ACID compliance
- [AI Design](./docs/backend/AI_DESIGN.md) — why AI never triggers payments, verdict processor, confidence threshold
- [State Machine](./docs/backend/STATE_MACHINE.md) — valid contract and milestone transitions
- [Ghost Detection](./docs/backend/GHOST_DETECTION.md) — 14 day rules, auto-release, idempotency

**Frontend**
- [Architecture](./docs/frontend/ARCHITECTURE.md) — page structure, component hierarchy, state management
- [Pages](./docs/frontend/PAGES.md) — what each page does and how it connects
- [UI Design](./docs/frontend/UI_DESIGN.md) — design decisions, component library, animations

---

## What I learned building this

The hardest part wasn't the code — it was figuring out where code belongs. I spent a lot of time learning why controllers shouldn't talk to the database directly, why financial operations need transactions, and why background jobs need to be idempotent.

The ledger design was the most interesting thing I built. My first instinct was to store a balance column and update it on every payment. The append-only approach felt weird at first but makes much more sense — you can never lose data, you can always audit, and you can replay history if something goes wrong.

The AI safety gate was the most interesting design problem. The temptation was to wire the payment release directly to the AI verdict. But that felt wrong for a financial app. The extra layer of the verdict processor and requiring human confirmation before money moves was the right call.

---

## Contact

Built by Sajjad Ali — final year CSE student

- GitHub: [SajjadRizvi04](https://github.com/SajjadRizvi04)
- LinkedIn: [sajjad-ali](https://www.linkedin.com/in/sajjad-ali-42a27028b/)
- Live: [pactpay-frpntend.onrender.com](https://pactpay-frpntend.onrender.com)