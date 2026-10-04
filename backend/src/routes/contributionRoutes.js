const express = require('express');
const {
  addContribution,
  getContributions,
} = require('../controllers/contributionController');
const {
  validateAddContribution,
} = require('../middleware/validators/contributionValidator');
const { protect } = require('../middleware/authMiddleware');

// mergeParams: true ensures access to :id from parent router (/api/goals/:id/contributions)
const router = express.Router({ mergeParams: true });

router.use(protect);

router
  .route('/')
  .post(validateAddContribution, addContribution)
  .get(getContributions);

module.exports = router;
