const mongoose = require('mongoose');

// Lifecycle pipeline - order matters, used to validate forward/back moves in the controller
const STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];

const noteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const activitySchema = new mongoose.Schema(
  {
    action: { type: String, required: true }, // e.g. "status_changed", "assigned", "note_added", "created"
    detail: { type: String },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxLength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true, maxLength: 100 },
    message: { type: String, trim: true, maxLength: 1000 },
    source: { type: String, default: 'public_form' },
    status: { type: String, enum: STATUSES, default: 'new' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    notes: [noteSchema],
    activity: [activitySchema],
  },
  { timestamps: true }
);

leadSchema.index({ status: 1, assignedTo: 1, createdAt: -1 });

leadSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('Lead', leadSchema);
