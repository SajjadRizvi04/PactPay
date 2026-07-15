# State Machine

Every contract and milestone in PayPact has a status that follows strict transition rules. You can't jump from `DRAFT` to `COMPLETED`. You can't reopen a `CANCELLED` contract. These rules are enforced in `contract.statemachine.js` before any database write happens.

---

## Why a State Machine

Before I added the state machine, status updates were just database writes. Any route could set any status. Nothing stopped a bug from setting a contract to `COMPLETED` before any milestones were approved.

The state machine is a single source of truth for what transitions are allowed. Before any status update, the code calls `transitionContract(currentStatus, nextStatus)` or `transitionMilestone(currentStatus, nextStatus)`. If the transition isn't in the allowed list, it throws an error and nothing gets written.

---

## Contract States

```
DRAFT → ACTIVE → IN_PROGRESS → COMPLETED
  ↓        ↓          ↓
CANCELLED  CANCELLED  DISPUTED → IN_PROGRESS
                               → CANCELLED
```

**DRAFT**
Contract has been created but escrow hasn't been funded. The client can still edit terms. No work should start at this stage.

Allowed transitions:
- `DRAFT → ACTIVE` when client funds escrow
- `DRAFT → CANCELLED` if client decides not to proceed

**ACTIVE**
Escrow is funded. Contract is live. Freelancer can see it and work can begin.

Allowed transitions:
- `ACTIVE → IN_PROGRESS` when freelancer starts working
- `ACTIVE → CANCELLED` if both parties agree to cancel before work starts

**IN_PROGRESS**
Work is actively happening. Milestones are being submitted and reviewed.

Allowed transitions:
- `IN_PROGRESS → COMPLETED` when all milestones are approved
- `IN_PROGRESS → DISPUTED` when a dispute is raised

**COMPLETED**
All milestones approved, all payments released. Terminal state — no transitions out of here.

Allowed transitions: none

**DISPUTED**
A dispute has been raised, either manually or automatically by the AI or ghost detection. Payments are paused.

Allowed transitions:
- `DISPUTED → IN_PROGRESS` when dispute is resolved (either way)
- `DISPUTED → CANCELLED` if dispute cannot be resolved

**CANCELLED**
Contract is terminated. Terminal state.

Allowed transitions: none

---

## Milestone States

```
PENDING → SUBMITTED → APPROVED
              ↓
           REJECTED → SUBMITTED (resubmit)
              ↓
           DISPUTED → APPROVED
                    → REJECTED
```

**PENDING**
Milestone has been created but freelancer hasn't submitted work yet.

Allowed transitions:
- `PENDING → SUBMITTED` when freelancer submits work

**SUBMITTED**
Freelancer has submitted work. AI assessment is running in the background.

Allowed transitions:
- `SUBMITTED → APPROVED` when client confirms payment release
- `SUBMITTED → REJECTED` when AI recommends changes or client rejects
- `SUBMITTED → DISPUTED` when AI escalates or dispute is raised manually

**APPROVED**
Payment has been released for this milestone. Terminal state.

Allowed transitions: none

**REJECTED**
Work was not accepted. Freelancer needs to fix and resubmit.

Allowed transitions:
- `REJECTED → SUBMITTED` when freelancer resubmits

**DISPUTED**
This specific milestone is under dispute.

Allowed transitions:
- `DISPUTED → APPROVED` if dispute resolves in freelancer's favor
- `DISPUTED → REJECTED` if dispute resolves in client's favor

---

## The State Machine Code

The implementation is a plain object mapping current states to allowed next states:

```js
const contractTransitions = {
  DRAFT: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'DISPUTED'],
  DISPUTED: ['IN_PROGRESS', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: []
}
```

The transition function is pure — no database calls, no side effects:

```js
export const transitionContract = (currentStatus, nextStatus) => {
  const allowed = contractTransitions[currentStatus]
  if (!allowed.includes(nextStatus)) {
    throw new Error(`Cannot transition from ${currentStatus} to ${nextStatus}`)
  }
  return nextStatus
}
```

Keeping it pure means it's easy to test and easy to reason about. The service layer calls it and then does the database write if the transition is valid.

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
