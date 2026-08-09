# AI Design

The AI integration was the most interesting part of this project to think through. The temptation when you have an AI making a decision is to just wire it directly to the outcome — AI says approve, release the payment. But that felt wrong for a financial application.

---

## The Core Principle

**The AI never directly triggers any payment.**

It only makes a recommendation. A human always confirms before money moves.

This is not just a safety feature — it's the correct design. AI models can be wrong. If the AI directly called the payment release function, there'd be no way to catch that mistake before money moved.

The architecture enforces this at a structural level:

```
ai.service.js → verdict object → verdict.processor.js → notification/dispute
                                                              ↓
                                                    human confirms
                                                              ↓
                                                    payment.service.js
```

There is no direct path from `ai.service.js` to `payment.service.js`.

---

## The Assessment Flow

When a freelancer submits a milestone:

1. Milestone status updates to `SUBMITTED`
2. An AI assessment job gets pushed to the BullMQ queue
3. The freelancer gets an immediate response — they don't wait for Gemini
4. The AI worker picks up the job in the background
5. Worker calls `ai.service.js` with the contractId and milestoneId
6. Service fetches full contract and milestone details from the database
7. Service builds a prompt with all context
8. Prompt gets sent to Gemini AI
9. Response gets parsed and validated
10. Verdict gets stored in the `AIVerdict` table
11. `verdict.processor.js` handles the verdict

---

## The Prompt

The prompt gives Gemini everything it needs to make a fair assessment:

```
CONTRACT: Title, description, total amount
MILESTONE: Title, description, amount, due date
FREELANCER SUBMISSION: Notes, submission URL
```

Gemini responds in strict JSON format:

```json
{
  "verdict": "APPROVE | REQUEST_CHANGES | ESCALATE",
  "confidence": 0.0 to 1.0,
  "reasoning": "one or two sentences"
}
```

---

## Verdict Types

**APPROVE** — Gemini believes the submission meets requirements. Notifies client to verify and confirm.

**REQUEST_CHANGES** — Gemini believes work is incomplete. Milestone moves back to REJECTED, freelancer notified.

**ESCALATE** — Gemini cannot determine completion. Dispute created for manual review.

---

## The Confidence Threshold

Even if Gemini returns `APPROVE`, if confidence is below 0.7 the verdict processor treats it as `ESCALATE`:

```js
if (result === 'APPROVE' && confidence >= 0.7) {
  // notify client to confirm
} else if (result === 'APPROVE' && confidence < 0.7) {
  // escalate — don't release on a coin flip
}
```

We don't release money when the AI isn't sure.

---

## The Verdict Processor

`verdict.processor.js` is the safety gate. It receives verdicts and decides what action to take. It does not import or call the payment service.

```js
if (result === 'APPROVE' && confidence >= 0.7) {
  return { action: 'NOTIFY_CLIENT', message: '...' }
}
if (result === 'REQUEST_CHANGES') {
  // update milestone status to REJECTED
  return { action: 'NOTIFY_FREELANCER', message: '...' }
}
if (result === 'ESCALATE' || confidence < 0.7) {
  // create dispute, move contract to DISPUTED
  return { action: 'DISPUTE_CREATED', message: '...' }
}
```

---

## Why Async Processing

AI calls take 2-5 seconds. Making the freelancer wait blocks the HTTP request and couples milestone submission to AI availability. By pushing to BullMQ:

- Freelancer gets immediate response
- AI assessment happens in background
- If AI fails, BullMQ retries automatically
- Milestone submission is never affected by AI availability

---

## Storing Verdicts

Every AI verdict is stored in the `AIVerdict` table permanently. This means complete history of every AI decision, evidence in disputes, and the ability to review AI performance over time. Never updated, only inserted — same principle as the ledger.