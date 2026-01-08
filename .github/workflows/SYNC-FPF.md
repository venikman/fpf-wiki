# Sync FPF Workflow

> Documentation for `.github/workflows/sync-fpf.yml`

## Current State

| Attribute | Value |
|-----------|-------|
| **Status** | Active |
| **Last Updated** | 2026-01-08 (commit a7aa4d0) |
| **Stability** | Production |
| **Health** | Healthy |

## What It Does

This workflow automatically synchronizes commits from the upstream FPF repository (`ailev/FPF`) into this fork using cherry-picking.

### Trigger Conditions

| Trigger | Schedule/Condition |
|---------|-------------------|
| **Scheduled** | Daily at 6:00 AM UTC (`0 6 * * *`) |
| **Manual** | Workflow dispatch with optional parameters |

### Manual Dispatch Parameters

- `force_sync` (boolean): Force sync even if no new commits detected
- `commit_count` (number): Specific number of recent commits to sync (0 = auto-detect)

### Execution Flow

1. **Checkout** - Full history clone with write permissions
2. **Configure Git** - Sets bot identity for commits
3. **Add Upstream** - Connects to `ailev/FPF` repository
4. **Check Commits** - Compares `.sync-state/last-synced-sha` with upstream HEAD
5. **Cherry-pick** - Applies new commits with conflict resolution
6. **Generate Report** - Creates timestamped markdown report in `docs/_reports/`
7. **Push** - Commits all changes to `main` branch

### Conflict Resolution Strategy

- **File exists locally**: Keep our version (`git checkout --ours`)
- **File deleted locally**: Respect deletion (`git rm`)
- **Cleanup**: Remove untracked files from failed cherry-picks

## Quality Assessment

### Strengths

| Area | Rating | Notes |
|------|--------|-------|
| **Security** | Good | Uses `jq` for safe JSON escaping of untrusted commit data |
| **Idempotency** | Good | State-based tracking prevents duplicate syncs |
| **Conflict Handling** | Good | Automated resolution preserves local modifications |
| **Auditability** | Good | Generates Jekyll reports for each sync |
| **Permissions** | Good | Scoped to `contents:write` and `pages:write` only |

### Weaknesses

| Area | Rating | Notes |
|------|--------|-------|
| **Error Recovery** | Needs Work | No retry logic for network failures |
| **Notifications** | Missing | No alerts on sync failure |
| **Branch Protection** | Missing | Pushes directly to main without PR review |
| **Rollback** | Missing | No automated way to undo bad syncs |

### Security Considerations

- Commit messages are properly escaped via `jq` (prevents injection)
- Uses GitHub-provided `GITHUB_TOKEN` (least privilege)
- No secrets exposed in logs

## Plans to Change

### Short-term (Next Sprint)

- [ ] Add retry logic with exponential backoff for git push/fetch
- [ ] Add Slack/email notification on sync failure
- [ ] Add dry-run mode to preview changes without applying

### Medium-term (Next Quarter)

- [ ] Create PR instead of direct push to main (optional flag)
- [ ] Add rollback workflow to revert failed syncs
- [ ] Implement selective file sync (include/exclude patterns)
- [ ] Add commit signature verification

### Long-term (Roadmap)

- [ ] Multi-branch sync support
- [ ] Bidirectional sync capability (push changes upstream)
- [ ] Integration with project management tools (auto-create issues for conflicts)

## Metrics

### Key Performance Indicators

| Metric | Target | Current | Notes |
|--------|--------|---------|-------|
| **Sync Success Rate** | > 95% | TBD | Track via workflow run history |
| **Avg Sync Duration** | < 2 min | TBD | Measure checkout + cherry-pick time |
| **Conflict Rate** | < 10% | TBD | Commits requiring conflict resolution |
| **Time to Sync** | < 24 hrs | 24 hrs | Max delay from upstream commit |

### Tracking Dashboard

Metrics can be extracted from:

```bash
# Sync success rate (last 30 runs)
gh run list --workflow=sync-fpf.yml --limit=30 --json conclusion \
  | jq '[.[] | select(.conclusion == "success")] | length / 30 * 100'

# Average duration
gh run list --workflow=sync-fpf.yml --limit=30 --json createdAt,updatedAt \
  | jq 'map((.updatedAt | fromdateiso8601) - (.createdAt | fromdateiso8601)) | add / length'
```

### Reports Location

Sync reports are published to GitHub Pages at:
- `/fpf-wiki/reports/` (index)
- `/fpf-wiki/reports/YYYY-MM-DD-sync-HHMMSS/` (individual reports)

## Files Modified

| File | Purpose |
|------|---------|
| `.sync-state/last-synced-sha` | Tracks last synced upstream commit |
| `docs/_reports/*.md` | Generated sync reports |

## Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| `actions/checkout` | v4 | Repository checkout |
| `jq` | (ubuntu default) | JSON processing |
| GitHub Pages | - | Report publishing |

## Related Documentation

- [FPF Upstream Repository](https://github.com/ailev/FPF)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cherry-pick Documentation](https://git-scm.com/docs/git-cherry-pick)
