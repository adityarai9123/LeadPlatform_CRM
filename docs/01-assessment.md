# Task B — Assessment Document
## Inheriting the existing codebase

**Context assumed:** a live product serving real customers, no tests, business
logic embedded in route handlers, the frontend hitting the database directly,
and secrets committed to the repo. It cannot go down.

The rule I'm applying throughout: **fix in order of blast radius, not
annoyance.** A messy file that only I have to look at is a much lower
priority than a hole that could leak customer data or take the site down,
even if the messy file bothers me more day to day.

## Issues, ranked

### 1. Secrets committed to the repo — fix immediately, same day
**Risk of leaving it:** anyone with repo access (including former employees,
contractors, or anyone the repo is accidentally shared with) has standing
production credentials. This is the one item on this list that is an active
incident, not a design flaw — every day it's left in place is a day of
exposure, and it doesn't get more expensive to fix later, it just gets more
likely to be exploited.
**Fix:** rotate every exposed credential immediately (this is non-negotiable —
scrubbing git history doesn't undo a leak that's already happened), move
secrets to environment variables / a secrets manager, add `.env` to
`.gitignore`, add a pre-commit hook or CI check (e.g. `gitleaks`) so it can't
happen again silently.
**Why it's first despite being "quick":** low effort, highest and most
irreversible risk. There's no version of this plan where it isn't step one.

### 2. Frontend calling the database directly — fix second, within the week
**Risk of leaving it:** the frontend effectively has raw database credentials
or an unrestricted data path, which means there's no server-side place to
enforce validation, authorization, or rate limits. Any client-side bug or
malicious actor can write bad or unauthorized data straight into production.
This is a security and data-integrity risk, not just a style problem.
**Fix:** stand up a thin API layer between frontend and database — doesn't
need to be the *final* architecture, just a real boundary. Move read/write
calls behind endpoints one entity at a time, starting with whatever the
frontend writes to (writes are more dangerous than reads).
**Why it's second, not first:** it's a standing risk like #1, but rotating
secrets is a same-day fix; closing this path properly takes real engineering
time, so it starts now but isn't "done" on day one.

### 3. No tests — fix third, but starts immediately and never really finishes
**Risk of leaving it:** every change from here on is a gamble. This doesn't
cause an incident by itself, but it's what turns every other fix on this list
into a higher-risk operation than it needs to be, because there's no safety
net to catch a regression.
**Fix:** don't write a test suite for the whole app up front — that's a
multi-week detour that delivers nothing until it's finished. Instead, require
a test for every file touched while doing #2 and #4, and backfill tests
around the highest-traffic/highest-risk flows first (checkout, auth,
payments — whatever the equivalent is here).
**Why it's not first:** it doesn't reduce risk on its own; it reduces the risk
of *everything else*. It's threaded through the rest of the plan rather than
done as a standalone phase.

### 4. Business logic inside route handlers — fix fourth, ongoing
**Risk of leaving it:** this is a productivity and correctness tax, not a
security hole. It makes every future change slower and more error-prone
(logic duplicated across handlers, no single place to unit test a rule), and
it's what makes #2 harder than it should be — you can't cleanly move data
access behind a service layer if the service layer doesn't exist yet.
**Fix:** extract logic into a service layer as each route is touched for
another reason (don't do a standalone "refactor everything" sprint — that's
the big-bang rewrite the brief explicitly rules out). See the concrete
refactor in deliverable 3.
**Why it's last of the four:** it's real technical debt, but it's not
actively leaking data or costing customers today the way #1–#3 are. It's the
one item where "leave it a bit longer" is a legitimate, bounded choice.

## Summary table

| # | Issue | Risk if left | Urgency |
|---|---|---|---|
| 1 | Secrets in repo | Active credential exposure | Same day |
| 2 | Frontend → DB direct | No enforcement point for auth/validation | This week, ongoing |
| 3 | No tests | Every future change is higher-risk | Starts now, never "done" |
| 4 | Logic in route handlers | Slower, error-prone changes | Ongoing, opportunistic |
