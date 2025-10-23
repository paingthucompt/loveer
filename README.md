# Invoice Craftsman

Full-stack invoicing dashboard built with a Vite + React frontend and a Node.js/Express API backed by PostgreSQL. Users can manage clients, record transactions, and generate downloadable invoices with automatic commission and payout calculations.

## Stack

- **Frontend**: Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query
- **Backend**: Express, Prisma ORM, PostgreSQL, JWT authentication, Zod validation
- **PDF generation**: jsPDF

## Project Structure

```
.
├── src/                # Frontend application
├── public/             # Static assets
├── server/             # Express API + Prisma schema
└── README.md
```

## Prerequisites

- Node.js 18+
- pnpm/npm/bun (examples use npm)
- PostgreSQL database

## Environment Variables

### Frontend (`.env`)

```
VITE_API_BASE_URL="http://localhost:4000"
```

### Backend (`server/.env`)

Copy `server/.env.example` and set the following:

```
DATABASE_URL="postgresql://user:password@localhost:5432/invoice_craftsman"
JWT_SECRET="change-me"
PORT=4000
FRONTEND_ORIGIN="http://localhost:5173"
```

## Setup

1. **Install frontend dependencies**
   ```sh
   npm install
   ```

2. **Install backend dependencies**
   ```sh
   cd server
   npm install
   ```

3. **Generate Prisma client & apply migrations**
   ```sh
   npx prisma generate
   npx prisma migrate deploy
   ```

## Development

Run the API and frontend in separate terminals:

```sh
# Terminal 1 - backend
cd server
npm run dev

# Terminal 2 - frontend
npm run dev
```

Frontend defaults to `http://localhost:5173` and expects the API at `http://localhost:4000`.

## Production Build

```sh
npm run build        # Frontend build (outputs to dist/)
cd server
npm run build        # Compile TypeScript API to dist/
```

Serve the compiled API with `npm start` and host the frontend `dist/` folder behind a static web server or CDN.

## Deployment Notes

- Configure PostgreSQL and run `prisma migrate deploy` during deployment.
- Set `FRONTEND_ORIGIN` to your production domain before starting the API.
- Use a process manager (PM2/systemd) for the backend and a reverse proxy (nginx/Caddy) for HTTPS.
- Regenerate a strong `JWT_SECRET` for production.

## Scripts

### Frontend

- `npm run dev` – start Vite dev server
- `npm run build` – production bundle
- `npm run preview` – preview build output
- `npm run lint` – ESLint

### Backend (`server/`)

- `npm run dev` – start Express API with live reload
- `npm run build` – compile TypeScript
- `npm start` – run compiled API
- `npm run prisma:generate` – Prisma client generation
- `npm run prisma:migrate` – run migrations in production

## Authentication

The API issues signed JWTs. Tokens are stored in `localStorage` and sent via `Authorization: Bearer <token>` headers. Use the `/auth/register`, `/auth/login`, and `/auth/me` endpoints to manage sessions.
