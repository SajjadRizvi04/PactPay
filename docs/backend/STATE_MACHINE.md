# State Machine

Every contract and milestone in PactPay has a status that follows strict transition rules. These rules are enforced in `contract.statemachine.js` before any database write happens.

---

## Why a State Machine

Before I added the state machine, status updates were just database writes. Any route could set any status. Nothing stopped a bug from setting a contract to `COMPLETED` before any milestones were approved.

The state machine is a single source of truth for what transitions are allowed. Before any status update, the code calls `transitionContract(currentStatus, nextStatus)`. If the transition isn't in the allowed list, it throws an error and nothing gets written.

---

## Contract States

```
DRAFT → ACTIVE → IN_PROGRESS → COMPLETED
  ↓        ↓          ↓
CANCELLED  CANCELLED  DISPUTED → IN_PROGRESS
                               → CANCELLED
```

**DRAFT** — Contract created, escrow not funded. Allowed: ACTIVE, CANCELLED

**ACTIVE** — Escrow funded, work can begin. Allowed: IN_PROGRESS, CANCELLED

**IN_PROGRESS** — Work actively happening. Allowed: COMPLETED, DISPUTED

**COMPLETED** — All milestones approved. Terminal state. No transitions.

**DISPUTED** — Dispute raised. Payments paused. Allowed: IN_PROGRESS, CANCELLED

**CANCELLED** — Contract terminated. Terminal state. No transitions.

---

## Milestone States

```
PENDING → SUBMITTED → APPROVED
              ↓
           REJECTED → SUBMITTED
              ↓
           DISPUTED → APPROVED
                    → REJECTED
```

**PENDING** — Not yet submitted. Allowed: SUBMITTED

**SUBMITTED** — Freelancer submitted work. Allowed: APPROVED, REJECTED, DISPUTED

**APPROVED** — Payment released. Terminal state. No transitions.

**REJECTED** — Work not accepted. Allowed: SUBMITTED (resubmit)

**DISPUTED** — Under dispute. Allowed: APPROVED, REJECTED

---

## The State Machine Code

```js
const contractTransitions = {
  DRAFT: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'DISPUTED'],
  DISPUTED: ['IN_PROGRESS', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: []
}

export const transitionContract = (currentStatus, nextStatus) => {
  const allowed = contractTransitions[currentStatus]
  if (!allowed.includes(nextStatus)) {
    throw new Error(`Cannot transition from ${currentStatus} to ${nextStatus}`)
  }
  return nextStatus
}
```

The function is pure — no database calls, no side effects. Easy to test and easy to reason about.

---

## What Triggers Each Transition

| Transition | Triggered by |
|---|---|
| DRAFT → ACTIVE | Client funds escrow (verifyAndFundEscrow) |
| ACTIVE → IN_PROGRESS | Client manually activates |
| IN_PROGRESS → COMPLETED | All milestones approved (automatic) |
| IN_PROGRESS → DISPUTED | Dispute created (manual or AI escalation) |
| DISPUTED → IN_PROGRESS | Dispute resolved |
| * → CANCELLED | Client cancels |
| PENDING → SUBMITTED | Freelancer submits milestone |
| SUBMITTED → APPROVED | Client releases payment |
| SUBMITTED → REJECTED | AI recommends changes or client rejects |
| SUBMITTED → DISPUTED | AI escalates or manual dispute |
| REJECTED → SUBMITTED | Freelancer resubmits |
| DISPUTED → APPROVED | Dispute resolved in freelancer's favor |
| DISPUTED → REJECTED | Dispute resolved in client's favor |