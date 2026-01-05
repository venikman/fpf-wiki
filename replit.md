# FPF Wiki Knowledge Base

## Overview
A wiki knowledge base application for the Formal Project Framework (FPF) specification. The application provides searchable browsing of FPF artifacts organized by Parts A-G, pattern ID auto-linking, backlinks ("Referenced by"), markdown rendering, global search with filters, and admin CRUD operations.

## Project Architecture

### Tech Stack
- **Frontend**: React with TypeScript, Vite, Tailwind CSS, Shadcn UI
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL via Drizzle ORM
- **Routing**: wouter for client-side routing
- **State Management**: TanStack Query for server state

### Directory Structure
```
├── client/src/
│   ├── components/     # Reusable UI components
│   │   ├── ui/         # Shadcn UI components
│   │   ├── app-sidebar.tsx  # Navigation sidebar with Parts A-G
│   │   ├── search-bar.tsx   # Global search with keyboard shortcuts
│   │   ├── artifact-card.tsx # Card display for artifacts
│   │   ├── backlinks.tsx    # Referenced-by section
│   │   ├── pattern-link.tsx # Auto-linking for pattern IDs
│   │   └── markdown-content.tsx # Markdown renderer
│   ├── pages/          # Route pages
│   │   ├── home.tsx    # Home page with search and Part navigation
│   │   ├── search.tsx  # Search results with filters
│   │   ├── artifact.tsx # Individual artifact display
│   │   └── admin.tsx   # Admin CRUD operations
│   ├── hooks/          # Custom React hooks
│   └── lib/            # Utility functions
├── server/
│   ├── index.ts        # Express server entry
│   ├── routes.ts       # API endpoints
│   ├── storage.ts      # Database storage interface
│   └── db.ts           # Drizzle database connection
├── shared/
│   └── schema.ts       # Drizzle schema and types
```

### Database Schema
- **users**: User accounts with admin flag
- **artifacts**: FPF patterns with fields:
  - patternId (unique, e.g., "A.1", "B.2.3")
  - title, part (A-G), type, status
  - techLabel, plainLabel, tags
  - problemFrame, problem, forces, solution
  - conformanceChecklist, antiPatterns, relations
  - rationale, body, references

### API Endpoints
- `GET /api/artifacts` - List all artifacts with optional query/part/type filters
- `GET /api/artifacts/:patternId` - Get artifact by pattern ID or UUID
- `POST /api/artifacts` - Create new artifact
- `PATCH /api/artifacts/:id` - Update artifact
- `DELETE /api/artifacts/:id` - Delete artifact
- `GET /api/search` - Search artifacts with filters

## Design System
- **Theme**: Teal primary (#14b8a6), zinc base colors
- **Font**: Inter
- **Icons**: Tabler icons (via lucide-react)
- **Dark mode**: Supported with class-based toggle

## Running the Project
The application runs on port 5000 with `npm run dev`. Database schema is managed with `npm run db:push`.

## Recent Changes
- Migrated from MemStorage to PostgreSQL DatabaseStorage
- Added seed data with 15 FPF artifacts from Parts A-G
- Pattern ID auto-linking in content
- Backlinks calculation for "Referenced by" functionality
