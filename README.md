# ServiceHub - Multi-Tenant SaaS Platform

ServiceHub is a multi-tenant SaaS platform engineered for service-based businesses (salons, tutors, repair & maintenance, photographers, consultants, wellness centers, and cleaning services).

This repository contains **Phase 1 — Project Foundation**, establishing a clean, scalable monorepo structure with a React frontend, Express REST API backend, and Prisma ORM configuration.

---

## 🚀 Technology Stack

- **Frontend**: React.js (v18), Vite, JavaScript, Tailwind CSS (v3), Lucide Icons
- **Backend**: Node.js, Express.js (v4), JavaScript (CommonJS)
- **Database / ORM**: PostgreSQL, Prisma ORM (v5)
- **Architecture**: Decoupled RESTful HTTP API (`/api/v1`)

---

## 📁 Project Structure

```
servicehub/
│
├── client/                     # Frontend Application (React + Vite + Tailwind CSS)
│   ├── public/                 # Static assets & SVG favicon
│   ├── src/
│   │   ├── components/         # Reusable UI components (Header, Footer, StatusCard)
│   │   ├── App.jsx             # Main Application Status Page
│   │   ├── main.jsx            # Application entry point
│   │   └── index.css           # Tailwind CSS directives & global styling
│   ├── index.html              # HTML shell
│   ├── vite.config.js          # Vite config & API reverse proxy configuration
│   ├── tailwind.config.js      # Tailwind CSS configuration
│   ├── postcss.config.js       # PostCSS configuration
│   ├── package.json            # Client dependencies
│   ├── .env.example            # Example frontend environment variables
│   └── .env                    # Local frontend environment variables
│
├── server/                     # Backend API Application (Node.js + Express + Prisma)
│   ├── prisma/
│   │   └── schema.prisma       # Prisma schema (PostgreSQL datasource)
│   ├── src/
│   │   ├── config/             # Environment & app configuration (env.js)
│   │   ├── controllers/        # Route controllers (healthController.js)
│   │   ├── middleware/         # Centralized error handler & 404 handler
│   │   ├── routes/             # API routes (healthRoutes.js)
│   │   ├── services/           # Business logic layer (reserved for Phase 2+)
│   │   ├── utils/              # Utility functions (asyncHandler.js)
│   │   ├── app.js              # Express app setup with middleware & routes
│   │   └── server.js           # HTTP server listener & error process handlers
│   ├── package.json            # Server dependencies
│   ├── .env.example            # Example backend environment variables
│   └── .env                    # Local backend environment variables
│
├── .gitignore                  # Git ignore rules for dependencies & secrets
└── README.md                   # Project documentation
```

---

## ⚙️ Environment Variables Required

### Server Environment (`server/.env`)

Create `server/.env` based on `server/.env.example`:

```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
DATABASE_URL="postgresql://username:password@localhost:5432/servicehub_db?schema=public"
```

### Client Environment (`client/.env`)

Create `client/.env` based on `client/.env.example`:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

> ⚠️ **Important**: Secrets and `.env` files are excluded via `.gitignore` and must never be committed.

---

## 🛠️ Installation & Setup

### Prerequisites

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher

### Step 1: Install Server Dependencies

```bash
cd server
npm install
```

### Step 2: Install Client Dependencies

```bash
cd ../client
npm install
```

---

## 🏃 Running the Application

### 1. Start the Backend API Server

From the `server` directory:

```bash
cd server
npm run dev
```

The Express API will start on **`http://localhost:5000`**.

### 2. Start the Frontend Application

From the `client` directory in a separate terminal:

```bash
cd client
npm run dev
```

The Vite dev server will start on **`http://localhost:5173`**.

---

## 🔍 How to Verify the Health Endpoint

### 1. Direct API Verification via `curl` or Browser

Execute the following request:

```bash
curl http://localhost:5000/api/v1/health
```

**Expected Response (`HTTP 200 OK`)**:

```json
{
  "status": "ok",
  "service": "servicehub-api"
}
```

### 2. Frontend Status Page Verification

Open **`http://localhost:5173`** in your browser.

- If the backend is running, the page will display **Backend Connection Healthy** along with response latency and payload details.
- If the backend is stopped, the page gracefully displays **Backend Unreachable** along with a **Refresh Status** retry button.

---

## 🗄️ Prisma Setup Status

Prisma ORM is initialized with PostgreSQL provider configuration in `server/prisma/schema.prisma`.

To generate the Prisma Client or validate the schema in future phases:

```bash
cd server
npx prisma validate
npx prisma generate
```

---

## 📋 Phase 1 Scope Verification Checklist

- [x] Project directory structure created
- [x] React + Vite + Tailwind CSS frontend initialized
- [x] Node.js + Express backend server initialized
- [x] Prisma initialized for PostgreSQL (`DATABASE_URL`)
- [x] Environment variable configuration separated (`.env.example` provided)
- [x] Health endpoint `GET /api/v1/health` implemented and returning HTTP 200 JSON response
- [x] Frontend status page displaying real-time API connectivity and graceful failure handling
- [x] `.gitignore` rules active to prevent secret leaks
- [x] Zero business models or future features implemented in Phase 1
