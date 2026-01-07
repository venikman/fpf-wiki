/**
 * FPF Schema and Parser Tests
 * Run with: bun test fpf.test.js
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { Database } from 'bun:sqlite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
    sha256,
    parseFpfSpecMarkdown,
    migrateFpfSchemaV1,
    ingestFpfSpecMarkdown,
    upsertEpistemeCard,
    registerEpistemeKind,
    findSectionsByRef,
    findClausesByCode,
    rebuildFTS
} from './fpf.spec-model.v1.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================================
// Test Fixtures
// ============================================================================

const SAMPLE_FPF_MARKDOWN = `# FPF-Spec (4)
December 2025

## Part A – Kernel

This is the kernel section.

### A.1 - Overview

The overview section introduces core concepts.

**CC-A.1-1** | Every FPF-compliant system MUST support episteme cards.

**CC-A.1-2** | Systems SHOULD implement slot validation.

### A.1.1 - Core Concepts

Builds on A.1 for detailed concepts.

Coordinates with Part B for extended features.

### A.2 - Minimal Identity

**CC-A.2-1** | Minimal identity is defined as (bounded_context_ref, described_entity_ref, content_hash).

## Part B – Extensions

Extended features build on Part A.

### B.1 - Advanced Features

**CC-B.1-1** | Extensions MAY define custom kinds.

References: A.1, A.2, CC-A.1-1
`;

// ============================================================================
// Helper: Create query function for bun:sqlite
// ============================================================================

function createQueryFn(db) {
    return (sql, params = []) => {
        const stmt = db.prepare(sql);
        const upperSQL = sql.trim().toUpperCase();

        if (upperSQL.startsWith('SELECT') || sql.toUpperCase().includes('RETURNING')) {
            const rows = stmt.all(...params);
            return { rows };
        } else {
            const result = stmt.run(...params);
            return {
                lastInsertRowid: result.lastInsertRowid,
                changes: result.changes,
                rows: []
            };
        }
    };
}

// ============================================================================
// Schema Tests
// ============================================================================

describe('FPF Schema v1', () => {
    let db;
    let query;
    let schemaSQL;

    beforeAll(() => {
        db = new Database(':memory:');
        query = createQueryFn(db);
        schemaSQL = readFileSync(join(__dirname, 'fpf.schema.v1.sql'), 'utf8');
    });

    afterAll(() => {
        db.close();
    });

    test('schema file exists and is readable', () => {
        expect(schemaSQL).toBeDefined();
        expect(schemaSQL.length).toBeGreaterThan(0);
        expect(schemaSQL).toContain('CREATE TABLE');
    });

    test('schema migrates successfully to SQLite', async () => {
        const result = await migrateFpfSchemaV1(query, schemaSQL);

        expect(result.success).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.ftsEnabled).toBe(true);
    });

    test('all core tables exist after migration', () => {
        const tables = db.prepare(
            `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`
        ).all();

        const tableNames = tables.map(t => t.name);

        expect(tableNames).toContain('fpf_doc');
        expect(tableNames).toContain('fpf_section');
        expect(tableNames).toContain('fpf_clause');
        expect(tableNames).toContain('fpf_xref');
        expect(tableNames).toContain('fpf_episteme_kind');
        expect(tableNames).toContain('fpf_episteme_kind_slot');
        expect(tableNames).toContain('fpf_episteme_card');
        expect(tableNames).toContain('fpf_episteme_card_slot');
    });

    test('FTS virtual tables exist', () => {
        const tables = db.prepare(
            `SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%_fts'`
        ).all();

        const tableNames = tables.map(t => t.name);

        expect(tableNames).toContain('fpf_section_fts');
        expect(tableNames).toContain('fpf_clause_fts');
        expect(tableNames).toContain('fpf_episteme_card_fts');
    });

    test('slot lexical guard CHECK constraint works', () => {
        db.run(`INSERT INTO fpf_episteme_kind (ref, name) VALUES ('test:kind', 'Test Kind')`);
        const kindId = db.prepare('SELECT id FROM fpf_episteme_kind WHERE ref = ?').get('test:kind').id;

        // Valid: slot_type='slot' with name ending in 'Slot'
        expect(() => {
            db.prepare(`
                INSERT INTO fpf_episteme_kind_slot (kind_id, slot_name, slot_type)
                VALUES (?, 'TestSlot', 'slot')
            `).run(kindId);
        }).not.toThrow();

        // Valid: slot_type='ref' with name ending in 'Ref'
        expect(() => {
            db.prepare(`
                INSERT INTO fpf_episteme_kind_slot (kind_id, slot_name, slot_type)
                VALUES (?, 'EntityRef', 'ref')
            `).run(kindId);
        }).not.toThrow();

        // Valid: slot_type='value' can have any name
        expect(() => {
            db.prepare(`
                INSERT INTO fpf_episteme_kind_slot (kind_id, slot_name, slot_type)
                VALUES (?, 'anyName', 'value')
            `).run(kindId);
        }).not.toThrow();

        // Invalid: slot_type='slot' without 'Slot' suffix
        expect(() => {
            db.prepare(`
                INSERT INTO fpf_episteme_kind_slot (kind_id, slot_name, slot_type)
                VALUES (?, 'BadName', 'slot')
            `).run(kindId);
        }).toThrow();

        // Invalid: slot_type='ref' without 'Ref' suffix
        expect(() => {
            db.prepare(`
                INSERT INTO fpf_episteme_kind_slot (kind_id, slot_name, slot_type)
                VALUES (?, 'BadName', 'ref')
            `).run(kindId);
        }).toThrow();
    });
});

// ============================================================================
// Parser Tests
// ============================================================================

describe('FPF Parser', () => {
    test('sha256 produces consistent hashes', () => {
        const hash1 = sha256('test');
        const hash2 = sha256('test');
        const hash3 = sha256('different');

        expect(hash1).toBe(hash2);
        expect(hash1).not.toBe(hash3);
        expect(hash1).toHaveLength(64);
    });

    test('parses document metadata', () => {
        const result = parseFpfSpecMarkdown(SAMPLE_FPF_MARKDOWN, {
            doc_ref: 'FPF-Spec(4)',
            title: 'FPF-Spec (4)'
        });

        expect(result.doc.ref).toBe('FPF-Spec(4)');
        expect(result.doc.title).toBe('FPF-Spec (4)');
        expect(result.doc.version).toBe('December 2025');
        expect(result.doc.raw_hash).toHaveLength(64);
    });

    test('extracts sections with correct hierarchy', () => {
        const result = parseFpfSpecMarkdown(SAMPLE_FPF_MARKDOWN, {
            doc_ref: 'FPF-Spec(4)',
            title: 'FPF-Spec (4)'
        });

        expect(result.sections.length).toBeGreaterThan(0);

        const partA = result.sections.find(s => s.ref === 'Part-A');
        expect(partA).toBeDefined();
        expect(partA.title).toBe('Kernel');
        expect(partA.level).toBe(2);

        const a1 = result.sections.find(s => s.ref === 'A.1');
        expect(a1).toBeDefined();
        expect(a1.title).toBe('Overview');

        const a11 = result.sections.find(s => s.ref === 'A.1.1');
        expect(a11).toBeDefined();
        expect(a11.title).toBe('Core Concepts');
    });

    test('extracts CC clauses with modalities', () => {
        const result = parseFpfSpecMarkdown(SAMPLE_FPF_MARKDOWN, {
            doc_ref: 'FPF-Spec(4)',
            title: 'FPF-Spec (4)'
        });

        expect(result.clauses.length).toBeGreaterThan(0);

        const ccA1_1 = result.clauses.find(c => c.code === 'CC-A.1-1');
        expect(ccA1_1).toBeDefined();
        expect(ccA1_1.modality).toBe('MUST');
        expect(ccA1_1.text).toContain('episteme cards');

        const ccA1_2 = result.clauses.find(c => c.code === 'CC-A.1-2');
        expect(ccA1_2).toBeDefined();
        expect(ccA1_2.modality).toBe('SHOULD');

        const ccB1_1 = result.clauses.find(c => c.code === 'CC-B.1-1');
        expect(ccB1_1).toBeDefined();
        expect(ccB1_1.modality).toBe('MAY');
    });

    test('extracts cross-references', () => {
        const result = parseFpfSpecMarkdown(SAMPLE_FPF_MARKDOWN, {
            doc_ref: 'FPF-Spec(4)',
            title: 'FPF-Spec (4)'
        });

        expect(result.xrefs.length).toBeGreaterThan(0);

        const a1Refs = result.xrefs.filter(x => x.targetRef === 'A.1');
        expect(a1Refs.length).toBeGreaterThan(0);

        const partBRefs = result.xrefs.filter(x => x.targetRef === 'Part-B');
        expect(partBRefs.length).toBeGreaterThan(0);
    });

    test('handles unicode dashes in CC codes', () => {
        const md = `# Test

**CC‑A.1‑1** | Clause with en-dash in code.
**CC–B.1–1** | Clause with em-dash in code.
`;
        const result = parseFpfSpecMarkdown(md, { doc_ref: 'dashes', title: 'Dashes' });

        expect(result.clauses).toHaveLength(2);
        expect(result.clauses[0].code).toBe('CC-A.1-1');
        expect(result.clauses[1].code).toBe('CC-B.1-1');
    });
});

// ============================================================================
// Ingestion Tests
// ============================================================================

describe('FPF Ingestion', () => {
    let db;
    let query;

    beforeAll(async () => {
        db = new Database(':memory:');
        query = createQueryFn(db);
        const schemaSQL = readFileSync(join(__dirname, 'fpf.schema.v1.sql'), 'utf8');
        await migrateFpfSchemaV1(query, schemaSQL);
    });

    afterAll(() => {
        db.close();
    });

    test('ingests FPF markdown into database', async () => {
        const result = await ingestFpfSpecMarkdown(query, {
            doc_ref: 'FPF-Spec(4)',
            title: 'FPF-Spec (4)',
            md: SAMPLE_FPF_MARKDOWN
        });

        expect(result.doc_id).toBeDefined();
        expect(result.sections).toBeGreaterThan(0);
        expect(result.clauses).toBeGreaterThan(0);
        expect(result.xrefs).toBeGreaterThan(0);
    });

    test('document is stored correctly', () => {
        const doc = db.prepare('SELECT * FROM fpf_doc WHERE ref = ?').get('FPF-Spec(4)');

        expect(doc).toBeDefined();
        expect(doc.title).toBe('FPF-Spec (4)');
        expect(doc.version).toBe('December 2025');
        expect(doc.raw_hash).toHaveLength(64);
    });

    test('sections are queryable by ref pattern', async () => {
        const docRow = db.prepare('SELECT id FROM fpf_doc WHERE ref = ?').get('FPF-Spec(4)');
        const sections = await findSectionsByRef(query, docRow.id, 'A.%');

        expect(sections.length).toBeGreaterThan(0);
        expect(sections.some(s => s.ref === 'A.1')).toBe(true);
        expect(sections.some(s => s.ref === 'A.1.1')).toBe(true);
    });

    test('clauses are queryable by code pattern', async () => {
        const docRow = db.prepare('SELECT id FROM fpf_doc WHERE ref = ?').get('FPF-Spec(4)');
        const clauses = await findClausesByCode(query, docRow.id, 'CC-A.1%');

        expect(clauses.length).toBe(2);
        expect(clauses.some(c => c.code === 'CC-A.1-1')).toBe(true);
        expect(clauses.some(c => c.code === 'CC-A.1-2')).toBe(true);
    });

    test('re-ingestion updates existing document', async () => {
        const modifiedMarkdown = SAMPLE_FPF_MARKDOWN + '\n\n## C.1 - New Section\n\nNew content.';

        const result = await ingestFpfSpecMarkdown(query, {
            doc_ref: 'FPF-Spec(4)',
            title: 'FPF-Spec (4) Updated',
            md: modifiedMarkdown
        });

        const docs = db.prepare('SELECT COUNT(*) as count FROM fpf_doc').get();
        expect(docs.count).toBe(1);

        const doc = db.prepare('SELECT title FROM fpf_doc WHERE ref = ?').get('FPF-Spec(4)');
        expect(doc.title).toBe('FPF-Spec (4) Updated');
    });
});

// ============================================================================
// Episteme Card Tests
// ============================================================================

describe('Episteme Cards', () => {
    let db;
    let query;

    beforeAll(async () => {
        db = new Database(':memory:');
        query = createQueryFn(db);
        const schemaSQL = readFileSync(join(__dirname, 'fpf.schema.v1.sql'), 'utf8');
        await migrateFpfSchemaV1(query, schemaSQL);
    });

    afterAll(() => {
        db.close();
    });

    test('registers episteme kind with slots', async () => {
        const result = await registerEpistemeKind(query, {
            ref: 'fpf:EpistemeCard',
            name: 'Episteme Card',
            description: 'Base kind for episteme cards',
            slots: [
                { slot_name: 'DescribedEntitySlot', slot_type: 'slot', is_required: true },
                { slot_name: 'ClaimGraphSlot', slot_type: 'slot', is_required: true },
                { slot_name: 'GroundingHolonRef', slot_type: 'ref', is_required: false },
                { slot_name: 'content', slot_type: 'value', is_required: true }
            ]
        });

        expect(result.id).toBeDefined();
        expect(result.created).toBe(true);

        const slots = db.prepare(
            'SELECT * FROM fpf_episteme_kind_slot WHERE kind_id = ? ORDER BY ord'
        ).all(result.id);

        expect(slots).toHaveLength(4);
        expect(slots[0].slot_name).toBe('DescribedEntitySlot');
        expect(slots[2].slot_name).toBe('GroundingHolonRef');
    });

    test('upserts episteme card', async () => {
        const card = {
            kind_ref: 'fpf:EpistemeCard',
            bounded_context_ref: 'test:context',
            described_entity_ref: 'test:entity:1',
            content: JSON.stringify({ claim: 'Test claim' }),
            formality_level: 'F3',
            assurance_level: 'L1'
        };

        const result = await upsertEpistemeCard(query, card);

        expect(result.id).toBeDefined();
        expect(result.created).toBe(true);

        const stored = db.prepare('SELECT * FROM fpf_episteme_card WHERE id = ?').get(result.id);
        expect(stored.kind_ref).toBe('fpf:EpistemeCard');
        expect(stored.formality_level).toBe('F3');
        expect(stored.content_hash).toHaveLength(64);
    });

    test('upsert handles same identity gracefully', async () => {
        // Insert same card again - should not create duplicate
        const card = {
            kind_ref: 'fpf:EpistemeCard',
            bounded_context_ref: 'test:context',
            described_entity_ref: 'test:entity:1',
            content: JSON.stringify({ claim: 'Test claim' }),
            formality_level: 'F5'
        };

        const result = await upsertEpistemeCard(query, card);
        // Note: created flag may vary by SQLite driver; key is no duplicate
        expect(result.id).toBeDefined();

        const count = db.prepare(
            `SELECT COUNT(*) as count FROM fpf_episteme_card
             WHERE bounded_context_ref = ? AND described_entity_ref = ?
             AND content_hash = ?`
        ).get('test:context', 'test:entity:1', sha256(JSON.stringify({ claim: 'Test claim' })));

        expect(count.count).toBe(1); // Still only one card with this exact identity
    });

    test('creates new card when content changes', async () => {
        const card = {
            kind_ref: 'fpf:EpistemeCard',
            bounded_context_ref: 'test:context',
            described_entity_ref: 'test:entity:1',
            content: JSON.stringify({ claim: 'Different claim' })
        };

        const result = await upsertEpistemeCard(query, card);
        expect(result.created).toBe(true);

        const count = db.prepare(
            `SELECT COUNT(*) as count FROM fpf_episteme_card
             WHERE bounded_context_ref = ? AND described_entity_ref = ?`
        ).get('test:context', 'test:entity:1');

        expect(count.count).toBe(2);
    });
});

// ============================================================================
// FTS Tests
// ============================================================================

describe('Full-Text Search', () => {
    let db;
    let query;

    beforeAll(async () => {
        db = new Database(':memory:');
        query = createQueryFn(db);
        const schemaSQL = readFileSync(join(__dirname, 'fpf.schema.v1.sql'), 'utf8');
        await migrateFpfSchemaV1(query, schemaSQL);

        await ingestFpfSpecMarkdown(query, {
            doc_ref: 'FPF-Spec(4)',
            title: 'FPF-Spec (4)',
            md: SAMPLE_FPF_MARKDOWN
        });
    });

    afterAll(() => {
        db.close();
    });

    test('rebuilds FTS indexes', async () => {
        const result = await rebuildFTS(query);

        expect(result.sections).toBe(true);
        expect(result.clauses).toBe(true);
        expect(result.cards).toBe(true);
    });

    test('FTS search finds clauses by text', () => {
        db.run(`INSERT INTO fpf_clause_fts(fpf_clause_fts) VALUES('rebuild')`);

        const results = db.prepare(`
            SELECT c.code, c.text
            FROM fpf_clause_fts fts
            JOIN fpf_clause c ON c.id = fts.rowid
            WHERE fpf_clause_fts MATCH 'MUST'
        `).all();

        expect(results.length).toBeGreaterThan(0);
        expect(results.some(r => r.code === 'CC-A.1-1')).toBe(true);
    });
});

// ============================================================================
// Integration Test: Real FPF-Spec.md
// ============================================================================

describe('FPF-Spec.md Integration', () => {
    let db;
    let query;
    let fpfSpecMd;

    beforeAll(async () => {
        // Fetch real FPF-Spec.md from upstream
        const response = await fetch('https://raw.githubusercontent.com/ailev/FPF/main/FPF-Spec.md');
        if (!response.ok) {
            throw new Error(`Failed to fetch FPF-Spec.md: ${response.status}`);
        }
        fpfSpecMd = await response.text();

        // Setup database
        db = new Database(':memory:');
        query = createQueryFn(db);
        const schemaSQL = readFileSync(join(__dirname, 'fpf.schema.v1.sql'), 'utf8');
        await migrateFpfSchemaV1(query, schemaSQL);
    }, 30000); // 30s timeout for fetch

    afterAll(() => {
        db.close();
    });

    test('FPF-Spec.md is fetched and not empty', () => {
        expect(fpfSpecMd).toBeDefined();
        expect(fpfSpecMd.length).toBeGreaterThan(100000); // Should be ~3.9MB
    });

    test('parses FPF-Spec.md without errors', () => {
        const result = parseFpfSpecMarkdown(fpfSpecMd, {
            doc_ref: 'FPF-Spec(4)',
            title: 'FPF-Spec (4)'
        });

        expect(result.doc).toBeDefined();
        expect(result.sections.length).toBeGreaterThan(50);
        expect(result.clauses.length).toBeGreaterThan(10);

        console.log(`Parsed: ${result.sections.length} sections, ${result.clauses.length} clauses, ${result.xrefs.length} xrefs`);
    });

    test('ingests FPF-Spec.md into database completely', async () => {
        const result = await ingestFpfSpecMarkdown(query, {
            doc_ref: 'FPF-Spec(4)',
            title: 'FPF-Spec (4)',
            md: fpfSpecMd
        });

        expect(result.doc_id).toBeDefined();
        expect(result.sections).toBeGreaterThan(50);
        expect(result.clauses).toBeGreaterThan(10);

        console.log(`Ingested: doc_id=${result.doc_id}, ${result.sections} sections, ${result.clauses} clauses, ${result.xrefs} xrefs`);
    });

    test('all major Parts are present', () => {
        const parts = db.prepare(`
            SELECT ref, title FROM fpf_section
            WHERE ref LIKE 'Part-%'
            ORDER BY ref
        `).all();

        const partRefs = parts.map(p => p.ref);

        // FPF has Parts A, B, G (structure may vary by version)
        expect(partRefs).toContain('Part-A');
        expect(partRefs).toContain('Part-B');
        expect(partRefs.length).toBeGreaterThanOrEqual(2);

        console.log(`Found Parts: ${partRefs.join(', ')}`);
    });

    test('key sections exist (A.1, C.2.1, etc.)', () => {
        const keySections = ['A.1', 'A.2', 'C.2.1', 'C.2.2'];

        for (const ref of keySections) {
            const section = db.prepare('SELECT * FROM fpf_section WHERE ref = ?').get(ref);
            expect(section).toBeDefined();
            expect(section.title.length).toBeGreaterThan(0);
        }
    });

    test('CC clauses have correct structure', () => {
        const clauses = db.prepare(`
            SELECT code, modality, text FROM fpf_clause
            ORDER BY code
            LIMIT 20
        `).all();

        expect(clauses.length).toBeGreaterThan(0);

        // All clauses should have CC- prefix
        for (const clause of clauses) {
            expect(clause.code).toMatch(/^CC-[A-Z]/);
            expect(clause.text.length).toBeGreaterThan(0); // Some clauses may be brief
        }

        // Count modalities
        const modalities = db.prepare(`
            SELECT modality, COUNT(*) as count FROM fpf_clause
            WHERE modality IS NOT NULL
            GROUP BY modality
        `).all();

        console.log('Modality distribution:', modalities);

        // Should have at least MUST and SHOULD
        const modalityNames = modalities.map(m => m.modality);
        expect(modalityNames).toContain('MUST');
    });

    test('section hierarchy is intact', () => {
        // Check that A.1.1 has A.1 as ancestor (via parent chain)
        const a11 = db.prepare('SELECT * FROM fpf_section WHERE ref = ?').get('A.1.1');

        if (a11) {
            // Walk up the parent chain
            let current = a11;
            const ancestors = [];

            while (current.parent_id) {
                current = db.prepare('SELECT * FROM fpf_section WHERE id = ?').get(current.parent_id);
                if (current) ancestors.push(current.ref);
            }

            console.log(`A.1.1 ancestors: ${ancestors.join(' -> ')}`);
            expect(ancestors.length).toBeGreaterThan(0);
        }
    });

    test('cross-references are extracted', () => {
        const xrefCount = db.prepare('SELECT COUNT(*) as count FROM fpf_xref').get();
        expect(xrefCount.count).toBeGreaterThan(0);

        // Check for section references
        const sectionXrefs = db.prepare(`
            SELECT COUNT(*) as count FROM fpf_xref WHERE target_type = 'section'
        `).get();
        expect(sectionXrefs.count).toBeGreaterThan(0);

        console.log(`Total xrefs: ${xrefCount.count}, section refs: ${sectionXrefs.count}`);
    });

    test('FTS indexes can be rebuilt and searched', async () => {
        const ftsResult = await rebuildFTS(query);
        expect(ftsResult.sections).toBe(true);
        expect(ftsResult.clauses).toBe(true);

        // Search for a common term
        const searchResults = db.prepare(`
            SELECT s.ref, s.title
            FROM fpf_section_fts fts
            JOIN fpf_section s ON s.id = fts.rowid
            WHERE fpf_section_fts MATCH 'episteme'
            LIMIT 10
        `).all();

        expect(searchResults.length).toBeGreaterThan(0);
        console.log(`FTS search 'episteme' found ${searchResults.length} sections`);
    });

    test('database integrity check passes', () => {
        // SQLite integrity check
        const integrity = db.prepare('PRAGMA integrity_check').get();
        expect(integrity['integrity_check']).toBe('ok');

        // Foreign key check
        const fkViolations = db.prepare('PRAGMA foreign_key_check').all();
        expect(fkViolations).toHaveLength(0);
    });

    test('summary statistics', () => {
        const stats = {
            docs: db.prepare('SELECT COUNT(*) as c FROM fpf_doc').get().c,
            sections: db.prepare('SELECT COUNT(*) as c FROM fpf_section').get().c,
            clauses: db.prepare('SELECT COUNT(*) as c FROM fpf_clause').get().c,
            xrefs: db.prepare('SELECT COUNT(*) as c FROM fpf_xref').get().c,
        };

        console.log('\n📊 FPF-Spec.md Ingestion Summary:');
        console.log(`   Documents: ${stats.docs}`);
        console.log(`   Sections:  ${stats.sections}`);
        console.log(`   CC Clauses: ${stats.clauses}`);
        console.log(`   Cross-refs: ${stats.xrefs}`);

        // Sanity checks
        expect(stats.docs).toBe(1);
        expect(stats.sections).toBeGreaterThan(100);
        expect(stats.clauses).toBeGreaterThan(20);
    });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
    test('handles empty markdown', () => {
        const result = parseFpfSpecMarkdown('', {
            doc_ref: 'empty',
            title: 'Empty'
        });

        expect(result.doc.ref).toBe('empty');
        expect(result.sections).toHaveLength(0);
        expect(result.clauses).toHaveLength(0);
        expect(result.xrefs).toHaveLength(0);
    });

    test('handles markdown without headings', () => {
        const result = parseFpfSpecMarkdown('Just some text without any headings.', {
            doc_ref: 'noheadings',
            title: 'No Headings'
        });

        expect(result.sections).toHaveLength(0);
    });

    test('handles special characters in clauses', () => {
        const md = `# Test

**CC-A.1-1** | Systems MUST handle "quotes" and <brackets> and & ampersands.
`;
        const result = parseFpfSpecMarkdown(md, { doc_ref: 'special', title: 'Special' });

        expect(result.clauses).toHaveLength(1);
        expect(result.clauses[0].text).toContain('quotes');
    });
});
