# AcademiaSync

AcademiaSync is an institutional-grade faculty enhancement, professional development, and performance appraisal platform designed for higher education universities and colleges. It provides secure, role-aware workflows for faculty profiles, Continuing Professional Development (CPD) programs, competency matrices, annual appraisals, custom assessments, cryptographic certificate verification, notices, and system-wide notifications.

---

## Table of Contents

- [What It Includes](#what-it-includes)
- [Technology Stack](#technology-stack)
- [Repository Layout](#repository-layout)
- [System Requirements](#system-requirements)
- [Local Setup](#local-setup)
  - [Backend Configuration](#backend-configuration)
  - [Frontend Configuration](#frontend-configuration)
  - [Install Dependencies](#install-dependencies)
  - [Start Backend Service](#start-backend-service)
  - [Start Frontend Application](#start-frontend-application)
- [Database Seeding & Demo Accounts](#database-seeding--demo-accounts)
- [Health Check & Readiness Contract](#health-check--readiness-contract)
- [Email Architecture & Cloud Delivery](#email-architecture--cloud-delivery)
  - [The Cloud SMTP Problem](#the-cloud-smtp-problem)
  - [Gmail REST API over HTTPS](#academiasyncs-solution-gmail-rest-api-over-https)
  - [Gmail Sending Quotas & Scale](#gmail-api-sending-quotas--enterprise-scale)
- [Rate Limiting & Security Architecture](#rate-limiting--security-architecture)
- [Frontend Pages & Responsibilities](#frontend-pages--responsibilities)
  - [Public Campus Pages](#public-campus-pages)
  - [Shared Portal Pages](#shared-portal-pages)
  - [Training & LMS Pages](#training--lms-pages)
  - [Assessment, Competency & Appraisal Pages](#assessment-competency--appraisal-pages)
  - [Administration Pages](#administration-pages)
- [API Route Reference](#api-route-reference)
- [Deployment Guide](#deployment-guide)
  - [Backend on Render](#backend-on-render)
  - [Frontend on Vercel](#frontend-on-vercel)
  - [Frontend on Netlify](#frontend-on-netlify)
- [Testing & Verification](#testing--verification)
  - [Automated Pipeline Test Suite](#automated-pipeline-test-suite-npm-test)
  - [Concurrency & Security Tests](#concurrency--security-tests)
  - [Production Build Verification](#production-build-verification)
- [Security Notes](#security-notes)
- [License](#license)

---

## What It Includes

- **Public Campus Portal**: Institutional pages for academics, faculty directories, departments, student resources, circulars/notices, contact helpdesk, and public legal policies ([Privacy Policy](/privacy) and [Terms of Service](/terms)).
- **Cryptographic Certificate Verification**: Tamper-proof course completion certificates secured with URL-safe **AES-256-GCM** tokens publicly verifiable at `/verify/:token` without exposing confidential faculty scores or answer sheets.
- **Faculty Academic Profiles**: Dynamic management of qualifications, research papers, journal citations, patents, sponsored grants, and professional accomplishments.
- **Training & LMS Workflows**: Program catalogs, nominations, multi-stage approvals, session attendance rosters, modular course learning, and competency-based assessments.
- **Bulk Faculty Recommendations**: Multi-faculty assignment modal with search filtering, *Select All* / *Clear* controls, and per-action email notification opt-in.
- **Unified Notification Hub**: Dedicated `/notifications` workspace with *Inbox*, *Unread*, and *Archived* tabs, per-item status actions, and Admin/Dean campus broadcast notices.
- **Cloud-Native Email Dispatch**: Outbound delivery via official Google Gmail REST API (v1) over **HTTPS (Port 443)** using OAuth2, with automatic fallback to local console preview logging in development.
- **Competency Matrix & Gap Analysis**: Departmental skill mapping, faculty baseline scoring, and development recommendations.
- **Annual Performance Appraisals**: Self-appraisal forms, Head of Department (HOD) reviews, Dean scoring, promotion recommendations, and committee remarks.
- **Assessments & Surveys**: MCQ, rating scale, true/false, and open-text assessment creation with automatic scoring, timed attempts, and CSV grade exports.
- **Role-Based Access Control (RBAC)**: Fine-grained access across five distinct roles: `faculty_member`, `hod`, `dean`, `hr`, and `administrator`.
- **Audit & Compliance Logging**: Append-only audit trails tracking authentication, profile updates, score approvals, exports, and security events.

---

## Technology Stack

### Backend
- **Runtime**: Node.js (v18+) & TypeScript
- **Framework**: Express 5
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (Short-lived access tokens + SHA-256 hashed refresh token session families) & bcryptjs
- **Email Delivery**: Official Google Gmail REST API (v1) via `googleapis` over HTTPS (Port 443)
- **Security & Validation**: Zod, Helmet, CORS, Morgan, AES-256-GCM cryptographic cipher
- **Traffic Control**: In-memory sliding window rate limiter with standard RFC headers

### Frontend
- **Framework**: React 19 & TypeScript
- **Build Tool**: Vite
- **Routing**: React Router (DOM v7)
- **HTTP Client**: Axios with centralized request/response interceptors
- **Data Visualization**: Recharts
- **Icons & Styling**: Lucide React & Tailwind CSS

---

## Repository Layout

```text
faculty_enhancement/
├── backend/
│   ├── src/
│   │   ├── config/             # Database connection & startup env validation
│   │   ├── controllers/        # Request handlers (auth, training, appraisal, notices, etc.)
│   │   ├── jobs/               # Scheduled compliance alerts & certificate expiry reminders
│   │   ├── middlewares/        # JWT authentication, RBAC authorization, rate limiters, errors
│   │   ├── models/             # Mongoose schemas (User, Program, Certificate, Notice, etc.)
│   │   ├── routes/             # Versioned API routes mounted under /api/v1
│   │   ├── seed/               # Demo data seeder
│   │   ├── services/           # Domain services (emailService, notificationService, templateService)
│   │   ├── verify_pipeline.ts  # End-to-end security & business logic test suite (run by npm test)
│   │   └── index.ts            # Application entry point & server bootstrap
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   └── my-app/
│       ├── src/
│       │   ├── api/            # Typed Axios API clients (auth, training, notices, etc.)
│       │   ├── components/     # Layout (TopBar, PublicNavbar, PublicFooter), UI cards, modals, tables
│       │   ├── context/        # Global AuthContext & session state
│       │   ├── hooks/          # Reusable hooks (useApi, useAuth, useNotifications)
│       │   ├── pages/          # Public campus views, role dashboards, training LMS, admin consoles
│       │   ├── types/          # Shared TypeScript interfaces & API response contracts
│       │   └── utils/          # Constants, navigation trees, and date/status formatters
│       ├── .env.example
│       ├── package.json
│       └── vite.config.ts
├── render.yaml                 # Infrastructure-as-code deployment blueprint for Render
└── README.md
```

---

## System Requirements

- **Node.js**: `18.0.0` or higher
- **npm**: `9.0.0` or higher
- **MongoDB**: MongoDB Atlas cluster or a local MongoDB server (`>= 6.0`)

---

## Local Setup

### Backend Configuration

Navigate to the `backend/` directory and create your `.env` configuration:

```bash
cd backend
cp .env.example .env
```

Configure the following variables in `backend/.env`:

```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Database Configuration
MONGO_URI=mongodb://localhost:27017/academiasync
DB_NAME=academiasync

# Authentication & Session Security
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Cryptographic Certificate Encryption (Must be exactly 64 hex chars = 32 bytes)
URL_ENC_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Google Gmail API OAuth2 Configuration (Optional for local dev)
# Leave empty to use frictionless Console Preview Logger in development
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REFRESH_TOKEN=
GMAIL_REDIRECT_URI=https://developers.google.com/oauthplayground
GMAIL_USER=notifications@academiasync.edu
EMAIL_FROM_ADDRESS=notifications@academiasync.edu
EMAIL_FROM_NAME="AcademiaSync Institutional Portal"
```

> [!NOTE]
> **Database Environment Variables Explained**:
> - **`MONGO_URI`**: The canonical database connection string. For backwards compatibility with external cloud environments, the server also accepts `MONGODB_URI` and `MONGODB_ATLAS_URI`. The connection resolver evaluates them in strict precedence order: `MONGO_URI` &rarr; `MONGODB_URI` &rarr; `MONGODB_ATLAS_URI` &rarr; `mongodb://localhost:27017/academiasync`.
> - **`DB_NAME`**: Specifies the target database name passed explicitly to `mongoose.connect(uri, { dbName: targetDb })`. When using cloud providers like MongoDB Atlas, connection strings often omit the database path or default to `test`. Setting `DB_NAME=academiasync` ensures Mongoose binds to the intended logical database regardless of URI formatting (`DB_NAME`, when set, takes precedence over any database name embedded in the URI).

> [!NOTE]
> **Token Lifespan Architecture**:
> Access tokens are intentionally short-lived (`JWT_EXPIRES_IN=15m`) to minimize vulnerability exposure if a bearer token is intercepted. User sessions remain seamless through long-lived refresh tokens (`JWT_REFRESH_EXPIRES_IN=7d`) with automatic rotation and session family reuse detection.

### Frontend Configuration

Navigate to the frontend directory and copy the environment template:

```bash
cd ../frontend/my-app
cp .env.example .env
```

Configure `frontend/my-app/.env`:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

*(The frontend Axios client also gracefully accepts base URLs without `/api/v1` and appends it automatically).*

### Install Dependencies

Install dependencies for both projects:

```bash
# In backend/
cd ../../backend
npm install

# In frontend/my-app/
cd ../frontend/my-app
npm install
```

### Start Backend Service

```bash
cd ../../backend
npm run dev
```

The backend server boots on `http://localhost:5000`:
- **API Root**: `http://localhost:5000/`
- **Health Check**: `http://localhost:5000/health`
- **Versioned API Gateway**: `http://localhost:5000/api/v1`

### Start Frontend Application

In a separate terminal window:

```bash
cd frontend/my-app
npm run dev
```

Access the application in your browser at `http://localhost:5173`.

---

## Database Seeding & Demo Accounts

When connecting to a fresh database with no user records, the backend **automatically seeds** default departments, subjects, faculty profiles, and demo accounts.

To manually re-seed or reset demo data:

```bash
cd backend
npm run seed
```

> [!CAUTION]
> Running `npm run seed` drops and recreates seed collections. Never execute against a production database.

### Preconfigured Demo Credentials

| Role | Email | Password | Scope & Privileges |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@academiasync.edu` | `Admin@123` | Full institution-wide system administration, audit logs, user management |
| **HOD (CSE)** | `hod.cse@academiasync.edu` | `Hod@123` | Computer Science departmental evaluations, training approvals, gap analysis |
| **HOD (ECE)** | `hod.ece@academiasync.edu` | `Hod@123` | Electronics & Communication departmental reviews and course nominations |
| **Dean** | `dean@academiasync.edu` | `Dean@123` | Campus-wide academic oversight, appraisal committee reviews, broadcast alerts |
| **HR Officer** | `hr@academiasync.edu` | `Hr@123` | Institutional workforce analytics, compliance reporting, appraisal summaries |
| **Faculty (CSE)** | `faculty@academiasync.edu` | `Faculty@123` | Personal profile, training enrollment, LMS course learning, self-appraisals |
| **Faculty (ECE)** | `faculty2@academiasync.edu` | `Faculty@123` | Secondary faculty account for testing peer reviews and nominations |

---

## Health Check & Readiness Contract

The backend exposes a readiness and liveness endpoint at `GET /health`. Unlike basic liveness ping endpoints, AcademiaSync verifies downstream **MongoDB connectivity** before determining status.

### Status Code Behavior
- **`200 OK`**: MongoDB connection is active and ready (`readyState === 1`).
- **`503 Service Unavailable`**: MongoDB is disconnected or degraded (`readyState !== 1`).

### JSON Response Contract
```json
{
  "status": "ok",
  "app": "AcademiaSync API",
  "version": "1.0.0",
  "uptime": 1420,
  "database": {
    "status": "connected",
    "name": "academiasync"
  },
  "emailService": {
    "mode": "gmail_api"
  },
  "timestamp": "2026-09-06T12:30:00.000Z"
}
```
*(Note: `uptime` indicates the live server process uptime in seconds and changes dynamically on every request).*

---

## Email Architecture & Cloud Delivery

### The Cloud SMTP Problem
Standard web hosting platforms (including **Render**, **Railway**, and **Vercel Serverless**) **block outbound raw SMTP TCP ports (`25`, `465`, `587`) by default** to combat network abuse and spam bots. Attempting to connect directly to `smtp.gmail.com` via Nodemailer from these environments results in `ENETUNREACH` or infinite connection timeouts.

### AcademiaSync's Solution: Gmail REST API over HTTPS
AcademiaSync routes all outbound email over **HTTPS (Port 443)** using the official **Google Gmail REST API (v1)** via the `googleapis` library:

1. **OAuth2 Authorization**: Uses `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, and `GMAIL_REFRESH_TOKEN` to generate authenticated bearer tokens.
2. **RFC 2822 & Base64url Encoding**: Dynamically constructs MIME-compliant email messages (with UTF-8 encoded subject headers) and encodes them using URL-safe Base64 (`+` &rarr; `-`, `/` &rarr; `_`).
3. **HTTP Dispatch**: Dispatches via `POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send`. Port 443 is universally open across all cloud hosting providers.
4. **Local Dev Fallback**: If Gmail OAuth2 variables are omitted from `.env`, the system automatically falls back to an instant **Console Email Preview Logger** without crashing or hanging requests.
5. **Per-Notification Delivery Persistence**: Every notification record tracks `emailStatus` (`sent`, `failed`, or `skipped`) and `emailDispatchedAt` to give administrators complete visibility into delivery outcomes.
6. **Admin Deliverability Verification**: Administrators can dispatch a live test email at any time via `POST /api/v1/notifications/test-email` and inspect recent test sends via `GET /api/v1/notifications/test-email-history`.

### Gmail API Sending Quotas & Enterprise Scale
- **Personal Gmail Accounts**: Capped by Google at **~500 recipients per day** across API and SMTP dispatch.
- **Google Workspace Accounts**: Capped at **2,000 recipients per day** (or 10,000 with multi-user relays).
- **Institutional Broadcast Advisory**: Because AcademiaSync supports campus-wide announcements (`POST /api/v1/notifications/broadcast`) that can message hundreds of faculty members simultaneously, administrators using personal Gmail accounts should be aware of this daily ceiling. For large universities exceeding 500 recipients/day, configure Google Workspace credentials or integrate transactional email services (**Resend**, **SendGrid**, or **Amazon SES**).

#### Diagnostic Endpoint Contract: `POST /api/v1/notifications/test-email`
```json
{
  "success": true,
  "mode": "gmail_api",
  "isLiveDelivery": true,
  "messageId": "18f0a3b89c7d12e4",
  "previewUrl": null,
  "error": null,
  "warning": null
}
```
*(If the system is running without OAuth2 credentials, `mode` reports `"mock_logger"`, `isLiveDelivery` returns `false`, and `warning` contains an actionable string advising administrators to configure credentials).*

#### Diagnostic History Contract: `GET /api/v1/notifications/test-email-history`
Returns an in-memory audit trail of the last 20 diagnostic email executions (including timestamps, recipients, transport modes, message IDs, and error/warning details) to streamline production verification without requiring direct access to server console logs.

---

## Rate Limiting & Security Architecture

AcademiaSync enforces strict defense-in-depth security:

- **Authentication Rate Limiting (`authLimiter`)**:
  - Targets `/api/v1/auth/login` and `/api/v1/auth/register`.
  - Enforces a sliding window maximum of **10 requests per 15 minutes per IP** to prevent credential stuffing and brute-force attacks.
- **General API Rate Limiting (`apiLimiter`)**:
  - Protects all `/api/v1/*` endpoints.
  - Enforces a sliding window maximum of **300 requests per 15 minutes per IP**.
- **RFC-Standard Rate Limit Headers**:
  - `RateLimit-Limit`: Maximum allowable requests in current window.
  - `RateLimit-Remaining`: Requests remaining before throttling.
  - `RateLimit-Reset`: Seconds remaining until quota reset.
  - `Retry-After`: Returned with HTTP `429 Too Many Requests` when throttled.
- **Session Family Revocation**: SHA-256 hashed refresh tokens are stored in the database. If a revoked token is replayed, the entire session family across all devices for that user is immediately invalidated.
- **Administrative Force Logout**: Administrators can immediately terminate all active sessions for any user via `POST /api/v1/users/:id/revoke-sessions`. Suspending an account or resetting a password automatically invalidates all active sessions.
- **Cryptographic URL Tokenization**: Certificate verification tokens are encrypted with `AES-256-GCM` using the 32-byte `URL_ENC_KEY`. Tampering with any URL character fails authentication tag validation.

---

## Frontend Pages & Responsibilities

### Public Campus Pages
Accessible without signing in:

| Route | Page Component | Responsibility |
| :--- | :--- | :--- |
| `/` | `HomePage` | Institutional hero banner, university ranking badges, news highlights, and service shortcuts. |
| `/academics` | `AcademicsPage` | Academic degrees, curricular programs, and institutional faculties. |
| `/faculty` | `FacultyDirectoryPage` | Public directory of professors, researchers, designations, and departmental labs. |
| `/departments` | `DepartmentsPage` | Academic departments, subjects offered, and faculty rosters. |
| `/students` | `StudentsPage` | Student resources, campus portals, and grievance cell information. |
| `/notices` | `NoticesPage` | MongoDB-backed public official circulars viewer with category filtering, search, and date formatting; plus authenticated modal for **Administrators and Deans** to publish circulars and deactivate entries. |
| `/contact` | `ContactPage` | Departmental contact directory and automated inquiry ticketing form. |
| `/privacy` | `PrivacyPolicyPage` | Institutional data protection policy, DPDP/FERPA compliance, certificate privacy isolation, and DPO contacts. |
| `/terms` | `TermsOfServicePage` | Academic integrity rules, credential security, IP ownership, certificate revocation, and usage guidelines. |
| `/verify/:token` | `CertificateVerificationPage` | Public zero-auth cryptographic verification of issued training certificates. |

### Shared Portal Pages
Accessible by authenticated users across designated roles:

| Route | Page Component | Responsibility |
| :--- | :--- | :--- |
| `/dashboard` | `DashboardPage` | Role-tailored dashboards (`FacultyDashboard`, `HODDashboard`, `DeanDashboard`, `HRDashboard`, `AdminDashboard`). |
| `/profile` | `ProfilePage` | Detailed view of user's academic profile, qualifications, research citations, and completeness score. |
| `/profile/edit` | `EditProfilePage` | Form for updating educational degrees, publications, patents, research areas, bio, and **faculty email notification preferences** (training, appraisal, broadcasts, system alerts). |
| `/notifications` | `NotificationsPage` | Dedicated inbox with *Inbox*, *Unread*, and *Archived* tabs, bulk actions, Admin/Dean Broadcast Modal, and **Administrator Email Diagnostics console** (`POST /test-email` trigger & `GET /test-email-history` live viewer). |
| `/certificates` | `MyCertificatesPage` | Displays certificates earned by the faculty member. Renders a print-optimized certificate view via the browser's native print dialog (`window.print()`), which users can save as PDF, and provides public verification links. |
| `/reports` | `ReportsPage` | Role-scoped institutional analytics, training completion rates, and NAAC compliance metrics. |

### Training & LMS Pages

| Route | Page Component | Responsibility |
| :--- | :--- | :--- |
| `/training/catalog` | `TrainingCatalogPage` | Exploration of professional development programs with category filters and nomination submission. |
| `/training/my-enrollments` | `MyEnrollmentsPage` | Tracking personal nominations, approval statuses, attendance records, and course access. |
| `/training/approvals` | `HODApprovalsPage` | Approval/rejection interface for Department Heads and Deans to evaluate faculty nominations. |
| `/training/:id/learn` | `CourseLearningPage` | Interactive LMS delivering course modules, video lectures, progress tracking, and final assessments. |
| `/training/grading` | `CourseGradingPage` | Evaluation console for instructors to review submitted course assessments and assign grades. |
| `/training/programs/:id/sessions` | `SessionAttendancePage` | Attendance roster manager for scheduling training sessions and recording present/absent states. |

### Assessment, Competency & Appraisal Pages

| Route | Page Component | Responsibility |
| :--- | :--- | :--- |
| `/assessments` | `AssessmentListPage` | List of assigned institutional surveys, competency tests, templates, and past submissions. |
| `/assessments/:id/take` | `TakeAssessmentPage` | Timed assessment execution interface with real-time countdown timer, progress bar, auto-save, and submission validation. |
| `/assessments/:id/results` | `TakeAssessmentPage` | Dual-mode evaluation scorecard rendering submitted answers, points earned, correct answer keys, and reviewer notes without initiating a new attempt. |
| `/assessments/:id/analytics` | `AssessmentAnalyticsPage` | Aggregate performance charts, submission distributions, CSV exports, and manual question grading. |
| `/competency` | `CompetencyPage` | Radar charts and level metrics across core academic and technical skills. |
| `/competency/gap-analysis` | `DepartmentGapAnalysisPage` | Departmental skill deficiency analysis and automated development recommendations. |
| `/appraisals` | `AppraisalListPage` | Faculty self-appraisal submissions and historical performance ratings. |
| `/appraisals/department` | `ReviewerAssessmentPage` | HOD and Dean scoring interface with rubrics across teaching, research, and institutional service. |
| `/appraisals/cycles` | `AppraisalCycleBuilderPage` | Admin console for creating annual appraisal periods, criteria weights, and deadlines. |
| `/recommendations` | `RecommendationsPage` | Multi-faculty training recommendation tool with batch assignment, search, and email notification toggle. |
| `/curriculum/subjects` | `SubjectManagementPage` | Subject master catalog management, syllabus details, and department assignments. |

### Administration Pages

| Route | Page Component | Responsibility |
| :--- | :--- | :--- |
| `/admin/users` | `UserManagementPage` | Account creation, role modification, suspension, instant **token family session revocation** (`POST /api/v1/users/:id/revoke-sessions`), password resets, and user filtering. |
| `/admin/departments` | `DepartmentManagementPage` | Department creation, HOD assignment, and academic unit status toggling. |
| `/admin/audit` | `AuditLogPage` | Immutable audit log viewer with filtering by actor, action type, IP address, and date range. |

---

## RBAC Role × Page Access Matrix

The following matrix documents institutional access across the 5 authenticated user roles and public/anonymous visitors across all platform routes:

| Route | Public / Anon | Faculty (`faculty_member`) | HOD (`hod`) | Dean (`dean`) | HR (`hr`) | Admin (`administrator`) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `/`, `/academics`, `/faculty`, `/students`, `/departments`, `/contact`, `/privacy`, `/terms` | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `/notices` (Public Viewer) | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `/notices` (Publish / Deactivate Modal) | :x: | :x: | :x: | :white_check_mark: | :x: | :white_check_mark: |
| `/verify/:token` (Cryptographic Verification) | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `/login` | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `/dashboard` | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `/profile`, `/profile/edit` (Email Preferences) | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `/notifications` (Inbox & History) | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `/notifications` (Broadcast Dispatch) | :x: | :x: | :x: | :white_check_mark: | :x: | :white_check_mark: |
| `/notifications` (Email Diagnostics Console) | :x: | :x: | :x: | :x: | :x: | :white_check_mark: |
| `/certificates` (Earned Records & PDF) | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `/training/catalog` | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `/training/my-enrollments` | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `/training/programs/:id/sessions` | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `/training/sessions/:sessionId` | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `/training/:id/learn` | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `/training/grading` | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :white_check_mark: |
| `/training/approvals` | :x: | :x: | :white_check_mark: | :white_check_mark: | :x: | :white_check_mark: |
| `/assessments` | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `/assessments/:id/take` | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `/assessments/:id/results` | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `/assessments/:id/analytics` | :x: | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `/competency` | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `/competency/gap-analysis` | :x: | :x: | :white_check_mark: | :white_check_mark: | :x: | :white_check_mark: |
| `/appraisals` | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `/appraisals/department` | :x: | :x: | :white_check_mark: | :white_check_mark: | :x: | :white_check_mark: |
| `/appraisals/cycles` | :x: | :x: | :x: | :x: | :x: | :white_check_mark: |
| `/curriculum/subjects` | :x: | :x: | :white_check_mark: | :white_check_mark: | :x: | :white_check_mark: |
| `/recommendations` | :x: | :x: | :white_check_mark: | :white_check_mark: | :x: | :white_check_mark: |
| `/reports` | :x: | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `/admin/users` (inc. Session Revocation) | :x: | :x: | :x: | :x: | :x: | :white_check_mark: |
| `/admin/departments` | :x: | :x: | :x: | :x: | :x: | :white_check_mark: |
| `/admin/audit` | :x: | :x: | :x: | :x: | :x: | :white_check_mark: |

---

## API Route Reference

All backend API routes are versioned and mounted under the `/api/v1` prefix:

| API Base Path | Description | Key Capabilities |
| :--- | :--- | :--- |
| `/api/v1/auth` | Authentication & Sessions | `/login`, `/register`, `/me`, `/refresh-token`, `/logout`, `/inquiry`, `/preferences` (institutional email notification toggles) |
| `/api/v1/users` | User Administration | User CRUD, role assignment, password resets, `/department/:deptId`, `/:id/revoke-sessions` |
| `/api/v1/departments` | Department Management | Department CRUD, HOD assignments, active status controls |
| `/api/v1/subjects` | Subject Catalog | Subject CRUD, code validation, department linkage |
| `/api/v1/profiles` | Faculty Profiles | Profile completeness score, qualifications, research citations, patents |
| `/api/v1/training` | Unified Training & LMS Router | Mounted via `trainingRoutes.ts` (delegates across `trainingController.ts`, `lmsController.ts`, and `sessionController.ts` for programs, enrollments, approvals, LMS modules, session attendance, course tests, and grading) |
| `/api/v1/certificates` | Certificate Management | `/verify/:token` (zero-auth public verification), `/mine` (earned certificates list), `/:id/revoke` (administrative revocation). *(Note: Issuance occurs in `/training`, and certificate views are rendered client-side)* |
| `/api/v1/competency` | Competency Mapping | Faculty skill matrices, targets, and departmental gap analysis |
| `/api/v1/appraisals` | Appraisal Cycles | Cycle creation, self-appraisals, HOD reviews, Dean scores, and approvals |
| `/api/v1/assessments` | Custom Assessment Engine | Dynamic surveys/tests, question banks, timed submissions, grading, CSV exports |
| `/api/v1/recommendations` | Development Recommendations | Multi-faculty training assignments, status tracking, compliance enforcement |
| `/api/v1/notifications` | Notifications & Broadcasts | `/mine`, `/mark-all-read`, `/:id/archive`, `/:id`, `/broadcast` (mass notice), `/test-email` (admin diagnostic), `/test-email-history` (diagnostic audit trail) |
| `/api/v1/notices` | University Circulars | `/public` (zero-auth public circulars), protected admin/dean management CRUD |
| `/api/v1/reports` | Institutional Analytics | Dashboard metric rollups, accreditation exports, compliance rates |
| `/api/v1/audit` | Security Audit Logs | Non-repudiable audit trails across all administrative actions |

---

## Deployment Guide

### Backend on Render

The root [`render.yaml`](file:///Users/jadu/Desktop/faculty_enhancement/render.yaml) blueprint configures the backend as a Web Service.

#### 1. Deployment Steps
1. In the **Render Dashboard**, click **New +** &rarr; **Blueprint** (or connect your GitHub repository).
2. Select `academiasync-api`.
3. Set the following environment variables in the Render Environment dashboard:

```text
NODE_ENV=production
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/academiasync?retryWrites=true&w=majority
DB_NAME=academiasync
JWT_SECRET=generate_a_long_random_64_character_string
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
URL_ENC_KEY=generate_a_64_character_hexadecimal_string_32_bytes
CORS_ORIGIN=https://your-frontend-app.vercel.app

# Google Gmail API OAuth2 Configuration (HTTPS Port 443)
GMAIL_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-google-oauth-client-secret
GMAIL_REFRESH_TOKEN=your-google-refresh-token
GMAIL_REDIRECT_URI=https://developers.google.com/oauthplayground
GMAIL_USER=notifications@academiasync.edu
EMAIL_FROM_ADDRESS=notifications@academiasync.edu
EMAIL_FROM_NAME="AcademiaSync Institutional Portal"
```

> [!IMPORTANT]
> **Render Port Blocking Note**:
> Render assigns `PORT` automatically; do not override it. Render blocks outbound raw SMTP traffic on ports 25, 465, and 587. Email delivery on Render operates through the configured Google Gmail API OAuth2 credentials over standard HTTPS (Port 443).

### Frontend on Vercel

The frontend includes `frontend/my-app/vercel.json` for SPA HTML5 client-side routing.

1. In the **Vercel Dashboard**, import the repository.
2. Set the **Root Directory** to `frontend/my-app`.
3. Configure the environment variable:
   ```text
   VITE_API_URL=https://your-backend-api.onrender.com/api/v1
   ```
4. Deploy.

### Frontend on Netlify

The frontend includes `frontend/my-app/public/_redirects` so Netlify serves the SPA entry point for client-side routes and page refreshes.

1. In the **Netlify Dashboard**, import the repository.
2. Set the **Base directory** to `frontend/my-app`.
3. Set the **Build command** to `npm run build` and the **Publish directory** to `dist`.
4. Configure the environment variable:
   ```text
   VITE_API_URL=https://your-backend-api.onrender.com/api/v1
   ```
5. Deploy.

---

## Testing & Verification

### Automated Pipeline Test Suite (`npm test`)
The test command (`npm test`) runs `backend/src/verify_pipeline.ts` via `ts-node`. It validates 8 comprehensive verification suites containing **59 automated assertions** (0 failed):

| Suite | Description | Assertions Verified | Count |
| :--- | :--- | :--- | :---: |
| **1. Startup Environment Validation** | Validates `JWT_SECRET` length (&ge;32 chars), `URL_ENC_KEY` (64-char hex / 32-byte entropy), and database URI existence | 3 | **3** |
| **2. AES-256-GCM URL Tokenization** | URL-safe serialization, payload decryption (certificate ID, serial number), authenticated tag tamper rejection, and expiration rejection | 5 | **5** |
| **3. Sliding-Window Rate Limiter** | Quota allowance (first 3 requests), header decrementing (`RateLimit-Remaining: 0`), 4th request 429 block, and middleware short-circuiting | 4 | **4** |
| **4. Mongoose Schemas & Derived Validity** | Active certificate `isValid` virtual (true), expired certificate (false), revoked certificate (false), CourseResult passing status, and SHA-256 refresh token hashing | 5 | **5** |
| **5. Atomic Reservation & Cooldown Logic** | Fresh enrollment attempt eligibility, certified blocking, attempt limit cap (3/3), 24h failure cooldown blocking, and cooldown expiry recovery | 5 | **5** |
| **6. Token Reuse Defense & Family Revocation** | Validates the compromise defense handler from `authController.ts`: replaying a revoked token returns HTTP 401, flags reuse detection, invalidates all tokens in the user's token family (including concurrent active mobile/desktop sessions), and logs an institutional audit event | 5 | **5** |
| **7. Email Templating & Delivery Fallback** | Interpolation of recipient names, subject tokens, and institutional branding across all 7 email templates (21 assertions), valid transport mode resolution, non-throwing return contract, and `mock_logger` success verification | 21 + 3 | **24** |
| **8. Attendance Eligibility Logic** | Training session schema, default scheduled status, roster initialization, attendee attendance states, cancelled session exclusion, full attendance certificate qualification, and partial attendance non-qualification | 8 | **8** |
| **TOTAL** | **8 Automated Test Suites** | **Complete Pipeline Verification** | **59/59** |

Run from `backend/`:

```bash
cd backend
npm test
```

Expected output:
```text
====================================================
TEST SUMMARY: 59 PASSED, 0 FAILED
====================================================
```

### Concurrency & Security Tests
Verify database transaction locking, race conditions, and reservation isolation against a live MongoDB instance:

```bash
cd backend
npm run test:concurrency
```

### Production Build Verification
Verify TypeScript type-checking and bundling on both projects:

```bash
# Backend TypeScript compilation
cd backend && npm run build

# Frontend Vite production bundle
cd ../frontend/my-app && npm run build
```

---

## Security Notes

1. **Secret Isolation**: Never commit `.env` files or hardcode credentials into source control. All sensitive keys (`JWT_SECRET`, `URL_ENC_KEY`, `GMAIL_CLIENT_SECRET`, etc.) must remain in secure environment variable stores.
2. **Cryptographic Integrity**: `URL_ENC_KEY` must be generated as a high-entropy 64-character hexadecimal string (32 bytes). It is used to generate authenticated AES-256-GCM tags for all issued certificates.
3. **CORS Restrictions**: Always set `CORS_ORIGIN` to your explicit frontend production domain (e.g. `https://academiasync.edu`) in production rather than wildcard `*`.
4. **Session Invalidation**: When an account is suspended or a password reset is requested, all active sessions are immediately revoked. Administrators can also trigger `POST /api/v1/users/:id/revoke-sessions` on demand.
5. **Production Email Deliverability**: For enterprise-scale production deployment, consider configuring a dedicated sending subdomain (e.g. `notify.academiasync.edu`) with transactional email providers like **Resend** (generous free tier: 3,000 emails/month), **SendGrid**, or **Amazon SES**, paired with SPF, DKIM, and DMARC DNS records to guarantee inbox placement.

---

## License

This project is licensed for academic, research, and institutional deployment. See individual institutional governance policies for adaptation guidelines.
