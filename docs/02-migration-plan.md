# Task B — Phased Migration Plan
## No big-bang rewrite. It ships in week 1, month 1, quarter 1.

The constraint that shapes this whole plan: **the product cannot go down**,
and there is no separate "refactor sprint" where feature work stops. Every
phase below is designed to be doable alongside normal feature requests, in
small pieces that each leave the system in a working, deployable state — no
step depends on a later step being finished first.

## Week 1 — stop the bleeding

- Rotate all committed secrets; move them to environment variables. (Same-day,
  see assessment doc.)
- Add `.env` to `.gitignore`, add a secret-scanning check to CI so this can't
  silently recur.
- Stand up a minimal CI pipeline that runs whatever tests exist (even zero)
  on every PR — the pipeline itself is the deliverable this week, not
  coverage.
- Pick the single highest-traffic flow in the app and write 3–5 tests around
  its *current* behavior, bugs and all. This isn't about correctness yet —
  it's a tripwire so the next changes don't silently break what's already
  there.
- **Ships this week:** no user-visible change. Purely risk reduction.

## Month 1 — build the seam

- Introduce a real API layer for the one or two data entities the frontend
  currently talks to the database for directly, starting with whichever one
  is written to most often (writes are riskier than reads). Old direct-DB
  paths and new API paths can coexist — this is done entity by entity, not
  as one cutover.
- As each entity moves behind the API, extract its business logic out of
  route handlers into a service module (see the concrete refactor in
  deliverable 3) and add tests for that service, not the route.
- Every PR that touches a file with no tests must add at least one before
  merging — a "boy scout rule," not a mandate to test the whole app.
- **Ships this month:** one or two entities fully behind a tested API layer;
  everything else unchanged and still working exactly as before.

## Quarter 1 — make it stick

- Repeat the entity-by-entity migration from Month 1 across the remaining
  data the frontend touches directly, in order of how often it's written to.
- Once a meaningful slice of the app is behind the service layer, introduce
  the engineering standards (deliverable 4) as enforced CI gates — lint
  rules, required test coverage on new/changed files, PR review checklist —
  so the old patterns can't creep back in behind the new ones.
- Revisit and expand the test suite around whatever flows have shipped the
  most incidents or bugs in that quarter — this is where coverage actually
  compounds, rather than chasing 100% for its own sake.
- **Ships this quarter:** the direct frontend-to-database path is gone (or
  down to a deliberately-scoped exception), most business logic lives in a
  tested service layer, and the standards from deliverable 4 are enforced
  automatically rather than by memory.

## What deliberately does NOT happen

- No "refactor everything" branch that sits unmerged for weeks — every step
  above ships independently.
- No pause on feature work — this plan is designed to run in parallel with
  whatever the roadmap already has planned, one file/entity at a time.
- No mandate to reach 100% test coverage — coverage targets the riskiest and
  most-touched code first, not an arbitrary percentage.
