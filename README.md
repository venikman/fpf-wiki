# FPF Wiki

A knowledge base for the **First Principles Framework (FPF)** - a specification for organizing knowledge using structured sections, cross-references, and bounded contexts.

## Project Structure

```text
fpf-wiki/
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
1. **Spec ingestion**: `fpf_doc`, `fpf_section`, `fpf_clause`, `fpf_xref`
2. **Generic FPF storage**: `fpf_episteme_kind`, `fpf_episteme_kind_slot`, `fpf_episteme_card`, `fpf_episteme_card_slot`

FTS5 full-text search tables are created best-effort for content search.

## Setup

```bash
turso db create fpf-wiki
turso db shell fpf-wiki < fpf.schema.v1.sql
```

## Environment Variables

Create a `.env` file:

```env
DATABASE_URL=libsql://your-database.turso.io?authToken=your-token
```

## Automation

- A Pages workflow (`.github/workflows/upstream-fpf-pages.yml`) builds a simple snapshot page from the latest `ailev/FPF` `main` commit. It runs on:
  - `repository_dispatch` with type `ailev-fpf-main` (recommended trigger from `ailev/FPF` on each `main` push)
  - manual `workflow_dispatch`
- To trigger from `ailev/FPF`, add a step in that repository that sends a dispatch using a `repo`-scoped token:

```bash
curl -X POST \
  -H "Authorization: Bearer $DISPATCH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/venikman/fpf-wiki/dispatches \
  -d '{"event_type":"ailev-fpf-main","client_payload":{"source_repo":"ailev/FPF","ref":"main"}}'
```

The published snapshot is available via GitHub Pages for this repository after the workflow completes.

## License

MIT
