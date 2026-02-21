# HouseHunter

## Overview

HouseHunter is a full-stack web application for tracking and managing a house/apartment hunting journey. Users can add rental properties, track their status (shortlisted, visited, offered, rejected, accepted), manage contacts for each property, log distances to custom locations (like office or school), schedule visits, and create follow-up tasks. The app features a dashboard with upcoming visits and follow-ups, a property list with search/filter, detailed property pages with tabbed sections, and a custom locations management page.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router) with routes: `/` (dashboard), `/properties` (list), `/properties/:id` (details), `/locations` (settings)
- **State Management**: TanStack React Query for server state (caching, mutations, invalidation)
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **Styling**: Tailwind CSS with CSS variables for theming, custom fonts (Plus Jakarta Sans, Outfit)
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Forms**: React Hook Form with Zod resolvers for validation
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend
- **Framework**: Express 5 on Node.js with TypeScript (run via tsx)
- **API Pattern**: RESTful JSON API under `/api/` prefix. Routes are defined in a shared route contract (`shared/routes.ts`) that includes method, path, input schema, and response schemas — used by both server handlers and client hooks
- **Server Entry**: `server/index.ts` creates an HTTP server, registers API routes, and either serves Vite dev middleware or static production files
- **Development**: Vite dev server runs as middleware with HMR over the same HTTP server
- **Production Build**: Client built with Vite, server bundled with esbuild into `dist/index.cjs`

### Shared Layer (`shared/`)
- **Schema** (`shared/schema.ts`): Drizzle ORM table definitions and Zod insert schemas (via `drizzle-zod`). This is the single source of truth for types and validation on both client and server.
- **Routes** (`shared/routes.ts`): API contract defining endpoints, HTTP methods, input schemas, and response types. Both the Express routes and React Query hooks reference this contract.

### Database
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Connection**: `node-postgres` (pg) Pool using `DATABASE_URL` environment variable
- **Schema Push**: `drizzle-kit push` for applying schema changes (no migration files needed for dev)
- **Tables**:
  - `locations` — Custom places (office, school) with name, address, optional lat/lng
  - `properties` — Rental listings with address, rent, bedrooms, bathrooms, area, type, status, notes, link, image
  - `property_contacts` — Contacts per property (name, role, phone, email)
  - `property_distances` — Distance from a property to a location (miles, commute time, mode)
  - `property_visits` — Scheduled visits with notes and completion status
  - `property_follow_ups` — Follow-up tasks with due dates and completion status
- **Relationships**: Foreign keys with cascade deletes. Property details endpoint joins all related tables.

### Storage Layer
- **Pattern**: Repository/storage interface (`IStorage`) implemented by `DatabaseStorage` class
- **Location**: `server/storage.ts` — all database operations go through this layer

### Key Design Decisions
1. **Shared route contract** — Eliminates drift between frontend and backend by defining API shape once with Zod schemas
2. **Drizzle + drizzle-zod** — Schema defines both database structure and validation schemas, reducing duplication
3. **No authentication** — This is a personal tool; no auth layer exists
4. **Manual distances** — Commute distances are entered manually (UI designed to support future automation)
5. **Status-driven workflow** — Properties flow through statuses: shortlisted → visited → offered → accepted/rejected

## External Dependencies

### Database
- **PostgreSQL** — Required. Connected via `DATABASE_URL` environment variable. Used for all persistent storage.

### Key npm Packages
- `drizzle-orm` + `drizzle-kit` — ORM and schema management
- `express` v5 — HTTP server
- `@tanstack/react-query` — Async state management
- `zod` + `drizzle-zod` — Schema validation
- `react-hook-form` + `@hookform/resolvers` — Form handling
- `wouter` — Client-side routing
- `framer-motion` — Animations
- `date-fns` — Date formatting
- `react-day-picker` — Calendar components
- `recharts` — Charts (referenced in UI components)
- `lucide-react` — Icon library
- Full shadcn/ui component suite (Radix UI primitives)

### Replit-Specific
- `@replit/vite-plugin-runtime-error-modal` — Runtime error overlay in development
- `@replit/vite-plugin-cartographer` — Dev tooling (dev only)
- `@replit/vite-plugin-dev-banner` — Dev banner (dev only)