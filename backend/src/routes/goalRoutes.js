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

const router = express.Router();

// Enforce JWT authentication on all savings goal endpoints
router.use(protect);

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
