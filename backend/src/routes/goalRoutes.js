const express = require('express');
const {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
} = require('../controllers/goalController');
const {
  validateCreateGoal,
  validateUpdateGoal,
} = require('../middleware/validators/goalValidator');
const { protect } = require('../middleware/authMiddleware');
const contributionRoutes = require('./contributionRoutes');
const aiRoutes = require('./aiRoutes');

const router = express.Router();

// Enforce JWT authentication on all savings goal endpoints
router.use(protect);

// Forward contribution routes: /api/goals/:id/contributions
router.use('/:id/contributions', contributionRoutes);

// Forward AI advisor routes: /api/goals/:id/ai-plan
router.use('/:id/ai-plan', aiRoutes);

router
  .route('/')
  .post(validateCreateGoal, createGoal)
  .get(getGoals);

router
  .route('/:id')
  .get(getGoalById)
  .put(validateUpdateGoal, updateGoal)
  .delete(deleteGoal);

module.exports = router;
