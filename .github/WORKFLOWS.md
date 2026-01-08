# Workflows Index

> Central hub for all GitHub Actions workflow documentation

## Active Workflows

| Workflow | Purpose | Schedule | Documentation |
|----------|---------|----------|---------------|
| **Sync FPF** | Syncs commits from upstream `ailev/FPF` | Daily 6 AM UTC | [SYNC-FPF.md](workflows/SYNC-FPF.md) |
| **Claude Code** | AI-assisted code review via @mentions | On-demand | [CLAUDE.md](workflows/CLAUDE.md) |

## Quick Reference

### Sync FPF Workflow

```bash
# Manual trigger with options
gh workflow run sync-fpf.yml -f force_sync=true -f commit_count=5
```

**Key files:**
- Workflow: [`.github/workflows/sync-fpf.yml`](workflows/sync-fpf.yml)
- State tracking: `.sync-state/last-synced-sha`
- Reports: `docs/_reports/`

### Claude Code Workflow

```text
# Trigger by mentioning in any issue/PR comment:
@claude <your question or request>
```

**Key files:**
- Workflow: [`.github/workflows/claude.yml`](workflows/claude.yml)

## Health Dashboard

| Workflow | Status | Last Run | Success Rate |
|----------|--------|----------|--------------|
| Sync FPF | ![Sync Status](https://github.com/venikman/fpf-wiki/actions/workflows/sync-fpf.yml/badge.svg) | [View Runs](https://github.com/venikman/fpf-wiki/actions/workflows/sync-fpf.yml) | TBD |
| Claude Code | ![Claude Status](https://github.com/venikman/fpf-wiki/actions/workflows/claude.yml/badge.svg) | [View Runs](https://github.com/venikman/fpf-wiki/actions/workflows/claude.yml) | TBD |

## Troubleshooting

### Sync FPF Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| Sync not running | Schedule disabled on forks | Manually trigger or enable Actions |
| Conflicts every run | Divergent local changes | Review conflict resolution strategy |
| No commits synced | Already up-to-date | Use `force_sync=true` to verify |
| Push fails | Token permissions | Check `GITHUB_TOKEN` has write access |

### Claude Code Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| No response to @claude | Token missing/invalid | Verify `CLAUDE_ACCESS_TOKEN` secret |
| Workflow not triggered | Mention not detected | Ensure `@claude` is in comment body |
| Response truncated | Max turns reached | Default is 10 turns per conversation |
| Permission denied | Missing repo permissions | Check workflow permissions block |

## Runbook

### Manual Sync Override

When automated sync fails or you need immediate sync:

```bash
# 1. Check current sync state
cat .sync-state/last-synced-sha

# 2. Trigger manual sync via CLI
gh workflow run sync-fpf.yml -f force_sync=true

# 3. Or sync specific number of commits
gh workflow run sync-fpf.yml -f commit_count=10

# 4. Monitor progress
gh run watch
```

### Reset Sync State

If sync gets stuck or you need to re-sync from a specific point:

```bash
# 1. Find the commit SHA you want to sync from
git log upstream/main --oneline -20

# 2. Update the state file locally
echo "<COMMIT_SHA_TO_SYNC_FROM>" > .sync-state/last-synced-sha

# 3. Commit and push
git add .sync-state/last-synced-sha
git commit -m "chore: reset sync state to SHA"
git push

# 4. Trigger sync
gh workflow run sync-fpf.yml
```

### Verify Claude Token

```bash
# Check if secret exists (won't show value)
gh secret list | grep CLAUDE_ACCESS_TOKEN

# Test workflow manually
gh workflow run claude.yml
```

## Changelog

### 2026-01-08
- Added workflow documentation (SYNC-FPF.md, CLAUDE.md)
- Added methodology and references sections
- Created WORKFLOWS.md index

### Previous
- Initial workflow implementations
- Added conflict resolution to sync workflow
- Migrated Claude auth from API key to OAuth token

## Contributing

When modifying workflows:

1. **Test locally** using [act](https://github.com/nektos/act) if possible
2. **Update documentation** in the corresponding `.md` file
3. **Add changelog entry** in both the workflow doc and this index
4. **Consider security implications** - review GitHub Actions security guide

## Related Links

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax Reference](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Security Hardening Guide](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
