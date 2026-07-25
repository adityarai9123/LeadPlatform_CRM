const express = require('express');

const {
  captureLead,
  listLeads,
  getLead,
  updateStatus,
  assignLead,
  addNote,
  deleteLead,
} = require('../controllers/leadController');

const { protect, authorize } = require('../middleware/auth');

const captureLimiter = require("../middleware/rateLimiter");

const router = express.Router();

// Public capture endpoint - no auth
router.post("/capture", captureLimiter, captureLead);

// Everything below requires a logged-in user
router.use(protect);

router.get('/', listLeads);
router.get('/:id', getLead);
router.patch('/:id/status', updateStatus);
router.post('/:id/notes', addNote);

// Admin-only actions
router.patch('/:id/assign', authorize('admin'), assignLead);
router.delete('/:id', authorize('admin'), deleteLead);

module.exports = router;
