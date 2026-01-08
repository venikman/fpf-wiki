# Claude Code Workflow

> Documentation for `.github/workflows/claude.yml`

## Methodology & References

### Pipeline Pattern: ChatOps via @Mention

This workflow implements a **ChatOps pattern** where AI assistance is triggered by `@claude` mentions in GitHub conversations.

| Approach | Pros | Cons | Used Here? |
|----------|------|------|------------|
| **Auto-review on PR** | No manual trigger needed | May be noisy, runs on every PR | No |
| **Slash commands** | Explicit intent, multiple commands | Requires parsing, more complex | No |
| **@Mention trigger** | Natural language, contextual | Single trigger mechanism | **Yes** |
| **Manual workflow dispatch** | Full control | Breaks conversation flow | No |

### Why @Mention Trigger?

1. **Natural Interaction**: Users ask questions as they would to a human reviewer
2. **Contextual**: Claude sees the full issue/PR context automatically
3. **Opt-in**: Only runs when explicitly requested (not every PR)
4. **Conversational**: Supports back-and-forth dialogue within same thread

### Design Patterns Used

| Pattern | Description | Reference |
|---------|-------------|-----------|
| **ChatOps** | Conversation-driven operations | [ChatOps Overview](https://www.atlassian.com/blog/software-teams/what-is-chatops-adoption-guide) |
| **Event-Driven Automation** | Responds to GitHub webhook events | [GitHub Actions Events](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows) |
| **Expression-Based Filtering** | Uses `contains()` in job conditions | [GitHub Actions Expressions](https://docs.github.com/en/actions/learn-github-actions/expressions) |
| **OAuth Token Auth** | Secure API authentication | [OIDC for GitHub Actions](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect) |
| **Turn Limiting** | Prevents runaway conversations | Custom rate limiting |

### Alternative Approaches Considered

| Alternative | Why Not Used |
|-------------|--------------|
| Auto-review all PRs | Too noisy, higher API costs, not always needed |
| Slash commands (`/review`) | More complex parsing, less natural |
| Separate bot application | Higher maintenance, separate auth flow |
| Manual workflow dispatch | Breaks conversational flow |

### Security Model

```text
User Comment → GitHub Webhook → Actions Expression Filter → Claude Code Action
                                      ↓
                              contains('@claude')?
                                   ↓    ↓
                                 Yes    No
                                  ↓      ↓
                            Run Job   Skip
```

The `contains()` function is a GitHub Actions expression evaluated before shell execution, preventing injection attacks from malicious comment content.

### References

- [Claude Code Action (Official)](https://github.com/anthropics/claude-code-action)
- [ChatOps: Putting Tools in the Middle of Conversation](https://www.pagerduty.com/blog/what-is-chatops/)
- [GitHub Actions Security Hardening](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [GitHub Webhook Events](https://docs.github.com/en/webhooks/webhook-events-and-payloads)

## Current State

| Attribute | Value |
|-----------|-------|
| **Status** | Active |
| **Last Updated** | 2026-01-08 |
| **Stability** | Production |
| **Health** | Healthy |

## What It Does

This workflow enables AI-assisted code review and issue response by invoking Claude Code when `@claude` is mentioned in GitHub issues or pull requests.

### Trigger Conditions

| Event | Condition |
|-------|-----------|
| **Issue Comment** | Comment body contains `@claude` |
| **PR Review Comment** | Comment body contains `@claude` |
| **PR Review** | Review body contains `@claude` |

### Execution Flow

1. **Trigger Detection** - GitHub Actions expression checks for `@claude` mention
2. **Checkout** - Full repository clone for code context
3. **Claude Invocation** - Runs `anthropics/claude-code-action@v1`
4. **Response** - Claude posts reply in the same thread

### Configuration

| Setting | Value | Notes |
|---------|-------|-------|
| **Max Turns** | 10 | Limits conversation depth |
| **Auth Method** | OAuth Token | Via `CLAUDE_ACCESS_TOKEN` secret |
| **Fetch Depth** | 0 (full) | Full history for context |

## Quality Assessment

### Strengths

| Area | Rating | Notes |
|------|--------|-------|
| **Security** | Good | Uses GitHub expression `contains()` (not shell) |
| **Trigger Logic** | Good | Explicit `@claude` mention required |
| **Permissions** | Good | Scoped to issues, PRs, contents, id-token |
| **Simplicity** | Excellent | Minimal configuration, relies on action defaults |

### Weaknesses

| Area | Rating | Notes |
|------|--------|-------|
| **Rate Limiting** | Missing | No protection against spam mentions |
| **User Filtering** | Missing | Any user can trigger Claude |
| **Cost Control** | Limited | Only max-turns limit, no token budget |
| **Logging** | Basic | No custom logging of Claude interactions |

### Security Considerations

- Trigger condition uses `contains()` GitHub expression (safe from injection)
- OAuth token stored in secrets (not exposed)
- Comment at line 20 documents the safety design choice
- No shell interpolation of user-provided content

## Plans to Change

### Short-term (Next Sprint)

- [ ] Add user allowlist to restrict who can invoke Claude
- [ ] Add rate limiting (max invocations per user per hour)
- [ ] Add `/claude help` command documentation in repo

### Medium-term (Next Quarter)

- [ ] Integrate with custom prompts for project-specific context
- [ ] Add token usage tracking and alerts
- [ ] Support additional commands (`/claude review`, `/claude explain`)
- [ ] Add cooldown period between invocations

### Long-term (Roadmap)

- [ ] Custom Claude Code configuration file (`.claude/config.yml`)
- [ ] Integration with CI test results (Claude can see test failures)
- [ ] Auto-assignment of issues to Claude for triage
- [ ] Metrics dashboard for Claude usage and quality

## Metrics

### Key Performance Indicators

| Metric | Target | Current | Notes |
|--------|--------|---------|-------|
| **Response Rate** | 100% | TBD | Successful responses to mentions |
| **Avg Response Time** | < 60s | TBD | Time from mention to reply |
| **User Satisfaction** | > 80% | TBD | Based on reaction emoji |
| **Error Rate** | < 5% | TBD | Failed or incomplete responses |

### Tracking Methods

```bash
# Workflow success rate (last 30 runs)
gh run list --workflow=claude.yml --limit=30 --json conclusion \
  | jq '[.[] | select(.conclusion == "success")] | length / 30 * 100'

# Trigger count by event type
gh run list --workflow=claude.yml --limit=100 --json event \
  | jq 'group_by(.event) | map({event: .[0].event, count: length})'
```

### Usage Analytics

Track via GitHub API:
- Number of `@claude` mentions per week
- Response length distribution
- Common question categories
- Repeat user patterns

## Permissions Required

| Permission | Level | Purpose |
|------------|-------|---------|
| `contents` | write | Read code, create commits if needed |
| `pull-requests` | write | Comment on PRs, request changes |
| `issues` | write | Comment on issues |
| `id-token` | write | OIDC authentication |

## Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| `actions/checkout` | v4 | Repository checkout |
| `anthropics/claude-code-action` | v1 | Claude Code integration |

## Secrets Required

| Secret | Purpose |
|--------|---------|
| `CLAUDE_ACCESS_TOKEN` | OAuth token for Claude API authentication |

## Related Documentation

- [Claude Code Action](https://github.com/anthropics/claude-code-action)
- [Claude Code Documentation](https://docs.anthropic.com/claude-code)
- [GitHub Actions Events](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows)
