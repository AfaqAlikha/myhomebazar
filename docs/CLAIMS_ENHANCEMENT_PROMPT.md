# User Frontend (Angular) — Claims Enhancement Prompt

Use this prompt in **myhousebazar** on branch `enhancement-ui`.

---

## Context

Backend API: `https://api.myhomebazar.com/api`

**Claims endpoints:**
- `POST /api/claims` — multipart FormData (orderId, reason, description, images[])
- `GET /api/claims?page=1&status=pending` — user's claims
- `GET /api/claims/:id` — claim detail

**Order API returns claim countdown fields:**
- `canClaim`, `hasClaimed`, `claimWindowDays`, `claimExpiresAt`, `claimDaysRemaining`

**User notifications:** Claim status updates go to **email**, not in-app push.

**Claim window:** 14 days after delivery (env: `CLAIM_WINDOW_DAYS`)

---

## Already Implemented (do not break)

- `src/app/buyer/order-history/` — File Claim modal, countdown, image upload
- `src/app/buyer/my-claims/` — My Claims list + detail modal
- `src/app/services/claims.service.ts` — FormData upload
- Routes: `/order-history`, `/my-claims` (AuthGuard)
- Nav links in header, drawer, profile menu

---

## Enhancement Tasks

### 1. Order History polish
- Claim countdown badge with urgency colors (≤3 days = red, ≤7 = amber)
- Disable "File Claim" when `claimDaysRemaining === 0`
- After successful claim → link to `/my-claims`
- Show "Claim submitted" badge on orders with `hasClaimed`

### 2. My Claims page
- Pull-to-refresh or manual refresh button
- Status filter chips (Pending, Under Review, Approved, etc.)
- Claim detail: full status history timeline
- Empty state CTA → "Go to Order History"
- SEO: noindex for `/my-claims` (private page)

### 3. Image upload UX
- Drag & drop zone in claim modal
- File size validation client-side (max 10MB each)
- Show upload progress if needed
- Compress large images before upload (optional)

### 4. Email communication copy
- On claim submit success toast: "Confirmation sent to your email"
- On My Claims page header: remind user status updates come via email
- No WebSocket claim notifications for buyer (by design)

### 5. SSR safety
- File input and image preview: browser only (`isPlatformBrowser`)
- My Claims page: Client render only (already in `app.routes.server.ts`)

### 6. Shared components
- Extract `ClaimStatusBadge` component
- Extract `ClaimFormModal` reusable from order-history
- Use existing `UiCard`, `UiButton`, theme CSS variables

---

## Claim Reasons (must match backend)

| value | label |
|-------|-------|
| wrong_product | Wrong Product |
| damaged_product | Damaged Product |
| missing_item | Missing Item |
| fake_product | Fake Product |
| defective_product | Defective Product |
| refund_request | Refund Request |
| exchange_request | Exchange Request |
| other | Other |

---

## Submit Claim — FormData example

```typescript
const formData = new FormData();
formData.append('orderId', orderId);
formData.append('reason', 'damaged_product');
formData.append('description', 'Box was crushed');
files.forEach(f => formData.append('images', f));

this.http.post(`${BASE}/claims`, formData, { headers: { Authorization: `Bearer ${token}` } });
```

---

## User Journey

1. User places order → seller marks **delivered**
2. Order History shows: "14 days left to claim" + File Claim button
3. User submits claim with photos → email confirmation
4. User tracks status on `/my-claims`
5. Admin approves/rejects → user gets **email** with admin notes
6. User completes order separately (optional, closes claim eligibility)

---

## Constraints

- Do NOT break existing cart, checkout, payment flows
- Do NOT add promotion/discount code
- Keep same API base URL from `src/environments/env.ts`
- Auth: Bearer token from `AuthService`

---

## Test Plan

1. Delivered order → countdown visible
2. Submit claim with 2 images → success, button hidden on order
3. `/my-claims` → claim appears with correct status
4. Expired window → no File Claim button
5. Complete order → claim button gone
6. Mobile: claim modal usable, images preview correctly
7. Dark mode: all claim UI readable
