# 🎓 Siksha Intelligence — Frontend (MVP)

Empowering Education through Intelligent Management.

Siksha Intelligence (formerly EduSync) is a high-performance, white-labelled, multi-tenant School ERP platform. This frontend is built using React 19, Vite, and Tailwind CSS, designed to communicate with a Spring Boot microservices backend.

## 🛠️ Tech Stack

- **Core:** React 19 + TypeScript
- **Build Tool:** Vite (rolldown-vite)
- **Styling:** Tailwind CSS (PostCSS pipeline)
- **UI Components:** shadcn/ui (high-density enterprise UI)
- **State Management:** Zustand
- **Data Fetching:** TanStack Query v5
- **Forms:** React Hook Form + Zod
- **Networking:** Axios (with multi-tenant interceptors)

> Note: This repository currently uses Tailwind CSS v3 for shadcn compatibility.

## 📂 Project Structure

We follow a Domain-Driven / Feature-Based architecture. This ensures that the code for Finance doesn't leak into Academics, keeping the bundle lean and the logic isolated.

```text
src/
├── assets/             # Global static files (logos, brand icons)
├── components/         # Shared UI components
│   ├── ui/             # shadcn atoms (Button, Input, Table)
│   ├── common/         # Molecules (DataTable, FormField, Modal)
│   └── layout/         # App shells (Sidebar, Navbar, DashboardWrapper)
├── config/             # Env variables & global constants
├── features/           # Domain-Specific Modules (The "Heart")
│   ├── auth/           # IAM: Login, MFA, Permissions
│   ├── uis/            # User Info: Students, Staff, Guardians
│   ├── academics/      # ADM: Classes, Schedules, Subjects
│   └── finance/        # Billing, Invoices, Fees
├── hooks/              # Global reusable hooks
├── lib/                # 3rd party configs (Axios, QueryClient)
├── pages/              # Route-level views (Lazy-loaded)
├── routes/             # Route definitions & Guarded Routes
├── services/           # Shared API services
├── store/              # Global state (Zustand stores)
├── types/              # TS Interfaces (Mirrored from Backend DTOs)
└── utils/              # Helper functions (Date formatters, Currency)
```

## 🚀 Getting Started

### 1) Prerequisites

- **Node.js:** v20+ (LTS recommended)
- **Package Manager:** npm (or pnpm)

### 2) Installation

```bash
# Clone the repository
git clone https://github.com/ashugolem/siksha-intelligence-frontend-mvp.git

# Enter the project
cd siksha-intelligence-frontend-mvp

# Install dependencies
npm install
```

### 3) Environment Setup

Create a `.env` file in the root directory (you can copy from `.env.example`):

```bash
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_APP_NAME="Siksha Intelligence"
```

### 4) Development

```bash
npm run dev
```

## 🛡️ Key Architectural Principles

### 1) Multi-Tenancy (White Labelling)

The application identifies the tenant via the URL (e.g., `school-a.siksha.ai`). The Axios Interceptor in `src/lib/axios.ts` should inject the `X-Tenant-ID` header into every request based on the current context.

### 2) Type Safety

We do not use `any`. All API responses must have a corresponding interface in `src/types/`. These types should strictly follow the schemas defined in the **UIS_Database_Schema_Document**.

### 3) Form Handling

All forms must be validated using Zod schemas. This prevents invalid data from reaching our Spring Boot backend and provides immediate user feedback.

### 4) Component Density

Since this is an ERP, keep components high-density. Avoid excessive whitespace; ensure that administrators can see maximum data (Students/Teachers/Invoices) without unnecessary scrolling.

## 📜 Coding Conventions

- **Components:** PascalCase (e.g., `StudentTable.tsx`)
- **Hooks:** camelCase starting with `use` (e.g., `useStudentData.ts`)
- **Features:** folder-per-feature. Each feature should contain its own `api/`, `components/`, and `hooks/`.
- **Imports:** use the `@/` alias for clean imports (e.g., `import { Button } from "@/components/ui/button"`).

## 🛠️ Build & Deployment

```bash
# Production build
npm run build

# Preview production build locally
npm run preview
```

The build is optimized for cloud deployment (AWS/Vercel) and uses code-splitting to ensure each module (IAM, UIS, etc.) is only loaded when the user navigates to it.
