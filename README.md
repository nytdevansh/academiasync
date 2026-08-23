# AcademiaSync

AcademiaSync is a full-stack faculty enhancement and performance management platform for university campuses. It supports faculty lifecycle workflows across profile management, competency tracking, training approvals, appraisals, notifications, dashboards, and audit visibility across departments.

## Overview

The application is designed for campus-wide deployment with configurable departments and subjects, role-aware access, and an extensible architecture for future modules.

### Core capabilities
- Faculty profile management
- Department and subject configuration
- Training catalog, nominations, approvals, and completion tracking
- Competency assessment and skill gap monitoring
- Appraisal cycles and review workflows
- Notifications and audit log tracking
- Reporting and dashboard views by role
- Role-based access for faculty, HOD, dean, HR, and administrator

## Stack

### Backend
- Node.js
- TypeScript
- Express
- MongoDB with Mongoose
- JWT authentication
- RBAC middleware
- Zod validation

### Frontend
- React
- TypeScript
- Vite
- React Router
- Axios
- Recharts
- Lucide icons

## Repository structure

```text
faculty_enhancement/
├── backend/
│   ├── src/
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   └── my-app/
│       ├── src/
│       ├── package.json
│       └── vite.config.ts
├── README.md
└── .gitignore
```

## Prerequisites

Before running the project, ensure you have:
- Node.js 18+
- npm
- MongoDB Atlas connection string or a local MongoDB instance

## Environment setup

### Backend
Create a backend environment file:

```bash
cd backend
cp .env.example .env
```

Then update the values in `.env`:

```env
PORT=5000
MONGODB_ATLAS_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/academiasync?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_here_change_in_production
JWT_EXPIRES_IN=7d
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

## Installation

### 1) Install backend dependencies

```bash
cd backend
npm install
```

### 2) Install frontend dependencies

```bash
cd frontend/my-app
npm install
```

## Run the app

### Backend

```bash
cd backend
npm run dev
```

Backend will run on:
- http://localhost:5000
- Health check: http://localhost:5000/health

### Frontend

```bash
cd frontend/my-app
npm run dev
```

Frontend will run on:
- http://localhost:5173

## Database seeding

Seed the system with demo data and login accounts:

```bash
cd backend
npm run seed
```

### Demo accounts

```text
admin@academiasync.edu     Admin@123
hod.cse@academiasync.edu   Hod@123
dean@academiasync.edu      Dean@123
hr@academiasync.edu        Hr@123
faculty@academiasync.edu   Faculty@123
faculty2@academiasync.edu  Faculty@123
```

## Available scripts

### Backend
```bash
npm run dev     # development server
npm run build   # TypeScript compile
npm run start   # production server
npm run seed    # populate demo data
```

### Frontend
```bash
npm run dev     # Vite dev server
npm run build   # production build
npm run preview # local preview build
```

## API overview

The backend exposes routes under `/api/v1`:

- `/api/v1/auth`
- `/api/v1/users`
- `/api/v1/departments`
- `/api/v1/subjects`
- `/api/v1/profiles`
- `/api/v1/training`
- `/api/v1/competency`
- `/api/v1/appraisals`
- `/api/v1/notifications`
- `/api/v1/reports`
- `/api/v1/audit`

## Notes

- The project is structured for modular expansion with department-specific and subject-specific configuration.
- The frontend includes role-aware views and mock-ready service modules for API integration.
- The backend is built to support MongoDB Atlas deployment and environment-based configuration.

## License

This project is intended for academic and institutional use and can be adapted for campus enhancement workflows.
