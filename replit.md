# FPF Wiki Knowledge Base

## Overview
A read-only wiki knowledge base application for the Formal Project Framework (FPF) specification. The application provides searchable browsing of FPF artifacts organized by Parts A-G, pattern ID auto-linking, backlinks ("Referenced by"), and markdown rendering.

## Tech Stack

### Framework
- **Starlight** (Astro-based documentation framework)
- **React** integration for interactive components (React islands)
- **Tailwind CSS** with Starlight's built-in Tailwind setup
- **shadcn/ui** components (React + Tailwind) used as React islands

### Architecture Pattern
- Starlight provides docs chrome (sidebar, header, search, dark mode)
- shadcn/ui components embedded in MDX pages for interactive UI elements
- React components hydrated with `client:load` or `client:visible` directives
- All shadcn subcomponents composed in `.tsx` wrappers (not scattered in .astro/MDX)

### Key Constraints
- shadcn/Radix component trees must be composed inside single `.tsx` wrapper files
- Mount wrappers as React islands in MDX, not individual subcomponents
- Use `class="not-content"` to disable Starlight's content styling when needed
- Starlight's dark mode syncs with Tailwind `dark:` variants automatically

### Directory Structure
```
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   └── demos/           # React wrapper components for MDX
│   ├── content/
│   │   └── docs/            # Starlight MDX documentation pages
│   │       ├── parts/       # Parts A-G artifact pages
│   │       └── index.mdx    # Home page
│   └── styles/              # Tailwind styles
├── astro.config.mjs         # Astro + Starlight + React config
└── tailwind.config.mjs      # Tailwind configuration
```

### Component Pattern (MWE)

**React wrapper** `src/components/demos/MyComponent.tsx`:
```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function MyComponent() {
  return (
    <Card>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  );
}
```

**Starlight doc page** `src/content/docs/example.mdx`:
```mdx
---
title: Example
---

import { MyComponent } from "../../components/demos/MyComponent";

<MyComponent client:load />
```

### Data Model
- **Artifact**: FPF patterns with fields:
  - patternId (e.g., "A.1", "B.2.3")
  - title, part (A-G), type, status
  - techLabel, plainLabel, tags
  - problemFrame, problem, forces, solution
  - conformanceChecklist, antiPatterns, relations

### Design System
- **Theme**: Teal primary (#14b8a6), zinc base colors
- **Font**: Inter
- **Icons**: Tabler icons (via lucide-react)
- **Dark mode**: Starlight's built-in dark mode with Tailwind integration

## Setup Steps
1. Starlight + Tailwind: Use Starlight's Tailwind setup
2. Add React: `npx astro add react`
3. Install shadcn/ui for Astro: add tsconfig path alias, run `shadcn@latest init`
4. Add components: `shadcn@latest add button card dialog ...`
5. Use in docs via MDX with `client:load` hydration

## Recent Changes
- Switched from React/Vite to Starlight/Astro framework
- Using shadcn/ui as React islands within Starlight docs
- In-memory static data for read-only artifact browsing
