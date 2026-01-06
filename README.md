# FPF Wiki

A knowledge base for the **First Principles Framework (FPF)** - a specification for organizing knowledge using structured sections, cross-references, and bounded contexts.

## Project Structure

```
fpf-wiki/
├── FPF.md                  # Complete FPF specification (~43K lines)
├── fpf.spec-model.v1.js    # ESM parser for FPF markdown
├── fpf.schema.v1.sql       # SQLite/Turso database schema
├── workshop-method.md      # Decision Desktop methodology
└── TODO.md                 # Testing verification plan
```

## Components

### FPF Specification (`FPF.md`)

The core specification document containing:
- Part A: Kernel definitions
- Part B: Extensions and bounded contexts
- CC-clauses: Conformance criteria
- Cross-references between sections

### Parser (`fpf.spec-model.v1.js`)

Dependency-free ESM parser that extracts:
- Sections with hierarchical references (e.g., `A.1`, `A.1:4.1`)
- CC-clauses (conformance criteria)
- Cross-references and backlinks

```javascript
import { parseFpfSpecMarkdown, ingestFpfSpecMarkdown } from './fpf.spec-model.v1.js';

// Parse markdown into structured data
const { doc, sections, clauses, xrefs } = parseFpfSpecMarkdown(md, {
  doc_ref: 'FPF-Spec(4)',
  title: 'FPF-Spec (4)'
});

// Ingest into database
await ingestFpfSpecMarkdown(query, { doc_ref: 'FPF-Spec(4)', title: 'FPF-Spec (4)', md });
```

### Database Schema (`fpf.schema.v1.sql`)

SQLite/Turso schema with two phases:
1. **Spec ingestion**: `spec_docs`, `spec_sections`, `spec_clauses`, `spec_xrefs`
2. **Generic FPF storage**: `fpf_universes`, `fpf_holons`, `fpf_claims`, `fpf_evidence`

## Setup

```bash
# Install dependencies (if adding a runtime later)
bun install

# Initialize database (requires Turso CLI or SQLite)
turso db create fpf-wiki
turso db shell fpf-wiki < fpf.schema.v1.sql
```

## Environment Variables

Create a `.env` file:

```env
DATABASE_URL=libsql://your-database.turso.io?authToken=your-token
```

## License

MIT
