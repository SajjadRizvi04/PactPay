# Backend Architecture

## The Three Circle Model

When I started building PactPay I kept putting code in the wrong place. Business logic in routes, database calls in controllers, that kind of thing. The mental model that fixed this was thinking about three circles:

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

---

## Module Structure

Each feature domain is a self-contained module:

```
src/modules/
├── auth/
│   ├── auth.routes.js
│   ├── auth.controller.js
│   ├── auth.service.js
│   └── auth.schema.js
├── contracts/
│   ├── contract.routes.js
│   ├── contract.controller.js
│   ├── contract.service.js
│   ├── contract.statemachine.js
│   └── contract.schema.js
├── payments/
│   ├── payment.routes.js
│   ├── payment.controller.js
│   ├── payment.service.js
│   └── ledger.service.js
├── ai/
│   ├── ai.routes.js
│   ├── ai.controller.js
│   ├── ai.service.js
│   └── verdict.processor.js
├── disputes/
│   ├── dispute.routes.js
│   ├── dispute.controller.js
│   └── dispute.service.js
└── users/
    └── user.routes.js
```

---

## Background Jobs

Some things shouldn't happen inside an HTTP request. The ghost detection check runs every 24 hours. AI assessment takes 3-5 seconds. BullMQ handles this with Redis as the backing store:

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
- `ai.worker.js` — processes AI assessment jobs asynchronously after milestone submission
- `deadletter.worker.js` — catches jobs that fail after all retries

---

## Why app.js and server.js are separate

`app.js` creates and configures the Express app. `server.js` calls `app.listen()`.

The reason is testability. When you import `app` in a test file, it doesn't bind to a port. If everything was in one file, every test would try to open a real socket.

---

## Database Design Decisions

One `User` table with a `role` field instead of separate `Client` and `Freelancer` tables. A user can be a client on some contracts and a freelancer on others. Separate tables would complicate this and duplicate auth logic.

All financial operations use Prisma's `$transaction` to ensure atomicity. If a ledger entry succeeds but the milestone status update fails, the entire operation rolls back. No partial state ever gets committed.

The `Transaction` table is append-only — never updated or deleted. Every money movement is a permanent insert. This is how actual financial systems work.