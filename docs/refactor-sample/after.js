// AFTER — the same feature, refactored. The route handler now only does
// HTTP concerns (parse request, call service, shape response). The rule
// itself lives in a pure, testable function with no database or HTTP
// dependency, and the "already discounted" bug is fixed as a side effect
// of making the logic explicit enough to see it.

// services/discountService.js
function calculateDiscount(order) {
  const { customer, total } = order;

  if (customer.loyaltyTier === 'gold' && total > 50) {
    return total * 0.1;
  }
  if (total > 100) {
    return total * 0.05;
  }
  return 0;
}

async function applyDiscountToOrder(ordersRepo, orderId) {
  const order = await ordersRepo.findById(orderId);
  if (!order) {
    const err = new Error('Order not found');
    err.statusCode = 404;
    throw err;
  }

  if (order.discountApplied) {
    const err = new Error('Discount already applied to this order');
    err.statusCode = 409;
    throw err;
  }

  const discount = calculateDiscount(order);
  const updated = await ordersRepo.update(orderId, {
    total: order.total - discount,
    discountApplied: discount,
  });

  return updated;
}

module.exports = { calculateDiscount, applyDiscountToOrder };


// routes/orders.js
const express = require('express');
const router = express.Router();
const ordersRepo = require('../repositories/ordersRepo');
const { applyDiscountToOrder } = require('../services/discountService');

router.post('/orders/:id/apply-discount', async (req, res, next) => {
  try {
    const updated = await applyDiscountToOrder(ordersRepo, req.params.id);
    res.json(updated);
  } catch (err) {
    next(err); // handled by a central error middleware -> correct status code
  }
});

module.exports = router;


// tests/discountService.test.js
const { calculateDiscount, applyDiscountToOrder } = require('../services/discountService');

test('gold tier over $50 gets 10% off', () => {
  const discount = calculateDiscount({ customer: { loyaltyTier: 'gold' }, total: 100 });
  expect(discount).toBe(10);
});

test('non-gold over $100 gets 5% off', () => {
  const discount = calculateDiscount({ customer: { loyaltyTier: 'standard' }, total: 200 });
  expect(discount).toBe(10);
});

test('below thresholds gets no discount', () => {
  const discount = calculateDiscount({ customer: { loyaltyTier: 'standard' }, total: 40 });
  expect(discount).toBe(0);
});

test('refuses to apply a discount twice', async () => {
  const fakeRepo = {
    findById: async () => ({ total: 100, discountApplied: 5, customer: { loyaltyTier: 'gold' } }),
    update: async () => { throw new Error('should not be called'); },
  };
  await expect(applyDiscountToOrder(fakeRepo, 'abc')).rejects.toThrow('already applied');
});
