# Task B — Before/After Refactor

Sample code: `refactor-sample/before.js` and `refactor-sample/after.js`
(the "after" version is written as three logical files —
`services/discountService.js`, `routes/orders.js`, `tests/discountService.test.js`
— shown together in one file for easy reading, marked by comments).

## The scenario

A route that applies a loyalty discount to an order — chosen because it's a
realistic, self-contained example of exactly the two problems named in the
brief: business logic living inside a route handler, and no separation
between HTTP concerns and the rule itself.

## What changed, and why it matters

**1. The rule moved out of the handler and into a pure function.**
`calculateDiscount(order)` takes plain data in, returns a number out — no
database, no `req`/`res`. That's what makes it unit-testable in milliseconds
without spinning up Express or a database connection, and it's what let me
write four tests for it in under a minute.

**2. A real bug surfaced during the refactor, not before.**
The original handler had no guard against calling the endpoint twice —
each call would discount the *already-discounted* total again. This wasn't
visible as a "bug" in the original code because the logic was tangled up
with the database call; once the rule was isolated, the missing check became
obvious, and I added it (`if (order.discountApplied) throw 409`) along with a
test that locks it in. This is the value of doing the refactor, not just
recommending it: this exact bug would ship again if I only described the
pattern instead of applying it.

**3. Error handling moved to a central place.**
The route handler now just calls the service and forwards any thrown error
to `next(err)`, where a shared error-handling middleware maps `err.statusCode`
to the right HTTP response. Before, every route had to remember to hand-roll
its own status codes; now that's one piece of shared infrastructure instead
of copy-pasted logic per route.

**4. The route handler is now boring, on purpose.**
Its whole job is: read the request, call the service, shape the response.
That's the goal of this kind of refactor — not "prettier code," but a
handler so simple it's hard to get wrong, and a rule so isolated it's easy
to test and change without touching HTTP plumbing at all.

## What I deliberately did NOT do

I didn't introduce a repository abstraction layer, a full DI container, or
restructure the whole `orders` module in this pass — that's a bigger change
than one bug fix justifies, and it's exactly the kind of scope creep the
migration plan (deliverable 2) is designed to avoid. The `ordersRepo` shown
here is the minimum interface needed to make `applyDiscountToOrder`
testable; expanding it further happens opportunistically, as more of the
`orders` routes get touched — not as a standalone task.
