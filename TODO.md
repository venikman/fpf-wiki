# FPF Migration Verification - F# Testing Plans

## Overview
Verify that FPF.md was completely and correctly migrated into Turso using F# with Property-Based Testing (PBT) and non-deterministic testing approaches.

---

## 1. Property-Based Testing (PBT)

### 1.1 Roundtrip Properties
- [ ] **Parse-Serialize Roundtrip**: For any section extracted, re-parsing from stored text should yield identical structure
- [ ] **Hash Consistency**: `sha256(content)` in DB must match recomputed hash from stored content
- [ ] **Line Number Invariant**: `line_start < line_end` for all sections with content

### 1.2 Structural Properties
- [ ] **Hierarchy Consistency**: Every `parent_id` must reference an existing section with lower `ord`
- [ ] **Level Monotonicity**: Child sections must have `level > parent.level`
- [ ] **Ordering Preservation**: Sections ordered by `ord` must match original document order

### 1.3 Reference Integrity Properties
- [ ] **XRef Validity**: For `target_type = 'section'`, target should exist in `fpf_section`
- [ ] **Clause Section Binding**: Every clause's `section_id` must reference valid section
- [ ] **Document Scope**: All foreign keys within same `doc_id`

### 1.4 Content Properties
- [ ] **CC-Code Format**: All clause codes must match pattern `CC-[A-Z][A-Z0-9.]*-\d+`
- [ ] **Modality Extraction**: If text contains MUST/SHALL/SHOULD/MAY, modality should be set
- [ ] **No Data Loss**: Union of all section texts should cover original markdown (minus headings)

---

## 2. Non-Deterministic Testing

### 2.1 Fuzzing
- [ ] **Random Subsection Queries**: Generate random `ref LIKE` patterns, verify results are subset of full scan
- [ ] **Concurrent Ingestion**: Re-ingest same document multiple times concurrently, verify idempotency
- [ ] **Partial Document Ingestion**: Truncate markdown at random points, verify graceful handling

### 2.2 Mutation Testing
- [ ] **Corrupt Hash Detection**: Modify content, verify hash mismatch is detectable
- [ ] **Missing Parent Handling**: Delete random parent sections, verify orphan detection
- [ ] **Duplicate Ref Handling**: Insert duplicate refs, verify constraint behavior

### 2.3 Stress Testing
- [ ] **Large Document Handling**: Generate synthetic 10x document, verify performance
- [ ] **Deep Hierarchy**: Create 20+ level nesting, verify parent-child chain
- [ ] **Many XRefs**: Generate document with 100k+ cross-references

---

## 3. Completeness Verification

### 3.1 Coverage Metrics
- [ ] **Section Coverage**: Every heading in original MD has corresponding `fpf_section` row
- [ ] **Clause Coverage**: Every `CC-*` pattern in original MD has corresponding `fpf_clause` row
- [ ] **Line Coverage**: Sum of `(line_end - line_start)` ≈ total lines in document

### 3.2 Semantic Checks
- [ ] **Known Sections Present**: Verify A.1, A.2, B.1, C.1, C.2.1, E.1, E.2, F.1, G.1 exist
- [ ] **Part Structure**: Verify Parts A-G are correctly identified
- [ ] **Cluster Structure**: Verify Cluster markers are parsed

### 3.3 Cross-Validation
- [ ] **Compare with grep**: `grep -c "^##"` should match level-2 section count
- [ ] **Compare with CC count**: `grep -c "CC-"` should approximate clause count
- [ ] **Line number spot checks**: Random sample of 100 sections, verify line accuracy

---

## 4. F# Implementation Notes

```fsharp
// Suggested libraries
// - FsCheck for property-based testing
// - Expecto for test framework
// - Donald or Fumble for SQLite/Turso access

// Example property
let ``roundtrip hash property`` (section: Section) =
    let stored = db.GetSection(section.Id)
    sha256(stored.Text) = stored.ContentHash

// Example generator (using gen computation expression for proper composition)
let genSectionRef =
    gen {
        let! c = Gen.elements ['A'..'G']
        let! n = Gen.choose(1, 20)
        return sprintf "%c.%d" c n
    }
```

---

## 5. Test Execution Plan

| Phase | Tests | Priority |
|-------|-------|----------|
| Phase 1 | Basic PBT properties (hash, hierarchy) | High |
| Phase 2 | Coverage metrics verification | High |
| Phase 3 | XRef and clause integrity | Medium |
| Phase 4 | Fuzzing and mutation | Medium |
| Phase 5 | Stress testing | Low |

---

## Notes
- Use Turso's libSQL client for F# via .NET bindings
- Consider running tests against both in-memory SQLite and remote Turso
- Document any FPF spec patterns that parser doesn't handle
