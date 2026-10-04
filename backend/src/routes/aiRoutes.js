const express = require('express');
const { generatePlan, getPlan } = require('../controllers/aiController');

// mergeParams: true allows access to :id from parent goal router
const router = express.Router({ mergeParams: true });

router
  .route('/')
  .post(generatePlan)
  .get(getPlan);

module.exports = router;
