const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// POST /api/users  (admin only) - the only way member accounts get created,
// there is no public self-registration for the internal app.
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email and password are required');
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    res.status(409);
    throw new Error('A user with this email already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role === 'admin' ? 'admin' : 'member',
  });

  res.status(201).json({
    success: true,
    data: { _id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// GET /api/users  (admin only) - used to populate the "assign to" dropdown
const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('_id name email role');
  res.json({ success: true, data: users });
});

module.exports = { createUser, listUsers };
