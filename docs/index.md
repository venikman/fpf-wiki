---
layout: default
title: Sync Reports
---

# FPF Sync Reports

This site tracks commits synced from the upstream [ailev/FPF](https://github.com/ailev/FPF) repository.

## Recent Reports

{% if site.reports.size > 0 %}
| Date | Commits | Summary |
|------|---------|---------|
{% for report in site.reports reversed %}| [{{ report.date | date: "%Y-%m-%d" }}]({{ report.url | relative_url }}) | {{ report.commits_count }} | {{ report.summary | truncate: 60 }} |
{% endfor %}
{% else %}
*No sync reports yet. Reports will appear here after the first sync.*
{% endif %}

---

## About

This page is automatically updated by the [sync workflow](https://github.com/venikman/fpf-wiki/actions/workflows/sync-fpf.yml) whenever new commits are detected in the upstream FPF repository.
