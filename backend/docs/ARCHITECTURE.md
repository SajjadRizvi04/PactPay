# Architecture

I want to document how I thought about structuring this project because it took me a while to figure out and I think it's worth writing down.

---

## The Three Circle Model

When I started building PayPact I kept putting code in the wrong place. Business logic in routes, database calls in controllers, that kind of thing. The mental model that fixed this was thinking about three circles:

```
┌─────────────────────────────────────┐
│           HTTP Layer                │
│     (routes, controllers)           │
│  ┌───────────────────────────────┐  │
│  │       Business Logic          │  │
│  │    (services, state machine,  │  │
│  │     verdict processor)        │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │       Data Layer        │  │  │
│  │  │   (Prisma, database)    │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

Each circle only talks to the one directly inside it. The HTTP layer calls the business logic layer. The business logic layer calls the data layer. The HTTP layer never touches the database directly.

This sounds obvious written down but it took me a while to actually internalize it.

---

## Request Lifecycle

Every single feature in the app follows this exact path:

```
HTTP Request
     ↓
Route (defines the URL and method)
     ↓
Middleware (auth check, request validation)
     ↓
Controller (reads req, calls service, sends res)
     ↓
Service (business logic, rules, decisions)
     ↓
Prisma (database queries)
     ↓
PostgreSQL
     ↓
Response travels back up the chain
```

Example — freelancer submits a milestone:

```
POST /api/contracts/:contractId/milestones/:milestoneId/submit
     ↓
authenticate middleware checks JWT token
     ↓
validate middleware checks req.body against Zod schema
     ↓
contract.controller.submit reads req.params and req.user.id
     ↓
contract.service.submitMilestone validates freelancer owns this milestone,
runs state machine transition, updates database, pushes AI job to queue
     ↓
prisma.milestone.update writes to PostgreSQL
     ↓
Response: updated milestone object
```

---

## Module Structure

Each feature domain is a self-contained module:

```
src/modules/
├── auth/
│   ├── auth.routes.js       → URL definitions
│   ├── auth.controller.js   → HTTP handling
│   ├── auth.service.js      → business logic
│   └── auth.schema.js       → Zod validation shapes
├── contracts/
│   ├── contract.routes.js
│   ├── contract.controller.js
│   ├── contract.service.js
│   ├── contract.statemachine.js  → state transition rules
│   └── contract.schema.js
├── payments/
│   ├── payment.routes.js
│   ├── payment.controller.js
│   ├── payment.service.js
│   └── ledger.service.js         → append-only financial ledger
├── ai/
│   ├── ai.routes.js
│   ├── ai.controller.js
│   ├── ai.service.js             → Gemini API integration
│   └── verdict.processor.js      → safety gate between AI and payments
└── disputes/
    ├── dispute.routes.js
    ├── dispute.controller.js
    └── dispute.service.js
```

The reason for this structure is that when something breaks, I know exactly which file to open. Payment bug → payments module. AI verdict wrong → verdict.processor.js. State transition failing → contract.statemachine.js.

---

## Background Jobs

Some things shouldn't happen inside an HTTP request. The ghost detection check runs every 24 hours — you can't do that in a route handler. AI assessment takes 3-5 seconds — you don't want the freelancer waiting for that.

BullMQ handles this with Redis as the backing store:

```
HTTP Request → add job to queue → respond immediately
                    ↓
              Redis stores job
                    ↓
              Worker picks up job
                    ↓
              Worker does the actual work
```

Three workers:
- `ghost.worker.js` — runs every 24 hours, checks for silent clients and abandoned projects
- `ai.worker.js` — processes AI assessment jobs asynchronously
- `deadletter.worker.js` — catches jobs that fail after all retries

---

## Why app.js and server.js are separate

`app.js` creates and configures the Express app. `server.js` calls `app.listen()`.

The reason is testing. When you import `app` in a test file, it doesn't bind to a port. You can pass it to a testing library and make requests without actually starting the server. If everything was in one file, every test would try to open port 3000.

---

## Database Design Decisions

One `User` table with a `role` field instead of separate `Client` and `Freelancer` tables. A user can theoretically be a client on some contracts and a freelancer on others. Separate tables would complicate this and duplicate auth logic.

All financial operations use Prisma's `$transaction` to ensure atomicity. If a ledger entry succeeds but the milestone status update fails, the entire operation rolls back. No partial state ever gets committed.
