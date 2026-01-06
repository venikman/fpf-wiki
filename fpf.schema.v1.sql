-- FPF Schema v1 for SQLite/Turso
-- Stores FPF-Spec documents as structured sections + extracted CC clauses + xrefs,
-- plus generic episteme card/kind storage for real FPF data.
-- FTS5 is optional and created best-effort.

-- ============================================================================
-- PART 1: Spec Ingestion Tables (Markdown decomposed)
-- ============================================================================

-- Master document table
CREATE TABLE IF NOT EXISTS fpf_doc (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ref         TEXT NOT NULL UNIQUE,           -- e.g., 'FPF-Spec(4)'
    title       TEXT NOT NULL,                   -- e.g., 'FPF-Spec (4)'
    version     TEXT,                            -- spec version if extractable
    ingested_at TEXT DEFAULT (datetime('now')),
    raw_hash    TEXT,                            -- SHA-256 of source markdown
    meta_json   TEXT                             -- additional metadata
);

-- Sections extracted from headings (hierarchical)
CREATE TABLE IF NOT EXISTS fpf_section (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    doc_id      INTEGER NOT NULL REFERENCES fpf_doc(id) ON DELETE CASCADE,
    ref         TEXT NOT NULL,                   -- e.g., 'A.1.1:4.1', 'C.2.1'
    title       TEXT NOT NULL,                   -- section title text
    level       INTEGER NOT NULL,                -- heading level (1-6)
    ord         INTEGER NOT NULL,                -- ordering within document
    parent_id   INTEGER REFERENCES fpf_section(id), -- parent section
    text        TEXT,                            -- full section content (optional)
    line_start  INTEGER,                         -- source line number start
    line_end    INTEGER,                         -- source line number end
    UNIQUE(doc_id, ord)                          -- ord is unique per document
);

CREATE INDEX IF NOT EXISTS idx_section_doc ON fpf_section(doc_id);
CREATE INDEX IF NOT EXISTS idx_section_ref ON fpf_section(ref);
CREATE INDEX IF NOT EXISTS idx_section_parent ON fpf_section(parent_id);

-- CC Clauses (Conformance Clauses) extracted from patterns like CC-A.1-1, CC-C.2.1-4
-- Same clause may appear in multiple places in the document
CREATE TABLE IF NOT EXISTS fpf_clause (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    doc_id      INTEGER NOT NULL REFERENCES fpf_doc(id) ON DELETE CASCADE,
    section_id  INTEGER REFERENCES fpf_section(id),
    code        TEXT NOT NULL,                   -- e.g., 'CC-A.1-1', 'CC-C.2.1-4'
    text        TEXT NOT NULL,                   -- full clause text
    modality    TEXT,                            -- MUST/SHALL/SHOULD/MAY extracted
    line_num    INTEGER,                         -- source line number
    UNIQUE(doc_id, code, line_num)               -- allows same clause at different lines
);

CREATE INDEX IF NOT EXISTS idx_clause_doc ON fpf_clause(doc_id);
CREATE INDEX IF NOT EXISTS idx_clause_code ON fpf_clause(code);
CREATE INDEX IF NOT EXISTS idx_clause_section ON fpf_clause(section_id);

-- Cross-references between sections/clauses
CREATE TABLE IF NOT EXISTS fpf_xref (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    doc_id      INTEGER NOT NULL REFERENCES fpf_doc(id) ON DELETE CASCADE,
    source_id   INTEGER,                         -- source section id (nullable)
    source_line INTEGER,                         -- source line number
    target_ref  TEXT NOT NULL,                   -- target reference string
    target_type TEXT NOT NULL,                   -- 'section', 'clause', 'external'
    context     TEXT                             -- surrounding text snippet
);

CREATE INDEX IF NOT EXISTS idx_xref_doc ON fpf_xref(doc_id);
CREATE INDEX IF NOT EXISTS idx_xref_source ON fpf_xref(source_id);
CREATE INDEX IF NOT EXISTS idx_xref_target ON fpf_xref(target_ref);

-- ============================================================================
-- PART 2: Generic FPF Store Tables (aligned to C.2.1's EpistemeSlotGraph)
-- ============================================================================

-- Episteme Kind definitions (aligned to A.6.5 U.RelationSlotDiscipline)
CREATE TABLE IF NOT EXISTS fpf_episteme_kind (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    ref             TEXT NOT NULL UNIQUE,        -- kind reference/URI
    name            TEXT NOT NULL,               -- human-readable name
    parent_kind_ref TEXT,                        -- parent kind for subkind hierarchy
    signature_json  TEXT,                        -- KindSignature as JSON
    description     TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_kind_ref ON fpf_episteme_kind(ref);

-- Slots for episteme kinds (A.6.5 SlotKind/ValueKind/RefKind discipline)
-- Lexical guards for *Slot and *Ref discipline (matches A.6.5 and CC-C.2.1-3)
CREATE TABLE IF NOT EXISTS fpf_episteme_kind_slot (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    kind_id         INTEGER NOT NULL REFERENCES fpf_episteme_kind(id) ON DELETE CASCADE,
    slot_name       TEXT NOT NULL,               -- e.g., 'DescribedEntitySlot', 'ClaimGraphSlot'
    slot_type       TEXT NOT NULL,               -- 'value', 'ref', 'slot' (A.6.5 discipline)
    value_kind_ref  TEXT,                        -- kind of the value
    cardinality     TEXT DEFAULT '1',            -- '1', '0..1', '*', '1..*'
    is_required     INTEGER DEFAULT 1,           -- 0=optional, 1=required
    description     TEXT,
    ord             INTEGER DEFAULT 0,           -- ordering
    -- Lexical guard: slot_name must end with 'Slot' for slot types, 'Ref' for ref types
    CHECK (
        (slot_type = 'slot' AND slot_name LIKE '%Slot') OR
        (slot_type = 'ref' AND slot_name LIKE '%Ref') OR
        (slot_type = 'value')
    ),
    UNIQUE(kind_id, slot_name)
);

CREATE INDEX IF NOT EXISTS idx_slot_kind ON fpf_episteme_kind_slot(kind_id);

-- Episteme Cards (aligned to C.2.1 U.EpistemeSlotGraph canonical fields)
-- Implements minimal identity: (bounded_context_ref, described_entity_ref, content_hash)
CREATE TABLE IF NOT EXISTS fpf_episteme_card (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    kind_ref                TEXT NOT NULL,       -- references fpf_episteme_kind.ref
    bounded_context_ref     TEXT NOT NULL,       -- U.BoundedContext reference
    described_entity_ref    TEXT NOT NULL,       -- what the episteme describes
    grounding_holon_ref     TEXT,                -- optional grounding holon
    viewpoint_ref           TEXT,                -- optional viewpoint
    reference_scheme        TEXT,                -- reference scheme identifier
    content                 TEXT NOT NULL,       -- the ClaimGraph content (typically JSON)
    content_hash            TEXT NOT NULL,       -- SHA-256 of content for identity
    meta_json               TEXT,                -- additional metadata
    formality_level         TEXT,                -- F-scale level (F0-F9)
    assurance_level         TEXT,                -- L0-L2 assurance level
    created_at              TEXT DEFAULT (datetime('now')),
    updated_at              TEXT DEFAULT (datetime('now')),
    -- Minimal identity constraint per CC-C.2.1:
    -- "minimal identity is <content, describedEntityRef> within a BoundedContext"
    UNIQUE(bounded_context_ref, described_entity_ref, content_hash)
);

CREATE INDEX IF NOT EXISTS idx_card_kind ON fpf_episteme_card(kind_ref);
CREATE INDEX IF NOT EXISTS idx_card_context ON fpf_episteme_card(bounded_context_ref);
CREATE INDEX IF NOT EXISTS idx_card_entity ON fpf_episteme_card(described_entity_ref);
CREATE INDEX IF NOT EXISTS idx_card_viewpoint ON fpf_episteme_card(viewpoint_ref);

-- Episteme Card slot values (for cards with complex slot structures)
CREATE TABLE IF NOT EXISTS fpf_episteme_card_slot (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id     INTEGER NOT NULL REFERENCES fpf_episteme_card(id) ON DELETE CASCADE,
    slot_name   TEXT NOT NULL,
    value_json  TEXT NOT NULL,                   -- JSON-encoded value
    UNIQUE(card_id, slot_name)
);

CREATE INDEX IF NOT EXISTS idx_card_slot ON fpf_episteme_card_slot(card_id);

-- ============================================================================
-- PART 3: FTS5 Full-Text Search (optional, best-effort)
-- ============================================================================

-- FTS for sections (content search)
-- Note: This may fail if FTS5 is not available; ignore errors
-- Triggers are not used here due to statement parsing complexity;
-- use rebuildFTS() after bulk inserts instead
CREATE VIRTUAL TABLE IF NOT EXISTS fpf_section_fts USING fts5(
    ref,
    title,
    text,
    content='fpf_section',
    content_rowid='id'
);

-- FTS for clauses
CREATE VIRTUAL TABLE IF NOT EXISTS fpf_clause_fts USING fts5(
    code,
    text,
    content='fpf_clause',
    content_rowid='id'
);

-- FTS for episteme cards
CREATE VIRTUAL TABLE IF NOT EXISTS fpf_episteme_card_fts USING fts5(
    described_entity_ref,
    content,
    content='fpf_episteme_card',
    content_rowid='id'
);
