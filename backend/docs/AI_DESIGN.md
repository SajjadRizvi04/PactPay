# AI Design

The AI integration was the most interesting part of this project to think through. The temptation when you have an AI making a decision is to just wire it directly to the outcome — AI says approve, release the payment. But that felt wrong for a financial application. Here's how I actually designed it.

---

## The Core Principle

**The AI never directly triggers any payment.**

It only makes a recommendation. A human always confirms before money moves.

This is not just a safety feature — it's the correct design. AI models can be wrong. Gemini might assess a milestone submission as complete when it isn't. If the AI directly called the payment release function, there'd be no way to catch that mistake before money moved.

The architecture enforces this at a structural level. The AI service returns a verdict object. The verdict processor decides what to surface to the user. The payment service is a completely separate module that only gets called when a human explicitly confirms.

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
8. Prompt gets sent to Gemini 2.5 Flash
9. Response gets parsed and validated
10. Verdict gets stored in the `AIVerdict` table
11. `verdict.processor.js` handles the verdict

---

## The Prompt

The prompt gives Gemini everything it needs to make a fair assessment:

```
CONTRACT:
Title, description, total amount

MILESTONE:
Title, description, amount, due date

FREELANCER SUBMISSION:
Notes from the freelancer explaining what they did
URL to their work (GitHub, Figma, deployed app, etc.)
```

Gemini is asked to respond in a strict JSON format:

```json
{
  "verdict": "APPROVE | REQUEST_CHANGES | ESCALATE",
  "confidence": 0.0 to 1.0,
  "reasoning": "one or two sentences explaining the verdict"
}
```

The JSON response format is enforced in the prompt. Gemini sometimes wraps responses in markdown code blocks so we strip those before parsing.

---

## Verdict Types

**APPROVE**
Gemini believes the submission meets the milestone requirements. This doesn't release payment — it notifies the client that the AI recommends approval and they should verify the submission URL before confirming.

**REQUEST_CHANGES**
Gemini believes the submission is incomplete or doesn't match the milestone description. The milestone status moves back to a state where the freelancer can resubmit. The freelancer gets notified with the AI's reasoning.

**ESCALATE**
Gemini cannot determine whether the work is complete. This usually happens when the submission notes are vague or the milestone requirements are ambiguous. A dispute is automatically created for manual review.

---

## The Confidence Threshold

Even if Gemini returns `APPROVE`, if the confidence score is below 0.7 the verdict processor treats it as `ESCALATE`.

```js
if (result === 'APPROVE' && confidence >= 0.7) {
  // notify client to confirm
} else if (result === 'APPROVE' && confidence < 0.7) {
  // escalate — don't release on a coin flip
}
```

0.7 felt like a reasonable threshold. Below that, the AI is essentially saying it's not sure. We don't release money when the AI isn't sure.

---

## The Verdict Processor

`verdict.processor.js` is the safety gate. It's the only file that receives verdicts and the only file that decides what action to take. It does not import or call the payment service.

```js
// APPROVE + high confidence → notify client
if (result === 'APPROVE' && confidence >= 0.7) {
  return { action: 'NOTIFY_CLIENT', message: '...' }
}

// REQUEST_CHANGES → send back to freelancer
if (result === 'REQUEST_CHANGES') {
  // update milestone status to REJECTED
  return { action: 'NOTIFY_FREELANCER', message: '...' }
}

// ESCALATE or low confidence → create dispute
if (result === 'ESCALATE' || confidence < 0.7) {
  // create dispute, move contract to DISPUTED
  return { action: 'DISPUTE_CREATED', message: '...' }
}
```

The actions returned are strings that the frontend uses to show the right notification. They are not function calls.

---

## What the AI Can and Can't Do

**Can do:**
- Read milestone title and description
- Read freelancer's submission notes
- Read the submission URL as text
- Make a judgment based on whether the notes match the requirements

**Can't do:**
- Actually visit the submission URL
- Read code on GitHub
- View images or designs
- Access any external system

This is a limitation of the free Gemini API. The practical consequence is that the AI assesses based on what the freelancer writes in their submission notes. The client is still expected to check the actual URL before confirming payment. The AI is a first pass, not the final judge — which is the correct design anyway.

---

## Why Async Processing

AI calls take 2-5 seconds. Making the freelancer wait for that response in the HTTP request would feel slow and would also mean if the AI call fails, the milestone submission fails too — even though submission and assessment are two separate concerns.

By pushing the assessment to a BullMQ job:
- Freelancer gets an immediate response confirming their submission
- AI assessment happens in the background
- If AI fails, it gets retried automatically by BullMQ
- The milestone submission is never affected by AI availability

---

## Storing Verdicts

Every AI verdict is stored in the `AIVerdict` table:

```
id, verdict, confidence, reasoning, contractId, milestoneId, createdAt
```

This means:
- Complete history of every AI decision
- Can review AI performance over time
- Evidence in disputes — "the AI assessed this with 0.9 confidence because..."
- Never updated, only inserted — same principle as the ledger
