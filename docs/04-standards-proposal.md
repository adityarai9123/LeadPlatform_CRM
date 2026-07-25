# Task B — Engineering Standards Proposal

## The standards

1. **Business logic lives in service functions, not route handlers.**
   A route handler's job is: parse the request, call a service, shape the
   response. If a handler has an `if` statement that isn't about HTTP (status
   codes, request shape), that logic belongs in a service.

2. **Secrets never enter the repo.** Environment variables only, enforced by
   a CI secret-scan on every PR — not a rule people have to remember, a check
   that fails the build if broken.

3. **The frontend talks to an API, never to the database directly.** Any new
   feature must go through an endpoint, even if it's a thin pass-through
   initially.

4. **Every PR that touches a file adds or updates a test for the code it
   changed.** Not 100% coverage as a target — coverage as a side effect of
   never touching untested logic without also testing it.

5. **Errors carry a status code and flow through one central handler**,
   rather than each route hand-rolling `res.status(...)` inline.

## How I'd get a resistant team to actually adopt this

Teams resist new standards for a specific, usually legitimate reason: past
experience where "best practices" meant more process and less shipping. So
the adoption plan is built to prove the opposite before asking for buy-in on
principle.

- **Lead with the bug, not the lecture.** The double-discount bug found
  during the refactor (deliverable 3) is a better argument for a service
  layer than any slide about clean architecture — it's a concrete, real
  consequence of the current pattern. I'd walk the team through that one
  example before proposing anything company-wide.

- **Make the standard the path of least resistance, not an extra step.**
  CI checks (secret scanning, "no new file without a test") that fail the
  build are more durable than a wiki page nobody rereads — the standard
  enforces itself instead of relying on review vigilance or memory.

- **Apply it opportunistically, not as a mandate to stop and refactor.**
  Nobody is asked to "go clean up the codebase" as a side project. The
  standards apply to whatever a PR is already touching, per the migration
  plan in deliverable 2. This is what makes it possible to adopt on a
  product that can't go down and can't pause feature work.

- **Make the first few examples visible and low-stakes.** I'd pick one or
  two low-traffic routes to refactor first as a template PR the team can
  point to and copy the pattern from, rather than asking every engineer to
  invent their own interpretation of "service layer" independently.

- **Revisit the standards themselves after a month.** If a rule is
  consistently annoying rather than useful in practice, that's a signal to
  adjust it, not a signal that the team is resisting for no reason. Standards
  that can't be questioned tend to get quietly ignored instead.
