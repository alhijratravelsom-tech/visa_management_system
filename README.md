# VisaGov Portal — Pro Visa Systems

A production-ready Visa Management System built with **Vite + React + TypeScript + Firebase**.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + Vite 5 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 (Pro-Visa design tokens) |
| Routing | React Router v6 |
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| Storage | Firebase Storage |
| OCR | Google Cloud Vision API |
| Charts | Recharts |
| Toasts | react-hot-toast |

## Getting Started

### 1. Install dependencies
```bash
cd visa-app
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Fill in all values in `.env`:
- Create a Firebase project at https://console.firebase.google.com
- Enable **Authentication** (Email/Password provider)
- Enable **Firestore** (start in production mode)
- Enable **Storage**
- Enable **Google Cloud Vision API** in your GCP project

### 3. Run development server
```bash
npm run dev
```

### 4. Build for production
```bash
npm run build
```

## Project Structure

```
src/
├── firebase/config.ts        # Firebase initialization
├── contexts/AuthContext.tsx  # Auth + role management
├── services/
│   ├── types.ts              # TypeScript interfaces
│   ├── base.ts               # Generic Firestore helpers
│   ├── applications.ts       # Application CRUD
│   ├── customers.ts          # Customer CRUD + duplicate detection
│   ├── offices.ts            # Office CRUD + wallet management
│   ├── visaTypes.ts          # Visa type management
│   ├── payments.ts           # Payment recording
│   ├── notifications.ts      # Notification system
│   ├── auditLogs.ts          # Audit trail
│   ├── storage.ts            # Firebase Storage uploads
│   └── ocr.ts                # Google Cloud Vision OCR + MRZ parsing
├── components/
│   ├── layout/               # Sidebar, Header, Layout, ProtectedRoute
│   └── ui/                   # StatusChip, Modal, ConfirmDialog, Spinner, EmptyState
└── pages/
    ├── Login.tsx
    ├── Dashboard.tsx
    ├── Applications.tsx       # Table + Kanban views
    ├── ApplicationDetail.tsx  # Status workflow + payments
    ├── NewApplication.tsx     # 4-step wizard with OCR
    ├── Customers.tsx
    ├── CustomerProfile.tsx
    ├── Offices.tsx            # Wallet management
    ├── BulkUpload.tsx         # Batch OCR processing
    ├── Financial.tsx
    ├── Reports.tsx
    ├── Notifications.tsx
    ├── UserProfile.tsx
    ├── Settings/
    │   ├── General.tsx
    │   └── VisaTypes.tsx
    └── Security/
        ├── Roles.tsx
        └── AuditLog.tsx
```

## Firestore Collections

| Collection | Description |
|-----------|-------------|
| `profiles` | User profiles with roles (owner/admin/staff/viewer) |
| `applications` | Visa applications with status history |
| `customers` | Applicant records with OCR metadata |
| `offices` | Agent offices with wallet balances |
| `visaTypes` | Visa products with pricing tiers |
| `payments` | Payment and refund transactions |
| `officeWalletTransactions` | Office wallet credit/debit history |
| `notifications` | Per-user notification feed |
| `auditLogs` | Immutable action log |

## Roles & Permissions

| Role | Access |
|------|--------|
| Owner | Full system access |
| Admin | All modules except owner management |
| Staff | Applications + Customers (read/write), others read-only |
| Viewer | Read-only across all modules |

> The **first user to sign in** is automatically bootstrapped as Owner.

## OCR Notes

Passport scanning uses **Google Cloud Vision API** (TEXT_DETECTION) with custom MRZ (Machine Readable Zone) parsing for TD3 format passports. The API key is restricted to Vision API only. In Bulk Upload mode, files are processed sequentially to avoid rate limits.
