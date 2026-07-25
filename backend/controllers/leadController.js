const asyncHandler = require('express-async-handler');
const Lead = require('../models/Lead');
const User = require('../models/User');

// Permission rules (enforced here, not just hidden in the UI):
// - admin: full CRUD, can assign leads to any member, can delete
// - member: can view all leads, can add notes and move status ONLY on
//   leads assigned to them, cannot assign/reassign, cannot delete
const canModifyLead = (user, lead) => {
  if (user.role === 'admin') return true;
  return lead.assignedTo && lead.assignedTo.toString() === user._id.toString();
};

// POST /api/leads/capture  (PUBLIC - the lead capture form, no auth)
const captureLead = asyncHandler(async (req, res) => {
  const { name, email, phone, company, message } = req.body;

  if (!name || !email) {
    res.status(400);
    throw new Error('Name and email are required');
  }

  const lead = await Lead.create({
    name,
    email,
    phone,
    company,
    message,
    source: 'public_form',
    activity: [{ action: 'created', detail: 'Captured via public form' }],
  });

  res.status(201).json({ success: true, data: { id: lead._id } });
});

// GET /api/leads  (auth required) - paginated + filterable
// Query params: page, limit, status, assignedTo, q (search name/email/company)
const listLeads = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
  if (req.query.q) {
    const regex = new RegExp(req.query.q, 'i');
    filter.$or = [{ name: regex }, { email: regex }, { company: regex }];
  }

  const [leads, total] = await Promise.all([
    Lead.find(filter)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Lead.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: leads,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

// GET /api/leads/:id
const getLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id)
    .populate('assignedTo', 'name email')
    .populate('notes.author', 'name')
    .populate('activity.actor', 'name');

  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }

  res.json({ success: true, data: lead });
});

// PATCH /api/leads/:id/status
const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!Lead.STATUSES.includes(status)) {
    res.status(400);
    throw new Error(`status must be one of: ${Lead.STATUSES.join(', ')}`);
  }

  const lead = await Lead.findById(req.params.id);
  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }

  if (!canModifyLead(req.user, lead)) {
    res.status(403);
    throw new Error('Forbidden: this lead is not assigned to you');
  }

  const previous = lead.status;
  lead.status = status;
  lead.activity.push({
    action: 'status_changed',
    detail: `Status changed from ${previous} to ${status}`,
    actor: req.user._id,
  });
  await lead.save();

  res.json({ success: true, data: lead });
});

// PATCH /api/leads/:id/assign  (admin only, enforced via route middleware too)
const assignLead = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  const lead = await Lead.findById(req.params.id);

  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }

  // Allow unassigning
  let activityDetail = 'Lead unassigned';

  if (!userId) {
    lead.assignedTo = null;
  } else {
    const user = await User.findById(userId);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.role !== 'member') {
      res.status(400);
      throw new Error('Lead can only be assigned to a member');
    }

    lead.assignedTo = user._id;
    activityDetail = `Assigned to ${user.name}`;
  }

  lead.activity.push({
    action: 'assigned',
    detail: activityDetail,
    actor: req.user._id,
});

  await lead.save();

  res.json({
    success: true,
    data: lead,
  });
});

// POST /api/leads/:id/notes
const addNote = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    res.status(400);
    throw new Error('Note text is required');
  }

  const lead = await Lead.findById(req.params.id);
  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }

  if (!canModifyLead(req.user, lead)) {
    res.status(403);
    throw new Error('Forbidden: this lead is not assigned to you');
  }

  lead.notes.push({ text, author: req.user._id });
  lead.activity.push({
    action: 'note_added',
    detail: 'Added a note',
    actor: req.user._id,
  });
  await lead.save();

  res.status(201).json({ success: true, data: lead });
});

// DELETE /api/leads/:id  (admin only, enforced via route middleware too)
const deleteLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findByIdAndDelete(req.params.id);
  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }
  res.json({ success: true, data: {} });
});

module.exports = {
  captureLead,
  listLeads,
  getLead,
  updateStatus,
  assignLead,
  addNote,
  deleteLead,
};
