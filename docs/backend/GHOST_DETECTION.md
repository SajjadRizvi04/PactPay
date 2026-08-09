# Ghost Detection

One of the core problems with freelance platforms is that people go silent. A client receives a milestone submission and just stops responding. Or a freelancer takes the first payment and disappears. Ghost detection handles both automatically.

---

## The Two Rules

**Rule 1 — Client Silent**
If a milestone has been in `SUBMITTED` status for more than 14 days, funds auto-release to the freelancer. The client has had two weeks to review. Silence at this point is effectively approval.

**Rule 2 — Freelancer Abandoned**
If a contract has been active for more than 14 days and the freelancer hasn't submitted any milestones, further payments get locked and a dispute is created.

---

## How It Works

A BullMQ job runs every 24 hours:

```
Every 24 hours:
  For each ACTIVE or IN_PROGRESS contract:
    Check if already ghost-processed → skip if yes

    Any milestone in SUBMITTED for 14+ days?
      → Auto-release payment
      → Mark milestone as APPROVED
      → Log GhostEvent (CLIENT_SILENT, AUTO_RELEASED)

    No submissions at all and contract is 14+ days old?
      → Create dispute
      → Move contract to DISPUTED
      → Log GhostEvent (FREELANCER_ABANDONED, PAYMENT_LOCKED)
```

---

## Idempotency

The ghost worker runs every 24 hours. Without idempotency, the same contract could get processed multiple times — auto-releasing the same payment twice.

The `GhostEvent` table handles this. Before processing any contract, the worker checks if a `GhostEvent` with `processed: true` already exists for that contract. If one exists, the contract is skipped entirely.

The `processed` flag is set to `true` inside the same transaction as the payment release or dispute creation — so if the transaction fails, the flag stays false and the worker retries correctly next time.

---

## The GhostEvent Table

Every ghost action creates a permanent record:

```
id, type, action, contractId, triggeredAt, processed
```

`type` is either `CLIENT_SILENT` or `FREELANCER_ABANDONED`.
`action` is either `AUTO_RELEASED` or `PAYMENT_LOCKED`.

This gives a complete audit trail. If a freelancer says "I never got paid" or a client says "why was money released without my approval", the `GhostEvent` record shows exactly when the ghost detection triggered and why.

---

## ACID Compliance

The auto-release flow touches multiple tables — ledger entry, milestone update, and ghost event creation. All of this happens inside a single Prisma transaction:

```js
await prisma.$transaction(async (tx) => {
  await tx.transaction.create({ ... })   // ledger entry
  await tx.milestone.update({ ... })     // milestone → APPROVED
  await tx.ghostEvent.create({ ... })    // log the event
})
```

If any of these fail, all of them roll back.

---

## Scheduling

The repeating job is registered once at server startup:

```js
await ghostQueue.add(
  'check-ghost',
  {},
  { repeat: { every: 24 * 60 * 60 * 1000 } }
)
```

BullMQ stores this in Redis and fires it on schedule. If the server restarts, BullMQ picks up the schedule from Redis and continues — no jobs are lost.