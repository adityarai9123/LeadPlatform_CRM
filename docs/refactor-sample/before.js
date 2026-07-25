// BEFORE — realistic example of what a route handler looks like in the
// inherited codebase: business logic, validation, and a direct DB call
// all live inline in the handler. This is deliberately representative,
// not a strawman — this is the kind of code that accumulates naturally
// when a team is moving fast without a service layer.

const express = require('express');
const router = express.Router();
const db = require('../db'); // raw mongo client, connected globally

router.post('/orders/:id/apply-discount', async (req, res) => {
  const order = await db.collection('orders').findOne({ _id: req.params.id });
  if (!order) {
    return res.status(404).send('not found');
  }

  // business rule: loyalty customers get 10% off orders over $50,
  // everyone else gets 5% off orders over $100. Buried here, undocumented,
  // and untestable without spinning up the whole HTTP layer.
  let discount = 0;
  if (order.customer.loyaltyTier === 'gold' && order.total > 50) {
    discount = order.total * 0.1;
  } else if (order.total > 100) {
    discount = order.total * 0.05;
  }

  // no validation that discount hasn't already been applied — calling this
  // route twice double-discounts the order.
  order.total = order.total - discount;
  order.discountApplied = discount;

  await db.collection('orders').updateOne(
    { _id: req.params.id },
    { $set: { total: order.total, discountApplied: discount } }
  );

  res.json(order);
});

module.exports = router;
