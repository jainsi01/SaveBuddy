const express = require('express');
const {
  createGroupGoal,
  getGroupGoals,
  getGroupGoalById,
  addMember,
  removeMember,
  getGroupBreakdown,
} = require('../controllers/groupGoalController');
const { validateCreateGoal } = require('../middleware/validators/goalValidator');
const { protect } = require('../middleware/authMiddleware');
const {
  requireGroupMembership,
  requireGroupOwner,
} = require('../middleware/groupAuthMiddleware');

const router = express.Router();

// Enforce JWT authentication on all group goal endpoints
router.use(protect);

router
  .route('/')
  .post(validateCreateGoal, createGroupGoal)
  .get(getGroupGoals);

router
  .route('/:id')
  .get(requireGroupMembership, getGroupGoalById);

router
  .route('/:id/members')
  .post(requireGroupMembership, requireGroupOwner, addMember);

router
  .route('/:id/members/:userId')
  .delete(requireGroupMembership, removeMember);

router
  .route('/:id/breakdown')
  .get(requireGroupMembership, getGroupBreakdown);

module.exports = router;
