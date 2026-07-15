# PayPact

An AI-powered escrow platform for freelancers and clients.
The basic idea is that freelancers and clients often don't trust each other when working remotely. Clients worry the freelancer will take the money and disappear. Freelancers worry the client will reject perfectly good work and refuse to pay. PayPact tries to solve this by holding funds in escrow and using AI to assess whether milestone work is actually complete before payment is released.

---

## What it does

- Client creates a contract with milestones, each with a title, description, amount, and due date
- Client funds the escrow via Razorpay — money is held until work is verified
- Freelancer works on each milestone and submits it with notes and a link to their work
- Gemini AI assesses the submission against the milestone requirements and returns a verdict
- If AI recommends approval, client gets notified to confirm the release
- If AI recommends changes, freelancer is notified to fix the work
- If AI can't determine completion (low confidence), a dispute is created for manual review
- If client goes silent for 14 days after a milestone is submitted, funds auto-release to the freelancer
- If freelancer abandons the project for 14 days, further payments get locked

The most important design decision I made: **the AI never directly triggers any payment**. It only makes a recommendation. A human always confirms before money moves. This felt like the right call for a financial application.

---

## Tech Stack

- **Node.js + Express** — backend API
- **PostgreSQL + Prisma** — database and ORM
- **Razorpay** — payment processing
- **Gemini 3.5 Flash** — AI milestone assessment
- **BullMQ + Redis** — background job queues for ghost detection and async AI processing
- **JWT + bcrypt** — authentication

---

## Project Structure

```
escrow-platform/
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
│   │   │   └── disputes/
│   │   ├── jobs/
│   │   ├── middleware/
│   │   └── utils/
│   ├── app.js
│   └── server.js
└── frontend/
    

```

Each module follows the same pattern: `routes → controller → service → database`. The controller is always thin — it just reads from the request and calls the service. All business logic lives in the service.

---

## Key Engineering Decisions

**Append-only ledger**

The `Transaction` table never gets updated or deleted. Every money movement is a permanent insert. The escrow balance is always calculated by replaying the transaction history, not by reading a stored balance field. 

**Prisma transactions on all financial operations**

Any operation that involves both a ledger entry and a status update is wrapped in `prisma.$transaction`. If the ledger write succeeds but the milestone update fails, the whole thing rolls back. No partial state.

**State machine for contracts and milestones**

Valid state transitions are defined in `contract.statemachine.js` as a plain object. Before any status update, the transition is validated. You can't go from `DRAFT` directly to `COMPLETED`. This prevents a whole class of bugs.

**AI as a safety gate, not an actor**

The `verdict.processor.js` sits between the AI verdict and any action. The AI returns `APPROVE`, `REQUEST_CHANGES`, or `ESCALATE`. The processor decides what to do with that — notify the client, send back to freelancer, or create a dispute. The processor never calls the payment service. The client always has the final say.

**Idempotency keys on payments**

Every transaction row has a unique idempotency key. If a payment request is retried due to a network issue, the second insert fails with a unique constraint error instead of charging twice.

---

## Running locally

**Prerequisites**
- Node.js 18+
- PostgreSQL
- Redis (or Memurai on Windows)

**Setup**

```bash
# Clone the repo
git clone https://github.com/yourusername/paypact.git
cd paypact/backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your values in .env

# Run database migrations
npx prisma migrate dev

# Start the server
node server.js
```

**Environment variables needed**

See `.env.example` for the full list. You'll need:
- A PostgreSQL database
- A Redis instance
- Razorpay test keys (free at razorpay.com)
- A Gemini API key (free at aistudio.google.com)

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
GET   /api/disputes/:id
PATCH /api/disputes/:id/resolve
```

---

## Required Environment variables 
    PORT = your_port_number
    DATABASE_URL="postgresql://username:password@localhost:5432/paypact"
    JWT_SECRET = "your_jwt_secret_key"
    RAZORPAY_KEY_ID= "your_razorpay_key_id"
    RAZORPAY_KEY_SECRET= "your_razorpay_key_secret"
    GEMINI_API_KEY = "your_gemini_api_key"
    REDIS_URL="redis://localhost:6379"

## What I learned building this

Honestly the hardest part wasn't the code — it was figuring out where code belongs. I spent a lot of time understanding why controllers shouldn't talk to the database directly, why financial operations need transactions, and why background jobs need to be idempotent.

The ledger design took me a while to understand. My first instinct was to have a `balance` column on the contract that I'd update on every payment. The append-only approach felt weird at first but makes a lot more sense now — you can never lose data, you can always audit, and you can replay history if something goes wrong.

The AI safety gate was probably the most interesting design problem. The temptation was to just call the payment release function directly when AI returns APPROVE. But that felt wrong for a financial app. The extra layer of the verdict processor and requiring human confirmation before money moves was the right call.

---

## What's next

- Frontend (React + Redux + Shadcn) — currently in progress
- Email notifications for verdicts and ghost detection events
- Admin dashboard for dispute resolution
- Better AI prompting with more context from previous submissions

---

## Contact

Built by Sajjad Ali — final year CSE student.

LinkedIn: https://www.linkedin.com/in/sajjad-ali-42a27028b/
GitHub: https://github.com/SajjadRizvi04

