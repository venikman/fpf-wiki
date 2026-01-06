U.BoundedContext: BC.DecisionDesktop
  Purpose: constrain language for running and maintaining “Decision Desktop” decisions.

U.Method: M.DecisionDesktop
  isDescribedBy: MD.DecisionDesktop.MVP.v1

U.MethodDescription: MD.DecisionDesktop.MVP.v1    (controlled narrative, ~F3)
  Objective:
    Produce and maintain a 1-page Decision Desktop (PlainView + Exploration Table + Guardrails + Review Cadence)
    for one critical decision under uncertainty. Output must support weekly update and action selection.
    (Deliverable described in Strategic Framework.) :contentReference[oaicite:17]{index=17}

  Roles (role-kinds, not people):
    - FacilitatorRole: runs timeboxes and prompts (no content ownership).
    - DecisionOwnerRole: owns the decision and commits to pre-work + updates.
    - ScribeRole: maintains the shared Decision Desktop document.
    - SignalOwnerRole[*]: owns a specific early-signal metric for a scenario row.
    - StakeholderRole[*]: contributes scenarios and commits to review cadence.

  Inputs (pre-work):
    - Draft PlainView by DecisionOwnerRole (10–15 min). :contentReference[oaicite:18]{index=18}

  Output artifacts (end of Workshop Work):
    A) PlainView (must include):
       - Decision statement and “why now”
       - 1–3 observable Success Criteria with targets + horizons (time-bounded)
       - Horizon End Date
       - Review Date (mandatory)
       - Owner + Decision/Goal ID
       :contentReference[oaicite:19]{index=19}
    B) Exploration Table (rows for top scenarios) with:
       - Scenario driver ∈ {Skill, Luck}
       - Item (scenario statement)
       - p (probability, use coarse bands 0.1/0.3/0.5/0.7/0.9 in workshop)
       - Impact ∈ {L,M,H} with meaning: H breaks a success criterion; M delays/degrades; L minor
       - Early Signal (measurable)
       - Owner + Review cadence
       :contentReference[oaicite:20]{index=20}:contentReference[oaicite:21]{index=21}
    C) Review Cadence (weekly meeting locked: day/time/duration/attendees) :contentReference[oaicite:22]{index=22}

  Procedure (Workshop Work, 75 min):
    Step 1 (0–10 min): Finalize PlainView (silent read, clarify, finalize). :contentReference[oaicite:23]{index=23}
    Step 2 (10–30 min): Premortem: generate failures (skill then luck), vote top 5, assign p + early signals. :contentReference[oaicite:24]{index=24}
    Step 3 (30–50 min): Backcast: generate success drivers (skill then luck), vote top 5, assign p + early signals. :contentReference[oaicite:25]{index=25}
    Step 4 (50–65 min): Build Exploration Table: merge scenarios, add owners, review cadences, and mitigation/amplifier notes. :contentReference[oaicite:26]{index=26}
    Step 5 (65–75 min): Schedule Review + Close: lock weekly review; DecisionOwnerRole commits to pre-work. :contentReference[oaicite:27]{index=27}

  Exclusions (MVP discipline):
    - No “Dr. Evil”/adversarial persona exercise in Week 1 workshop.
    - Precommitments and hedges may be drafted only if time remains; otherwise defer to later. (Consistent with “start with MVP” guidance.) :contentReference[oaicite:28]{index=28}

  Acceptance (what “done” means):
    - A single page exists with PlainView + Exploration Table + Review cadence.
    - Weekly review can update the page in <5 min after meeting. :contentReference[oaicite:29]{index=29}

U.WorkPlan: WP.DecisionDesktop.v1   (schedule of intended occurrences; no “actuals” here)
  Planned occurrences:
    - Work: W.DecisionDesktop.Workshop (one-time, 75 min, roles as above).
    - Work: W.DecisionDesktop.WeeklyReview (recurring, 30–45 min).
    - Optional Work: W.DecisionDesktop.MonthlyDeepDive (recurring, 90 min, no Dr Evil language).

  WeeklyReview agenda (30–45 min) (method instance to be enacted as Work):
    1) Update signals (owners report; threshold crossings flagged).
    2) Update top probabilities (top 5 scenarios; document what changed and why).
    3) Check precommitment enforcement.
    4) Decide 0–1 changes (avoid decision fatigue).
    5) Confirm next review (date/time/attendees; DecisionOwner pre-work).
    :contentReference[oaicite:30]{index=30}

Conformance checklist (minimal, spec-like):
  - Every Work instance MUST be recorded as U.Work and MUST reference the MethodDescription it executes
    (separating recipe from occurrence). :contentReference[oaicite:31]{index=31}
  - Every planned meeting MUST live in U.WorkPlan; do not write “what happened” into the plan. :contentReference[oaicite:32]{index=32}
  - Success Criteria MUST be observable and time-bounded; Review Date MUST be present. :contentReference[oaicite:33]{index=33}
  - Each top scenario row MUST have an owner and review cadence. :contentReference[oaicite:34]{index=34}
  - Each weekly review MUST limit decisions to max 1 change. :contentReference[oaicite:35]{index=35}
  - HF-loop: after 2 enactments, capture friction points and revise MD/WP for cognitive load. :contentReference[oaicite:36]{index=36}
  - Proxy-audit: if a metric is a proxy for the true objective, declare it as proxy and re-audit monthly. :contentReference[oaicite:37]{index=37}
    