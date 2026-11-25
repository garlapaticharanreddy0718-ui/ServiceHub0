# ServiceHub

A full-stack multi-business service management platform built with **React.js, Node.js, Express.js, PostgreSQL, and Prisma**.

ServiceHub allows businesses such as salons, fitness centers, tutors, repair services, and consultants to manage their services, staff, customers, and appointments from a single platform.

## Live Demo

**Frontend:** https://servicehub0.vercel.app/

**Backend API:** https://servicehub0.onrender.com

**Health Check:** https://servicehub0.onrender.com/api/v1/health

## Features

### Authentication & Authorization
- Secure user authentication
- JWT-based access authentication
- HttpOnly refresh-token cookies
- Password hashing with bcrypt
- Role-based access control
- Protected routes
- Session persistence across browser refreshes

### Multi-Tenant Business Management
- Multiple businesses supported
- Business-specific data isolation
- Business membership management
- Owner, Admin, and Staff roles
- Role-based permissions

### Service Management
- Create and manage services
- Service categories
- Service pricing
- Service duration
- Staff-service assignment

### Staff Management
- Add and manage staff members
- Staff roles and permissions
- Staff schedules
- Staff breaks
- Staff time-off management
- Staff availability validation

### Customer Management
- Customer profiles
- Customer contact information
- Customer notes
- Business-specific customer records
- CRM functionality

### Appointment Management
- Create and manage bookings
- Customer and service selection
- Staff assignment
- Appointment duration and pricing
- Availability validation
- Schedule conflict detection
- Booking status management
- Booking status history
- Business-scoped appointments

### Dashboard & Management UI
- Professional SaaS-style interface
- Responsive design
- Business dashboard
- Appointment management
- Calendar
- Customer management
- Service management
- Staff management
- Role-specific experiences

## Tech Stack

### Frontend
- React.js
- JavaScript
- Vite
- Tailwind CSS
- React Router

### Backend
- Node.js
- Express.js
- JavaScript
- JWT
- bcryptjs
- Zod

### Database
- PostgreSQL
- Prisma ORM
- Supabase PostgreSQL

### Deployment
- Vercel — Frontend
- Render — Backend
- Supabase — PostgreSQL Database

## Architecture

```text
                    ┌─────────────────────┐
                    │      User Browser    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React + Vite      │
                    │   Frontend (Vercel)  │
                    └──────────┬──────────┘
                               │ REST API
                               ▼
                    ┌─────────────────────┐
                    │ Node.js + Express    │
                    │ Backend (Render)     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      Prisma ORM      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ PostgreSQL / Supabase│
                    └─────────────────────┘
```

## Authentication Flow

ServiceHub uses an access-token and refresh-token authentication architecture.

```text
User Login
    │
    ▼
Backend validates credentials
    │
    ▼
Access Token + HttpOnly Refresh Token
    │
    ▼
Frontend stores authentication state
    │
    ▼
Protected API Requests
    │
    ▼
Access Token Expiry
    │
    ▼
Refresh Token
    │
    ▼
New Access Token
```

The refresh token is stored using an **HttpOnly cookie**, helping prevent direct JavaScript access to the refresh token.

## Role-Based Access Control

ServiceHub supports three primary business roles:

| Role | Responsibilities |
|---|---|
| OWNER | Full business management |
| ADMIN | Manage business operations and resources |
| STAFF | Manage assigned services and appointments |

Access to business resources is scoped according to the authenticated user's business membership and role.

## Multi-Tenancy

Each business operates within its own isolated data scope.

For example:

```text
Business A
 ├── Customers
 ├── Services
 ├── Staff
 └── Bookings

Business B
 ├── Customers
 ├── Services
 ├── Staff
 └── Bookings
```

Users can only access resources belonging to businesses for which they have the appropriate membership.

## Booking Validation

The booking system performs server-side validation for:

- Business ownership
- Customer association
- Service availability
- Staff-service assignment
- Staff working schedule
- Staff breaks
- Staff time off
- Schedule conflicts
- Appointment duration
- Appointment pricing

This prevents invalid or conflicting appointments from being created.

## Project Structure

```text
ServiceHub0/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── prisma.js
│   │   └── server.js
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
├── README.md
└── .gitignore
```

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/garlapaticharanreddy0718-ui/ServiceHub0.git
cd ServiceHub0
```

### 2. Install frontend dependencies

```bash
cd client
npm install
```

### 3. Install backend dependencies

```bash
cd ../server
npm install
```

### 4. Configure environment variables

Create the required `.env` files for the frontend and backend.

Do not commit environment variables, API keys, database credentials, JWT secrets, or other sensitive information to GitHub.

### 5. Generate Prisma Client

```bash
cd server
npx prisma generate
```

### 6. Apply database migrations

```bash
npx prisma migrate deploy
```

### 7. Start the backend

```bash
npm start
```

### 8. Start the frontend

In another terminal:

```bash
cd client
npm run dev
```

The frontend can then be accessed through the Vite development server.

## Environment Variables

The exact values should be configured locally and in the deployment platforms.

Typical configuration includes:

### Frontend

```env
VITE_API_URL=your_backend_api_url
```

### Backend

```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
```

Never commit real production values to the repository.

## Database

ServiceHub uses **PostgreSQL** with **Prisma ORM**.

The database schema contains entities supporting:

- Users
- Businesses
- Business memberships
- Services
- Service categories
- Staff
- Staff schedules
- Staff breaks
- Staff time off
- Customers
- Customer notes
- Bookings
- Booking status history
- Refresh tokens

Database schema changes should be handled through Prisma migrations.

## Production Deployment

### Frontend

The React frontend is deployed using Vercel.

```text
React/Vite
     │
     ▼
   Vercel
```

### Backend

The Express backend is deployed using Render.

```text
Node.js + Express
        │
        ▼
      Render
```

### Database

The production PostgreSQL database is hosted using Supabase.

```text
Prisma
   │
   ▼
Supabase PostgreSQL
```

## Security

ServiceHub follows several security practices:

- JWT authentication
- HttpOnly refresh-token cookies
- bcrypt password hashing
- Zod request validation
- Protected API routes
- Role-based authorization
- Business-level data isolation
- Server-side booking validation
- Environment variables for secrets
- Prisma ORM for database access

## API Health Check

The backend provides a health-check endpoint:

```text
GET /api/v1/health
```

This endpoint can be used to verify that the backend service is running.

## Future Improvements

Potential future improvements include:

- Online payment integration
- Email notifications
- SMS notifications
- Advanced analytics
- Automated reminders
- Recurring appointments
- Business subscription plans
- Customer self-service booking
- Advanced reporting
- Mobile application

## Learning & Development

This project demonstrates practical experience with:

- Full-stack web development
- REST API development
- React application architecture
- Authentication and authorization
- JWT and refresh-token systems
- RBAC
- Multi-tenancy
- PostgreSQL database design
- Prisma ORM
- API validation
- Appointment scheduling
- Production deployment
- Cloud database management
- Frontend/backend integration

## Author

**Charan Reddy Garlapati**

B.Tech — Computer Science Engineering (AI/ML)

---

⭐ If you find this project useful, consider giving the repository a star.
