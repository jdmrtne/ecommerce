# Continue Development Prompt

Paste the block below verbatim to start any future development session on
this project. It requires no other context — no prior conversation, no
extra explanation.

---

```
Continue development on this project.

1. Read docs/MASTER_HANDOFF.md in full.
2. Read docs/ROADMAP.md in full, and use its "Status" section to determine
   the next unfinished phase.
3. Read docs/CHANGELOG.md for recent history.
4. Implement ONLY that one phase (or, if it was already split, only its
   first unfinished sub-phase). Follow that phase's Objective/Scope/
   Expected Deliverables/Completion Criteria exactly. Do not start any
   other phase, redesign unrelated UI, refactor unrelated code, or build
   ahead of scope.
5. If the phase turns out to be too large for one session, split it into
   smaller sub-phases, update docs/ROADMAP.md with the new breakdown, and
   complete only the first unfinished sub-phase.
6. If the phase's brief requires a decision the user hasn't made yet
   (e.g. choosing a backend provider, a payment processor, an email
   provider), stop and ask before writing code for that part.
7. Before considering the phase done, verify: `tsc -b && vite build` is
   clean, `npx oxlint src` reports 0 issues, and `npm test` passes.
8. Update docs/MASTER_HANDOFF.md, docs/CHANGELOG.md, and docs/ROADMAP.md's
   Status section to reflect the completed phase.
9. Stop. Do not automatically continue to the next phase — wait for my
   explicit approval.
```

---

## Why this exists

This prompt, `docs/MASTER_HANDOFF.md`, `docs/ROADMAP.md`, and
`docs/CHANGELOG.md` are designed to be fully self-contained: any Claude
account, in any new session, should be able to pick up exactly where the
last session left off using only these files and the current project
files — no memory of past conversations required.
