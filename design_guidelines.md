# FPF Wiki Knowledge Base - Design Guidelines

## Design Approach
**System-Based Approach**: Shadcn UI with Lyra preset - a utility-focused design system perfect for information-dense applications requiring clarity and efficiency.

## Core Design Elements

### Typography
- **Font Family**: Inter (Google Fonts)
- **Hierarchy**:
  - Page Titles: text-3xl font-bold
  - Section Headers: text-2xl font-semibold
  - Subsections: text-xl font-semibold
  - Body: text-base
  - Pattern IDs: font-mono text-sm
  - Metadata/Tags: text-sm text-muted-foreground

### Layout System
**Spacing Units**: Tailwind units of 2, 4, 6, 8, and 12 (e.g., p-4, gap-6, mb-8, py-12)
- Consistent section padding: p-6 or p-8
- Component gaps: gap-4 or gap-6
- Card padding: p-6
- Tight spacing for related items: gap-2

### Color System (Pre-defined)
- **Dark**: #18181b (zinc-900)
- **Neutral**: #71717a (zinc-500)
- **Primary Teal**: #14b8a6 (teal-500)
- **Teal Dark**: #0d9488 (teal-600)
- **Light Background**: #f4f4f5 (zinc-100)
- **Menu Accent**: Bold teal highlights for active navigation states

### Component Library

**Navigation**:
- Left sidebar with collapsible Part sections (A-G)
- Bold menu accents for active items
- Breadcrumb navigation at top
- Sticky search bar in header

**Core Components**:
- Cards (Shadcn Card) for artifact listings with hover states
- Badge components for tags, types, status
- Search with filters (Shadcn Command/Combobox)
- Data tables for artifact lists
- Tabs for switching between content views
- Dialog modals for admin CRUD operations

**Forms** (Admin):
- Shadcn Form components with validation
- Textarea for markdown content
- Select dropdowns for Part/Type selection
- Tag input for metadata
- Import helper with paste area

**Icons**: Tabler Icons throughout (via CDN)
- Search: IconSearch
- Parts navigation: IconFolder, IconFileText
- Edit/Create: IconEdit, IconPlus
- Links: IconExternalLink, IconLink
- Admin: IconLock, IconSettings

### Layout Structure

**Home Page**:
- Centered search bar (max-w-2xl)
- Quick Part navigation cards in grid (grid-cols-2 md:grid-cols-3 lg:grid-cols-4)
- Recent updates section below
- No hero image - focus on functional entry point

**Main Application Layout**:
- Fixed left sidebar (w-64) with Part hierarchy
- Main content area (flex-1) with max-w-4xl for readability
- Sticky top navigation with breadcrumbs and global search
- Right sidebar (w-48) for "Referenced by" backlinks when viewing artifact

**Artifact Page**:
- Pattern ID and title prominently at top
- Metadata badges (Part, Type, Tags) below title
- Markdown content with proper heading hierarchy
- "Referenced by" section at bottom
- Edit button (admin only) in top-right corner

**Search Results**:
- Filter sidebar on left
- Results as list with snippet previews
- Highlight matching terms
- Part/Type badges for each result

### Information Density
- Dense but scannable: proper whitespace between sections
- Code/Pattern ID blocks with monospace font and subtle background
- Clear visual separation between metadata and content
- Generous line-height (leading-relaxed) for markdown content

### Interaction Patterns
- Hover states on all interactive elements
- Auto-linking for Pattern IDs (e.g., A.2.6, F.17)
- Keyboard shortcuts for search (/)
- Smooth scrolling for anchor links
- Loading states for search/navigation

### Responsive Behavior
- Sidebar collapses to drawer on mobile
- Search becomes full-width on small screens
- Grid layouts stack to single column on mobile
- Tables become horizontally scrollable or card-based

## Images
No hero images. This is a documentation/wiki application focused on information architecture and discoverability. Visual elements are limited to:
- Part navigation icons (Tabler Icons)
- UI component decorations
- Potential small illustrative diagrams within artifact content (user-provided)