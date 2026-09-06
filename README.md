# 🩸 Blood Donation & Emergency Assistance Platform

**Category:** Healthcare / Emergency

A backend platform that connects patients and hospitals in urgent need of blood with verified, compatible, and available donors nearby — cutting the time between "need" and "donation" through automated matching and real-time notifications.

---

## 📖 Overview

When a patient or hospital creates an emergency blood request, the system automatically verifies it, searches for blood-group-compatible donors within range, filters them by availability, and notifies them in real time. Once a donor accepts, the donation is tracked end-to-end until the request is marked complete.

```
Patient / Hospital
       │
       ▼
Create Blood Request
       │
       ▼
Verify Request
       │
       ▼
Find Compatible Donors
       │
       ▼
Filter by Availability / Location
       │
       ▼
Notify Potential Donors
       │
       ▼
Donor Accepts
       │
       ▼
Donation
       │
       ▼
Request Completed
```

---

## 👥 User Roles

The system has exactly **3 roles** (from the `Role` enum) and requesters split further into **2 types** (from `RequesterType`):

| Role | Description |
|------|--------------|
| **DONOR** | Registers, sets availability, and gets matched to nearby compatible requests |
| **REQUESTER** | Creates and manages blood requests — comes in two flavors via `requesterType`: |
| &nbsp;&nbsp;↳ `PATIENT` | An individual requesting blood for themselves or a family member |
| &nbsp;&nbsp;↳ `HOSPITAL` | A hospital account requesting on behalf of a patient |
| **ADMIN** | Verifies requests, approves/rejects donor applications, manages users, views audit logs & analytics |

---

## ✨ Features

### Core
- Donor registration & profile (blood group, division/district, address, geo-coordinates)
- Donor availability toggle
- Donation history & last donation date tracking
- Emergency blood request creation (urgency levels, needed-by time)
- Hospital accounts (separate `requesterType`)
- Blood group compatibility rules (auto-matching engine)
- Nearby donor discovery (location-based search)
- Donor–request matching with accept/reject flow
- Request verification (admin)
- Real-time notifications for donors & requesters

### Platform / Admin
- Admin dashboard with stats
- Donor application approval/rejection
- User management (view, activate/deactivate, delete)
- Audit logs (tracks sensitive actions like payments)
- Payment support (Stripe & bKash) for hospital/request-related fees
- Analytics & reports (planned)

---

## 🧩 API Modules

Base URL: `{{base_url}}/api/v1`

| Module | Responsibility |
|---|---|
| `/auth` | Register, login, OTP verify, Google login, password reset, apply-as-donor, current user |
| `/donors` | Donor profile, application status, profile update |
| `/blood-requests` | Create / read / update / cancel emergency requests |
| `/donor-matches` | Compatibility matching, accept/reject, my-matches |
| `/notifications` | Shared notification inbox for donors & requesters |
| `/donations` | Create, complete, cancel, and view donations |
| `/payments` | Stripe & bKash payment creation and execution |
| `/audit-logs` | Admin-only trail of sensitive actions (e.g. payments) |
| `/admin` | Dashboard stats, donor approval, request verification, user management |

A full Postman collection covering every endpoint above is maintained alongside this project.

---

## ⚙️ Backend Challenges

These are the trickiest parts of the system to get right:

- **Blood compatibility rules** — correctly encoding donor→recipient compatibility (e.g. O− as universal donor, AB+ as universal recipient) instead of naive exact-match logic
- **Donor eligibility** — enforcing minimum gap since last donation, age, and health flags before a donor is matched
- **Location-based matching** — efficient nearby-donor queries using latitude/longitude instead of scanning the full donor table
- **Emergency prioritization** — ranking/queueing requests by urgency (`CRITICAL` > `URGENT` > `NORMAL`) so the most urgent cases get matched first
- **Notification fan-out** — reliably notifying many compatible donors at once without overloading the notification service
- **Preventing duplicate donor assignments** — ensuring a donor isn't matched to (or doesn't accept) more than one active request at the same time

---

## 🛠️ Tech Stack

> Update this section if the actual stack differs — filled in based on the usual stack for this kind of project.

- **Runtime:** Node.js + Express
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** JWT (access/refresh tokens), Google OAuth
- **Payments:** Stripe, bKash
- **Deployment:** Vercel

---

## 🚀 Getting Started

### Prerequisites
- Node.js (LTS)
- PostgreSQL database
- npm or yarn

### Installation

```bash
git clone <repo-url>
cd blood-donation-system
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
NODE_ENV
PORT
DATABASE_URL
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
JWT_ACCESS_EXPIRES_IN
JWT_REFRESH_EXPIRES_IN
BCRYPT_SALT_ROUNDS
BACKEND_URL
FRONTEND_URL
GOOGLE_CLIENT_ID
REDIS_USER
REDIS_PASSWORD
REDIS_HOST
REDIS_PORT
SMTP_USER
EMAIL_SENDER
SMTP_PASSWORD
TESTER_ADMIN_NAME
TESTER_ADMIN_EMAIL
TESTER_ADMIN_PASSWORD
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
BKASH_BASE_URL
BKASH_USERNAME
BKASH_PASSWORD
BKASH_APP_KEY
BKASH_APP_SECRET
BKASH_CALLBACK_URL
```

### Run locally

```bash
npm run dev
```

### Database

```bash
npx prisma migrate dev
npx prisma generate
```

---

## 🧪 Testing the API

Import the Postman collection (`Blood-Donation-API.postman_collection.json`) and run the flow in this order:

1. Register Requester → Verify Email → Login
2. Apply For Donor → Admin Approve → Login as Donor
3. Requester creates a Blood Request
4. Requester triggers Donor Matching
5. Donor checks matches and Accepts
6. Both sides check Notifications
7. Donor completes the Donation

---

## 📌 Roadmap

- [ ] Volunteer role & workflows
- [ ] Analytics & reporting dashboard
- [ ] SMS-based emergency alerts
- [ ] Mobile app (donor-facing)

---

## 📄 License

Add your license here (MIT, ISC, etc.)
