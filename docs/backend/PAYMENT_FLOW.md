# Payment Flow

Payments were the part of this project I was most careful about. Getting financial logic wrong in subtle ways is easy and the consequences are bad — double charges, money moving when it shouldn't, no audit trail.

---

## The Escrow Flow

```
1. Client creates contract with milestones
2. Client calls POST /api/payments/fund
   → Server creates a Razorpay order
   → Returns order_id to frontend
3. Frontend shows Razorpay payment popup
4. Client pays
5. Razorpay sends payment_id and signature back to frontend
6. Frontend sends those to POST /api/payments/verify
7. Server verifies HMAC signature
   → Only if valid: writes ESCROW_FUNDED to ledger
   → Updates contract status to ACTIVE
8. Freelancer works and submits milestones
9. AI assesses submission
10. Client confirms release via POST /api/payments/release
    → Server checks escrow balance
    → Writes MILESTONE_RELEASED to ledger
    → Updates milestone status to APPROVED
    → If all milestones approved: contract moves to COMPLETED
```

The ledger entry only gets written after the payment signature is verified. Before that point, no money has moved in our system as far as the database is concerned.

---

## Why the Ledger is Append-Only

My first instinct was to have a `balance` column on the `Contract` table and update it on every payment. The problem with this is you lose history.

The append-only ledger works differently. Every money movement is a permanent insert:

```
ESCROW_FUNDED      +10000
MILESTONE_RELEASED  -4000
MILESTONE_RELEASED  -6000
```

The balance is always calculated by replaying these entries:

```js
const balance = transactions.reduce((sum, t) => {
  if (t.type === 'ESCROW_FUNDED') return sum + Number(t.amount)
  if (t.type === 'MILESTONE_RELEASED') return sum - Number(t.amount)
  if (t.type === 'REFUNDED') return sum - Number(t.amount)
  return sum
}, 0)
```

This is how actual banks work. Your bank balance isn't stored as a single number — it's derived from your transaction history.

---

## ACID Compliance

Every operation that touches both the ledger and another table is wrapped in `prisma.$transaction`:

```js
await prisma.$transaction(async (tx) => {
  await tx.transaction.create({ data: { ... } })
  await tx.milestone.update({ where: { id: milestoneId }, data: { status: 'APPROVED' } })
  await tx.contract.update({ where: { id: contractId }, data: { status: 'COMPLETED' } })
})
```

If any of these fail, all of them roll back. You never end up in a state where the ledger says money was released but the milestone still shows SUBMITTED.

Inside the transaction I use `tx` instead of `prisma` directly. Using `prisma` inside a transaction would bypass it.

---

## Idempotency Keys

Network failures happen. A client might hit the payment endpoint, the server processes it, but the response never arrives. The client retries. Without idempotency, the payment processes twice.

Every `Transaction` row has an `idempotencyKey` field with a `@unique` constraint. Every ledger insert generates a new UUID as the key. If the same payment somehow gets processed twice, the second insert fails with a unique constraint violation instead of creating a duplicate ledger entry.

---

## Razorpay Signature Verification

When a payment completes, Razorpay sends back three values:
- `razorpay_order_id`
- `razorpay_payment_id`
- `razorpay_signature`

The signature is an HMAC SHA256 hash of `order_id|payment_id` using your secret key. We verify it server-side before trusting any payment:

```js
const body = razorpayOrderId + '|' + razorpayPaymentId
const expectedSignature = crypto
  .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
  .update(body)
  .digest('hex')

if (expectedSignature !== razorpaySignature) {
  throw new Error('Invalid payment signature')
}
```

If the signatures don't match, the request is rejected and nothing gets written to the ledger.

---

## Transaction Types

```
ESCROW_FUNDED      → Client funded the escrow
MILESTONE_RELEASED → Payment released to freelancer for a milestone
REFUNDED           → Money returned to client
DISPUTED_HOLD      → Funds held pending dispute resolution
```