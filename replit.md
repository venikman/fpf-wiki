# FPF Wiki Knowledge Base

## Overview
A read-only wiki knowledge base application for the Formal Project Framework (FPF) specification. The application provides searchable browsing of FPF artifacts organized by Parts A-G, pattern ID auto-linking, backlinks ("Referenced by"), and markdown rendering.

## Project Architecture

### Tech Stack
- **Frontend**: React with TypeScript, Vite, Tailwind CSS, Shadcn UI
- **Backend**: Express.js with TypeScript
- **Storage**: In-memory static data (read-only, 15 FPF artifacts embedded)
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
│   │   └── artifact.tsx # Individual artifact display
│   ├── hooks/          # Custom React hooks
│   └── lib/            # Utility functions
├── server/
│   ├── index.ts        # Express server entry
│   ├── routes.ts       # Read-only API endpoints
│   └── storage.ts      # In-memory storage with static FPF data
├── shared/
│   └── schema.ts       # Type definitions
```

### Data Model
- **Artifact**: FPF patterns with fields:
  - patternId (e.g., "A.1", "B.2.3")
  - title, part (A-G), type, status
  - techLabel, plainLabel, tags
  - problemFrame, problem, forces, solution
  - conformanceChecklist, antiPatterns, relations

### API Endpoints (Read-Only)
- `GET /api/artifacts` - List all artifacts with optional query/part/type filters
- `GET /api/artifacts/:patternId` - Get artifact by pattern ID
- `GET /api/search` - Search artifacts with filters

## Design System
- **Theme**: Teal primary (#14b8a6), zinc base colors
- **Font**: Inter
- **Icons**: Tabler icons (via lucide-react)
- **Dark mode**: Supported with class-based toggle

## Running the Project
The application runs on port 5000 with `npm run dev`.

## Recent Changes
- Removed PostgreSQL database - now uses in-memory static data
- Removed user accounts, admin functionality, and all write operations
- Simplified to read-only wiki with 15 embedded FPF artifacts
