# Pages

Every page in PactPay and what it does.

---

## Home — `/`

Landing page. No auth required. Sections: hero, how it works (5 steps), features (6 cards), footer. Framer Motion animations on scroll with `whileInView` and `once: true`.

---

## Login — `/login`

Email and password form. On success stores token and user in localStorage, navigates to `/dashboard`.

---

## SignUp — `/signup`

Name, email, password, and role selection (CLIENT or FREELANCER). On success stores token and user, navigates to `/dashboard`. Backend generates JWT on register so user lands directly on dashboard without a separate login step.

---

## Dashboard — `/dashboard`

Main hub after login. Different stats for clients and freelancers.

**Client:** Total contracts, active contracts, total in escrow, completed contracts
**Freelancer:** Active contracts, pending submissions, completed milestones, total earned

Clicking a contract navigates to `/contracts/:id`.

Components: `Sidebar`, `StatsCard`, `ContractsList`

---

## Contracts — `/contracts`

Full list of all contracts for the user. Each row shows title, milestone count, amount, status. Clients see a New Contract button. Clicking navigates to contract detail.

---

## ContractNew — `/contracts/new`

Client-only. Two sections: contract details and milestones.

Freelancer search: client types a freelancer email, hits Search, backend returns the user, ID auto-fills. Live validation shows if milestone amounts add up to the total contract amount.

On submit validates all fields then calls `POST /api/contracts`.

---

## ContractDetail — `/contracts/:id`

The most important page. Hub for everything on a contract.

**Left panel:** Each milestone shows status, title, description, amount, due date. If submitted: shows freelancer notes and link. If AI verdict exists: shows verdict box with confidence and reasoning. Action buttons based on role and milestone status.

**Right panel:** Escrow balance, contract info, progress bar, active dispute if one exists, Fund Escrow button if DRAFT.

Button rules:
- Freelancer + PENDING → Submit Work
- Freelancer + REJECTED → Resubmit Work
- Client + SUBMITTED → Release Payment, Request Changes, Raise Dispute
- Client + APPROVED → "Payment Released" text

---

## MilestoneDetail — `/contracts/:id/milestones/:milestoneId`

Freelancer-only. Shows milestone requirements then a submission form with notes and URL. On submit calls `POST /api/contracts/:contractId/milestones/:milestoneId/submit` which triggers AI assessment job in background. Freelancer gets immediate response.

---

## ContractPayment — `/contracts/:id/payment`

Client-only. Shows contract summary, amount, and how escrow works. Razorpay script loaded dynamically at runtime. On Pay:

```
1. Call POST /api/payments/fund → get Razorpay order
2. Open Razorpay popup
3. User pays
4. Razorpay calls handler with signatures
5. Call POST /api/payments/verify
6. Navigate back to contract
```

---

## Disputes — `/disputes`

List of all disputes for the user. Shows contract title, reason, date, status. Clicking navigates to dispute detail.

---

## DisputeDetail — `/disputes/:id`

Shows dispute details — reason, description, status.

**Client:** Resolution form with dropdown (freelancer wins → release payment, client wins → refund) and notes. Calls `PATCH /api/disputes/:id/resolve`.

**Freelancer:** Read-only view of dispute details.

If already resolved, shows green resolved card with resolution notes and date.