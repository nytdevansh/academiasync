# AcademiaSync

AcademiaSync is a full-stack faculty enhancement and performance management platform for universities. It provides role-aware workflows for faculty profiles, training and FDP programs, competency development, appraisals, assessments, reports, notifications, and audit visibility.

## What It Includes

- Public campus pages for academics, departments, faculty, notices, students, and contact information
- JWT-based authentication with role-based access control
- Faculty academic profiles, qualifications, experience, certifications, and accomplishments
- Training catalog, enrollment, nomination, approval, completion, and certificate tracking
- Competency records, skill areas, and departmental gap analysis
- Appraisal cycles, self-assessments, reviewer assessments, and scoring
- Custom assessments and surveys with MCQ, true/false, rating, and text questions
- Assessment targeting by department, role, or selected users
- Timed assessment attempts, automatic grading, manual review, and CSV export
- In-app notifications and scheduled compliance reminders
- Reports, dashboards, and append-only audit logs

## Technology

### Backend

- Node.js and TypeScript
- Express 5
- MongoDB with Mongoose
- JWT and bcryptjs authentication
- Zod validation
- Helmet, CORS, and Morgan

### Frontend

- React 19 and TypeScript
- Vite
- React Router
- Axios
- Recharts
- Lucide React
- Tailwind CSS

## Repository Layout

```text
faculty_enhancement/
├── backend/
│   ├── src/
│   │   ├── config/             # Database configuration
│   │   ├── controllers/        # API request handlers
│   │   ├── jobs/               # Compliance and reminder jobs
│   │   ├── middlewares/        # Authentication, RBAC, and errors
│   │   ├── models/             # Mongoose models
│   │   ├── routes/              # Versioned API routes
│   │   ├── seed/               # Demo data seeder
│   │   ├── services/           # Shared domain services
│   │   └── index.ts            # API entry point
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   └── my-app/
│       ├── src/
│       │   ├── api/            # Typed Axios API clients
│       │   ├── components/     # Layout, route guards, and UI components
│       │   ├── context/        # Authentication state
│       │   ├── hooks/          # Reusable API, auth, and notification hooks
│       │   ├── pages/          # Public, dashboard, training, appraisal, and admin views
│       │   ├── types/          # Shared frontend types
│       │   └── utils/          # Constants, navigation, and formatting helpers
│       ├── .env.example
│       ├── package.json
│       └── vite.config.ts
├── render.yaml                 # Render backend deployment configuration
└── README.md
```

## Requirements

- Node.js 18 or newer
- npm
- MongoDB Atlas or a local MongoDB server

## Local Setup

### 1. Configure the backend

```bash
cd backend
cp .env.example .env
```

Set the database and authentication values in `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/academiasync
JWT_SECRET=change_this_secret_in_development
JWT_EXPIRES_IN=7d
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

`MONGODB_URI` and `MONGODB_ATLAS_URI` are also supported as database variable names.

### 2. Configure the frontend

```bash
cd ../frontend/my-app
cp .env.example .env
```

For local development, use:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

The frontend also accepts a backend URL without `/api/v1` and adds the API path automatically.

### 3. Install dependencies

```bash
cd backend
npm install

cd ../frontend/my-app
npm install
```

### 4. Start the backend

```bash
cd backend
npm run dev
```

The backend provides:

- API root: http://localhost:5000/
- Health check: http://localhost:5000/health
- Versioned API: http://localhost:5000/api/v1

### 5. Start the frontend

In a second terminal:

```bash
cd frontend/my-app
npm run dev
```

Open http://localhost:5173 in a browser.

## Database Seeding

The backend automatically seeds a new empty database when it starts. You can also run the seeder explicitly:

```bash
cd backend
npm run seed
```

The seeder creates departments, subjects, users, faculty profiles, training programs, enrollments, competency records, appraisal cycles, and sample assessments. Running it clears and recreates the seed data, so do not use it against production data.

## Demo Accounts

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@academiasync.edu` | `Admin@123` |
| HOD, CSE | `hod.cse@academiasync.edu` | `Hod@123` |
| HOD, ECE | `hod.ece@academiasync.edu` | `Hod@123` |
| Dean | `dean@academiasync.edu` | `Dean@123` |
| HR | `hr@academiasync.edu` | `Hr@123` |
| Faculty, CSE | `faculty@academiasync.edu` | `Faculty@123` |
| Faculty, ECE | `faculty2@academiasync.edu` | `Faculty@123` |

## Backend Scripts

Run these commands from `backend/`:

```bash
npm run dev       # Development server with reload
npm run build     # Compile TypeScript to dist/
npm start         # Start the compiled server
npm run seed      # Clear and recreate demo data
```

## Frontend Scripts

Run these commands from `frontend/my-app/`:

```bash
npm run dev       # Start the Vite development server
npm run build     # Type-check and create a production build
npm run preview   # Preview the production build
npm run lint      # Run Oxlint
```

## API Areas

All API routes are mounted under `/api/v1`:

- `/auth` - login, registration, current user, and token refresh
- `/users` - user administration
- `/departments` - department management
- `/subjects` - subject management
- `/profiles` - faculty profiles
- `/training` - programs, enrollments, approvals, and learning content
- `/competency` - skill areas, competency records, and gap analysis
- `/appraisals` - cycles and appraisal workflows
- `/assessments` - custom assessments, responses, grading, analytics, and exports
- `/notifications` - user notifications
- `/reports` - institutional reporting
- `/audit` - administrative audit history
- `/recommendations` - training recommendations and compliance actions

## Deployment

### Backend on Render

The root `render.yaml` configures the backend as a Node web service:

- Root directory: `backend`
- Build command: `npm install --include=dev && npm run build`
- Start command: `npm start`

Set these environment variables in Render:

```text
JWT_SECRET
JWT_EXPIRES_IN
MONGO_URI
CORS_ORIGIN
```

Render supplies `PORT` automatically.

### Frontend on Vercel

The frontend includes `vercel.json` for SPA fallback routing. Set:

```text
VITE_API_URL=https://your-backend.onrender.com/api/v1
```

## Verification

Build both applications before deployment:

```bash
cd backend && npm run build
cd ../frontend/my-app && npm run build
```

## Security Notes

- Never commit `.env`, database credentials, or production JWT secrets.
- Use a long, unique `JWT_SECRET` in production.
- Restrict `CORS_ORIGIN` to the deployed frontend domain.
- Do not run `npm run seed` against production data.

## License

This project is intended for academic and institutional use and can be adapted for faculty development and performance management workflows.
