# Ghost Detection

One of the core problems with freelance platforms is that people go silent. A client receives a milestone submission and just... stops responding. Or a freelancer takes the first payment and disappears. Ghost detection handles both of these automatically.

---

## The Two Rules

**Rule 1 — Client Silent**
If a milestone has been in `SUBMITTED` status for more than 14 days, funds auto-release to the freelancer.

Reasoning: the freelancer submitted their work and the client hasn't responded. The client has had two weeks to review. Silence at this point is effectively approval. The freelancer shouldn't be held hostage by an unresponsive client.

**Rule 2 — Freelancer Abandoned**
If a contract has been `ACTIVE` or `IN_PROGRESS` for more than 14 days and the freelancer hasn't submitted any milestones, further payments get locked and a dispute is created.

Reasoning: the client funded the escrow in good faith. If the freelancer isn't doing any work and isn't communicating, the contract needs human intervention.

---

## How It Works

A BullMQ job runs every 24 hours. It checks all active contracts and applies the rules:

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

The ghost worker runs every 24 hours. Without idempotency, the same contract could get processed multiple times — auto-releasing the same payment twice, creating multiple disputes for the same abandonment.

The `GhostEvent` table handles this. Before processing any contract, the worker checks if a `GhostEvent` with `processed: true` already exists for that contract:

```js
const alreadyProcessed = await prisma.ghostEvent.findFirst({
  where: {
    contractId: contract.id,
    processed: true
  }
})

if (alreadyProcessed) continue
```

If one exists, the contract is skipped entirely. The `processed` flag is set to `true` when the ghost event is created, inside the same transaction as the payment release or dispute creation.

This means even if the worker crashes halfway through and restarts, contracts that were already handled won't get handled again.

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

The auto-release flow touches multiple tables — it creates a ledger entry, updates the milestone, and creates the ghost event. All of this happens inside a single Prisma transaction:

```js
await prisma.$transaction(async (tx) => {
  await tx.transaction.create({ ... })      // ledger entry
  await tx.milestone.update({ ... })        // milestone → APPROVED
  await tx.ghostEvent.create({ ... })       // log the event
})
```

If any of these fail, all of them roll back. You never end up with a ledger entry for a release that didn't actually complete.

---

## Scheduling

The repeating job is registered once at server startup:

```js
await ghostQueue.add(
  'check-ghost',
  {},
  {
    repeat: { every: 24 * 60 * 60 * 1000 } // every 24 hours in ms
  }
)
```

BullMQ stores this in Redis and fires it on schedule. If the server restarts, BullMQ picks up the schedule from Redis and continues — no jobs are lost.

---

## Edge Cases

**What if a milestone gets approved manually before the 14 days?**
The milestone status would be `APPROVED`, not `SUBMITTED`. The ghost worker only looks at milestones in `SUBMITTED` status, so already-approved milestones are ignored.

**What if both parties are active but slow?**
The 14 day clock starts from when the milestone was last updated (the `updatedAt` field). If the freelancer resubmits, the clock resets. If the client leaves a comment or requests changes, the milestone status changes and the clock resets.

**What if the server is down when the job should run?**
BullMQ with Redis handles this. When the server comes back up, BullMQ checks Redis for any missed scheduled jobs and runs them. The `processed` flag on `GhostEvent` prevents double processing even if the job runs twice.
