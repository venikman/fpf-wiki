/**
 * FPF Spec Model v1 - Dependency-free ESM parser and ingester
 *
 * Parses FPF-Spec Markdown into sections, CC-clauses, and cross-references,
 * then stores them in SQLite/Turso.
 *
 * @example
 * import { parseFpfSpecMarkdown, ingestFpfSpecMarkdown, migrateFpfSchemaV1 } from './fpf.spec-model.v1.js';
 *
 * // Parse markdown
 * const { doc, sections, clauses, xrefs } = parseFpfSpecMarkdown(md, { doc_ref: 'FPF-Spec(4)', title: 'FPF-Spec (4)' });
 *
 * // Ingest into database
 * await ingestFpfSpecMarkdown(query, { doc_ref: 'FPF-Spec(4)', title: 'FPF-Spec (4)', md });
 */

import { createHash } from 'node:crypto';

// ============================================================================
// Hash utilities
// ============================================================================

/**
 * Compute SHA-256 hash of a string
 * @param {string} str
 * @returns {string}
 */
export function sha256(str) {
    return createHash('sha256').update(str, 'utf8').digest('hex');
}

// ============================================================================
// Section Reference Parser
// ============================================================================

/**
 * Parse a section heading to extract structured reference
 * Handles patterns like:
 * - "## A.1 - Title" -> { ref: 'A.1', title: 'Title' }
 * - "### A.1:4.1 - Title" -> { ref: 'A.1:4.1', title: 'Title' }
 * - "## Part A – Kernel" -> { ref: 'Part-A', title: 'Kernel' }
 * - "### 1) Problem frame" -> { ref: null, title: '1) Problem frame' }
 *
 * @param {string} heading
 * @returns {{ ref: string | null, title: string }}
 */
function parseHeading(heading) {
    // Remove markdown heading markers
    const text = heading.replace(/^#+\s*/, '').trim();

    // Pattern 1: "A.1 - Title" or "A.1.1 - Title" or "A.1:4.1 - Title"
    const sectionMatch = text.match(/^([A-Z]\.[\d.]+(?::[.\d]+)?)\s*[-–—]\s*(.+)$/);
    if (sectionMatch) {
        return { ref: sectionMatch[1], title: sectionMatch[2].trim() };
    }

    // Pattern 2: "Part A – Title"
    const partMatch = text.match(/^Part\s+([A-Z])\s*[-–—]\s*(.+)$/i);
    if (partMatch) {
        return { ref: `Part-${partMatch[1].toUpperCase()}`, title: partMatch[2].trim() };
    }

    // Pattern 3: "Cluster A.I - Title"
    const clusterMatch = text.match(/^(?:\*{0,2})Cluster\s+([A-Z](?:\.[IVX]+)?)\s*[-–—]\s*(.+?)(?:\*{0,2})$/i);
    if (clusterMatch) {
        return { ref: `Cluster-${clusterMatch[1]}`, title: clusterMatch[2].trim() };
    }

    // Pattern 4: Just a reference like "## C.2.1"
    const bareRefMatch = text.match(/^([A-Z]\.[\d.]+(?::[.\d]+)?)\s*$/);
    if (bareRefMatch) {
        return { ref: bareRefMatch[1], title: bareRefMatch[1] };
    }

    // Pattern 5: Title only (numbered like "1) Problem" or named like "# Table of Content")
    return { ref: null, title: text };
}

// ============================================================================
// CC Clause Extractor
// ============================================================================

/**
 * Extract CC (Conformance Clause) codes and text from a line
 * Handles patterns like:
 * - "**CC-A.1-1** | Description"
 * - "| **CC‑A0‑1** | Description |"
 * - "**CC-C.2.1-4 (Label).** Description"
 *
 * @param {string} line
 * @param {number} lineNum
 * @returns {{ code: string, text: string, modality: string | null, lineNum: number } | null}
 */
function extractClause(line, lineNum) {
    // Normalize dashes (em-dash, en-dash, hyphen variations)
    const normalized = line.replace(/[‑–—]/g, '-');

    // Pattern: CC-X.Y-N or CC-X.Y.Z-N
    const ccMatch = normalized.match(/\*?\*?CC-([A-Z][A-Z0-9.]*-\d+)(?:\s*\([^)]*\))?\*?\*?\.?\s*[|]?\s*(.+)/i);

    if (ccMatch) {
        const code = `CC-${ccMatch[1]}`;
        let text = ccMatch[2].trim();

        // Clean up table formatting
        text = text.replace(/^\|?\s*/, '').replace(/\s*\|?\s*$/, '').trim();

        // Extract modality (MUST, SHALL, SHOULD, MAY)
        const modalityMatch = text.match(/\b(MUST NOT|MUST|SHALL NOT|SHALL|SHOULD NOT|SHOULD|MAY)\b/);
        const modality = modalityMatch ? modalityMatch[1] : null;

        return { code, text, modality, lineNum };
    }

    return null;
}

// ============================================================================
// Cross-Reference Extractor
// ============================================================================

/**
 * Extract cross-references from text
 * Handles patterns like:
 * - "A.1", "A.1.1", "C.2.1"
 * - "E.7/E.8" (multiple refs)
 * - "C.17–C.19" (range)
 * - "CC-A.1-1"
 *
 * @param {string} text
 * @param {number} lineNum
 * @returns {Array<{ targetRef: string, targetType: string, context: string }>}
 */
function extractXrefs(text, lineNum) {
    const refs = [];
    const seen = new Set();

    // Normalize dashes
    const normalized = text.replace(/[‑–—]/g, '-');

    // Pattern 1: CC clause references
    const ccPattern = /CC-[A-Z][A-Z0-9.]*-\d+/gi;
    for (const match of normalized.matchAll(ccPattern)) {
        const ref = match[0].toUpperCase();
        if (!seen.has(ref)) {
            seen.add(ref);
            const start = Math.max(0, match.index - 30);
            const end = Math.min(text.length, match.index + match[0].length + 30);
            refs.push({
                targetRef: ref,
                targetType: 'clause',
                context: text.slice(start, end).trim()
            });
        }
    }

    // Pattern 2: Section references (A.1, B.2.3, C.2.1:4, etc.)
    // Avoid matching version numbers, decimals in prose
    const sectionPattern = /\b([A-Z])\.(\d+(?:\.\d+)*(?::\d+(?:\.\d+)*)?)\b/g;
    for (const match of normalized.matchAll(sectionPattern)) {
        const ref = match[0];
        if (!seen.has(ref)) {
            seen.add(ref);
            const start = Math.max(0, match.index - 30);
            const end = Math.min(text.length, match.index + match[0].length + 30);
            refs.push({
                targetRef: ref,
                targetType: 'section',
                context: text.slice(start, end).trim()
            });
        }
    }

    // Pattern 3: Part references
    const partPattern = /\bPart\s+([A-Z])\b/gi;
    for (const match of normalized.matchAll(partPattern)) {
        const ref = `Part-${match[1].toUpperCase()}`;
        if (!seen.has(ref)) {
            seen.add(ref);
            refs.push({
                targetRef: ref,
                targetType: 'section',
                context: text.slice(Math.max(0, match.index - 20), Math.min(text.length, match.index + 30)).trim()
            });
        }
    }

    return refs;
}

// ============================================================================
// Main Parser
// ============================================================================

/**
 * Parse FPF-Spec Markdown into structured data
 *
 * @param {string} md - The markdown content
 * @param {object} options
 * @param {string} options.doc_ref - Document reference (e.g., 'FPF-Spec(4)')
 * @param {string} options.title - Document title
 * @param {string} [options.version] - Optional version
 * @returns {{ doc: object, sections: object[], clauses: object[], xrefs: object[] }}
 */
export function parseFpfSpecMarkdown(md, options) {
    const { doc_ref, title, version } = options;
    const lines = md.split('\n');

    const doc = {
        ref: doc_ref,
        title,
        version: version || extractVersion(md),
        raw_hash: sha256(md),
        meta_json: null
    };

    const sections = [];
    const clauses = [];
    const xrefs = [];

    let currentSection = null;
    let sectionStack = []; // Stack for tracking hierarchy
    let sectionOrd = 0;
    let sectionContent = [];
    let sectionStartLine = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;

        // Check for heading
        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

        if (headingMatch) {
            // Save previous section content
            if (currentSection && sectionContent.length > 0) {
                currentSection.text = sectionContent.join('\n').trim();
                currentSection.line_end = lineNum - 1;
            }

            const level = headingMatch[1].length;
            const headingText = headingMatch[2].trim();
            const { ref, title: sectionTitle } = parseHeading(line);

            // Generate a ref if none found
            const effectiveRef = ref || `${doc_ref}:L${lineNum}`;

            // Determine parent based on level
            while (sectionStack.length > 0 && sectionStack[sectionStack.length - 1].level >= level) {
                sectionStack.pop();
            }
            const parentId = sectionStack.length > 0 ? sectionStack[sectionStack.length - 1].ord : null;

            sectionOrd++;
            currentSection = {
                ref: effectiveRef,
                title: sectionTitle,
                level,
                ord: sectionOrd,
                parent_ord: parentId,
                text: null,
                line_start: lineNum,
                line_end: null
            };

            sections.push(currentSection);
            sectionStack.push({ level, ord: sectionOrd });
            sectionContent = [];
            sectionStartLine = lineNum;

        } else {
            // Accumulate content
            sectionContent.push(line);

            // Check for CC clauses
            const clause = extractClause(line, lineNum);
            if (clause) {
                clause.section_ord = currentSection ? currentSection.ord : null;
                clauses.push(clause);
            }

            // Extract cross-references (but not from every line to avoid noise)
            // Focus on lines that look like they contain references
            if (line.includes('.') && (
                line.includes('Builds on') ||
                line.includes('Prerequisite') ||
                line.includes('Coordinates') ||
                line.includes('Constrains') ||
                line.includes('Used by') ||
                line.includes('Refines') ||
                line.includes('Informs') ||
                line.match(/\b[A-Z]\.\d+/) // Contains section reference pattern
            )) {
                const lineXrefs = extractXrefs(line, lineNum);
                for (const xref of lineXrefs) {
                    xrefs.push({
                        source_ord: currentSection ? currentSection.ord : null,
                        source_line: lineNum,
                        ...xref
                    });
                }
            }
        }
    }

    // Close final section
    if (currentSection && sectionContent.length > 0) {
        currentSection.text = sectionContent.join('\n').trim();
        currentSection.line_end = lines.length;
    }

    return { doc, sections, clauses, xrefs };
}

/**
 * Extract version from markdown content
 * @param {string} md
 * @returns {string | null}
 */
function extractVersion(md) {
    // Look for date patterns like "December 2025" first (most common in FPF specs)
    const dateMatch = md.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i);
    if (dateMatch) return `${dateMatch[1]} ${dateMatch[2]}`;

    // Look for explicit version patterns (e.g., "Version 1.0" or "v1.2.3")
    const versionMatch = md.match(/\b(?:Version|v)\s*(\d+(?:\.\d+)+)/i);
    if (versionMatch) return versionMatch[1];

    return null;
}

// ============================================================================
// Database Migration
// ============================================================================

/**
 * Apply FPF schema v1 to database
 * Handles FTS5 failures gracefully
 *
 * @param {Function} query - Database query function: (sql, args?) => Promise<Result>
 * @param {string} schemaSQL - SQL schema content
 * @returns {Promise<{ success: boolean, ftsEnabled: boolean, errors: string[] }>}
 */
export async function migrateFpfSchemaV1(query, schemaSQL) {
    const errors = [];
    let ftsEnabled = true;

    // Remove block comments and split on semicolons
    const cleanedSQL = schemaSQL
        .replace(/\/\*[\s\S]*?\*\//g, '')  // Remove block comments
        .replace(/--.*$/gm, '');            // Remove line comments

    // Split on semicolons, keeping statements intact
    const statements = cleanedSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    for (const stmt of statements) {
        try {
            // Check if this is an FTS statement
            const isFTS = stmt.includes('fts5') ||
                          stmt.includes('fpf_section_fts') ||
                          stmt.includes('fpf_clause_fts') ||
                          stmt.includes('fpf_episteme_card_fts');

            await query(stmt);
        } catch (err) {
            const errMsg = err.message || String(err);

            // Ignore "already exists" errors
            if (errMsg.includes('already exists')) {
                continue;
            }

            // FTS5 might not be available
            if (errMsg.includes('fts5') || errMsg.includes('no such module')) {
                ftsEnabled = false;
                continue;
            }

            errors.push(`Statement failed: ${stmt.slice(0, 100)}... Error: ${errMsg}`);
        }
    }

    return {
        success: errors.length === 0,
        ftsEnabled,
        errors
    };
}

// ============================================================================
// Database Ingestion
// ============================================================================

/**
 * Ingest FPF-Spec Markdown into database
 *
 * @param {Function} query - Database query function: (sql, args?) => Promise<Result>
 * @param {object} options
 * @param {string} options.doc_ref - Document reference
 * @param {string} options.title - Document title
 * @param {string} options.md - Markdown content
 * @param {string} [options.version] - Optional version
 * @returns {Promise<{ doc_id: number, sections: number, clauses: number, xrefs: number }>}
 */
export async function ingestFpfSpecMarkdown(query, options) {
    const { doc_ref, title, md, version } = options;

    // Parse the markdown
    const parsed = parseFpfSpecMarkdown(md, { doc_ref, title, version });

    // Check if document already exists
    const existing = await query(
        'SELECT id FROM fpf_doc WHERE ref = ?',
        [doc_ref]
    );

    let docId;

    if (existing.rows && existing.rows.length > 0) {
        // Update existing document
        docId = existing.rows[0].id;
        await query(
            'UPDATE fpf_doc SET title = ?, version = ?, raw_hash = ?, ingested_at = datetime("now") WHERE id = ?',
            [parsed.doc.title, parsed.doc.version, parsed.doc.raw_hash, docId]
        );

        // Clear existing data for re-ingestion
        await query('DELETE FROM fpf_xref WHERE doc_id = ?', [docId]);
        await query('DELETE FROM fpf_clause WHERE doc_id = ?', [docId]);
        await query('DELETE FROM fpf_section WHERE doc_id = ?', [docId]);
    } else {
        // Insert new document
        const result = await query(
            'INSERT INTO fpf_doc (ref, title, version, raw_hash) VALUES (?, ?, ?, ?)',
            [parsed.doc.ref, parsed.doc.title, parsed.doc.version, parsed.doc.raw_hash]
        );
        docId = result.lastInsertRowid || result.lastRowId;
    }

    // Build ord -> id mapping for sections
    const ordToId = new Map();

    // Insert sections
    for (const section of parsed.sections) {
        const parentId = section.parent_ord ? ordToId.get(section.parent_ord) : null;

        const result = await query(
            `INSERT INTO fpf_section (doc_id, ref, title, level, ord, parent_id, text, line_start, line_end)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                docId,
                section.ref,
                section.title,
                section.level,
                section.ord,
                parentId,
                section.text,
                section.line_start,
                section.line_end
            ]
        );

        ordToId.set(section.ord, result.lastInsertRowid || result.lastRowId);
    }

    // Insert clauses
    for (const clause of parsed.clauses) {
        const sectionId = clause.section_ord ? ordToId.get(clause.section_ord) : null;

        await query(
            `INSERT INTO fpf_clause (doc_id, section_id, code, text, modality, line_num)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [docId, sectionId, clause.code, clause.text, clause.modality, clause.lineNum]
        );
    }

    // Insert xrefs
    for (const xref of parsed.xrefs) {
        const sourceId = xref.source_ord ? ordToId.get(xref.source_ord) : null;

        await query(
            `INSERT INTO fpf_xref (doc_id, source_id, source_line, target_ref, target_type, context)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [docId, sourceId, xref.source_line, xref.targetRef, xref.targetType, xref.context]
        );
    }

    return {
        doc_id: docId,
        sections: parsed.sections.length,
        clauses: parsed.clauses.length,
        xrefs: parsed.xrefs.length
    };
}

// ============================================================================
// Episteme Card Operations (for generic FPF storage)
// ============================================================================

/**
 * Create or update an episteme card
 *
 * @param {Function} query - Database query function
 * @param {object} card
 * @param {string} card.kind_ref - Kind reference
 * @param {string} card.bounded_context_ref - Bounded context reference
 * @param {string} card.described_entity_ref - Described entity reference
 * @param {string} card.content - Content (typically JSON ClaimGraph)
 * @param {string} [card.grounding_holon_ref] - Optional grounding holon
 * @param {string} [card.viewpoint_ref] - Optional viewpoint
 * @param {string} [card.reference_scheme] - Reference scheme identifier
 * @param {object} [card.meta] - Additional metadata
 * @param {string} [card.formality_level] - F-scale level
 * @param {string} [card.assurance_level] - Assurance level
 * @returns {Promise<{ id: number, created: boolean }>}
 */
export async function upsertEpistemeCard(query, card) {
    const contentHash = sha256(card.content);

    // Check for existing card with same identity
    const existing = await query(
        `SELECT id FROM fpf_episteme_card
         WHERE bounded_context_ref = ? AND described_entity_ref = ? AND content_hash = ?`,
        [card.bounded_context_ref, card.described_entity_ref, contentHash]
    );

    if (existing.rows && existing.rows.length > 0) {
        // Update existing
        const id = existing.rows[0].id;
        await query(
            `UPDATE fpf_episteme_card SET
                kind_ref = ?,
                grounding_holon_ref = ?,
                viewpoint_ref = ?,
                reference_scheme = ?,
                content = ?,
                meta_json = ?,
                formality_level = ?,
                assurance_level = ?,
                updated_at = datetime('now')
             WHERE id = ?`,
            [
                card.kind_ref,
                card.grounding_holon_ref || null,
                card.viewpoint_ref || null,
                card.reference_scheme || null,
                card.content,
                card.meta ? JSON.stringify(card.meta) : null,
                card.formality_level || null,
                card.assurance_level || null,
                id
            ]
        );
        return { id, created: false };
    } else {
        // Insert new
        const result = await query(
            `INSERT INTO fpf_episteme_card
             (kind_ref, bounded_context_ref, described_entity_ref, grounding_holon_ref,
              viewpoint_ref, reference_scheme, content, content_hash, meta_json,
              formality_level, assurance_level)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                card.kind_ref,
                card.bounded_context_ref,
                card.described_entity_ref,
                card.grounding_holon_ref || null,
                card.viewpoint_ref || null,
                card.reference_scheme || null,
                card.content,
                contentHash,
                card.meta ? JSON.stringify(card.meta) : null,
                card.formality_level || null,
                card.assurance_level || null
            ]
        );
        return { id: result.lastInsertRowid || result.lastRowId, created: true };
    }
}

/**
 * Register an episteme kind with its slots
 *
 * @param {Function} query - Database query function
 * @param {object} kind
 * @param {string} kind.ref - Kind reference/URI
 * @param {string} kind.name - Human-readable name
 * @param {string} [kind.parent_kind_ref] - Parent kind for hierarchy
 * @param {object} [kind.signature] - Kind signature
 * @param {string} [kind.description] - Description
 * @param {Array<object>} [kind.slots] - Slot definitions
 * @returns {Promise<{ id: number, created: boolean }>}
 */
export async function registerEpistemeKind(query, kind) {
    // Check for existing kind
    const existing = await query(
        'SELECT id FROM fpf_episteme_kind WHERE ref = ?',
        [kind.ref]
    );

    let kindId;
    let created = false;

    if (existing.rows && existing.rows.length > 0) {
        kindId = existing.rows[0].id;
        await query(
            `UPDATE fpf_episteme_kind SET
                name = ?,
                parent_kind_ref = ?,
                signature_json = ?,
                description = ?,
                updated_at = datetime('now')
             WHERE id = ?`,
            [
                kind.name,
                kind.parent_kind_ref || null,
                kind.signature ? JSON.stringify(kind.signature) : null,
                kind.description || null,
                kindId
            ]
        );

        // Clear existing slots for re-registration
        await query('DELETE FROM fpf_episteme_kind_slot WHERE kind_id = ?', [kindId]);
    } else {
        const result = await query(
            `INSERT INTO fpf_episteme_kind (ref, name, parent_kind_ref, signature_json, description)
             VALUES (?, ?, ?, ?, ?)`,
            [
                kind.ref,
                kind.name,
                kind.parent_kind_ref || null,
                kind.signature ? JSON.stringify(kind.signature) : null,
                kind.description || null
            ]
        );
        kindId = result.lastInsertRowid || result.lastRowId;
        created = true;
    }

    // Insert slots
    if (kind.slots && Array.isArray(kind.slots)) {
        for (let i = 0; i < kind.slots.length; i++) {
            const slot = kind.slots[i];
            await query(
                `INSERT INTO fpf_episteme_kind_slot
                 (kind_id, slot_name, slot_type, value_kind_ref, cardinality, is_required, description, ord)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    kindId,
                    slot.slot_name,
                    slot.slot_type,
                    slot.value_kind_ref || null,
                    slot.cardinality || '1',
                    slot.is_required !== false ? 1 : 0,
                    slot.description || null,
                    i
                ]
            );
        }
    }

    return { id: kindId, created };
}

// ============================================================================
// Query Helpers
// ============================================================================

/**
 * Find sections by reference pattern
 *
 * @param {Function} query - Database query function
 * @param {number} docId - Document ID
 * @param {string} pattern - SQL LIKE pattern (e.g., 'C.2.1%')
 * @returns {Promise<Array>}
 */
export async function findSectionsByRef(query, docId, pattern) {
    const result = await query(
        `SELECT ref, title, level, ord, line_start, line_end
         FROM fpf_section
         WHERE doc_id = ? AND ref LIKE ?
         ORDER BY ord`,
        [docId, pattern]
    );
    return result.rows || [];
}

/**
 * Find clauses by code pattern
 *
 * @param {Function} query - Database query function
 * @param {number} docId - Document ID
 * @param {string} pattern - SQL LIKE pattern (e.g., 'CC-C.2.1%')
 * @returns {Promise<Array>}
 */
export async function findClausesByCode(query, docId, pattern) {
    const result = await query(
        `SELECT code, text, modality, line_num
         FROM fpf_clause
         WHERE doc_id = ? AND code LIKE ?
         ORDER BY code`,
        [docId, pattern]
    );
    return result.rows || [];
}

/**
 * Get cross-references for a section
 *
 * @param {Function} query - Database query function
 * @param {number} sectionId - Section ID
 * @returns {Promise<Array>}
 */
export async function getXrefsForSection(query, sectionId) {
    const result = await query(
        `SELECT target_ref, target_type, context
         FROM fpf_xref
         WHERE source_id = ?
         ORDER BY source_line`,
        [sectionId]
    );
    return result.rows || [];
}

/**
 * Full-text search in sections (requires FTS5)
 *
 * @param {Function} query - Database query function
 * @param {string} searchQuery - Search query
 * @param {number} [limit=20] - Max results
 * @returns {Promise<Array>}
 */
export async function searchSections(query, searchQuery, limit = 20) {
    try {
        const result = await query(
            `SELECT s.ref, s.title, snippet(fpf_section_fts, 2, '<b>', '</b>', '...', 32) as snippet
             FROM fpf_section_fts fts
             JOIN fpf_section s ON s.id = fts.rowid
             WHERE fpf_section_fts MATCH ?
             ORDER BY rank
             LIMIT ?`,
            [searchQuery, limit]
        );
        return result.rows || [];
    } catch (err) {
        // FTS might not be available
        console.warn('FTS search failed, falling back to LIKE:', err.message);
        const result = await query(
            `SELECT ref, title, substr(text, 1, 200) as snippet
             FROM fpf_section
             WHERE text LIKE ?
             ORDER BY ord
             LIMIT ?`,
            [`%${searchQuery}%`, limit]
        );
        return result.rows || [];
    }
}

/**
 * Rebuild FTS indexes after bulk ingestion
 * Call this after ingestFpfSpecMarkdown for full-text search support
 *
 * @param {Function} query - Database query function
 * @returns {Promise<{ sections: boolean, clauses: boolean, cards: boolean }>}
 */
export async function rebuildFTS(query) {
    const results = { sections: false, clauses: false, cards: false };

    try {
        await query(`INSERT INTO fpf_section_fts(fpf_section_fts) VALUES('rebuild')`);
        results.sections = true;
    } catch (e) { /* FTS may not be available */ }

    try {
        await query(`INSERT INTO fpf_clause_fts(fpf_clause_fts) VALUES('rebuild')`);
        results.clauses = true;
    } catch (e) { /* FTS may not be available */ }

    try {
        await query(`INSERT INTO fpf_episteme_card_fts(fpf_episteme_card_fts) VALUES('rebuild')`);
        results.cards = true;
    } catch (e) { /* FTS may not be available */ }

    return results;
}

// ============================================================================
// Default Export
// ============================================================================

export default {
    sha256,
    parseFpfSpecMarkdown,
    migrateFpfSchemaV1,
    ingestFpfSpecMarkdown,
    rebuildFTS,
    upsertEpistemeCard,
    registerEpistemeKind,
    findSectionsByRef,
    findClausesByCode,
    getXrefsForSection,
    searchSections
};
