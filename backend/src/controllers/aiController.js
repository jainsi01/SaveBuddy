const SavingsGoal = require('../models/SavingsGoal');
const AIPlan = require('../models/AIPlan');
const AppError = require('../utils/AppError');
const { generatePlanWithGemini } = require('../services/geminiService');

/**
 * Generate or Regenerate AI Savings Plan (FR-06, EC-5.1 - EC-5.8)
 * POST /api/goals/:id/ai-plan
 */
async function generatePlan(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const goal = await SavingsGoal.findById(id);
    if (!goal) {
      return next(new AppError('Savings goal not found.', 404, 'GOAL_NOT_FOUND'));
    }

    // IDOR Access Check: Only goal owner or group member can generate AI plans
    const isOwner = goal.ownerId.toString() === userId.toString();
    if (!isOwner) {
      return next(
        new AppError('You do not have permission to generate an AI plan for this goal.', 403, 'FORBIDDEN')
      );
    }

    // EC-5.6: Prevent AI plan generation if goal is already 100% funded
    if (goal.currentAmount >= goal.targetAmount) {
      return res.status(400).json({
        success: false,
        error: 'Goal is already fully funded! No savings plan required.',
        code: 'GOAL_ALREADY_COMPLETED',
      });
    }

    // Optional user constraints
    const options = {
      preferredFrequency: req.body?.preferredFrequency || 'weekly',
      additionalNotes: req.body?.additionalNotes || '',
    };

    // Generate plan via Gemini or fallback engine
    const planData = await generatePlanWithGemini(goal, options);

    // Persist or update cached plan in MongoDB (docs/database_design.md Section 3.5)
    const savedPlan = await AIPlan.findOneAndUpdate(
      { goalId: goal._id },
      {
        goalId: goal._id,
        recommendedWeekly: planData.recommendedWeekly,
        recommendedMonthly: planData.recommendedMonthly,
        achievabilityScore: planData.achievabilityScore,
        milestones: planData.milestones,
        practicalRecommendations: planData.practicalRecommendations,
        disclaimer: planData.disclaimer,
        modelUsed: planData.modelUsed,
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: savedPlan,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Cached AI Savings Plan (FR-06, API Spec Section 6.2)
 * GET /api/goals/:id/ai-plan
 */
async function getPlan(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const goal = await SavingsGoal.findById(id);
    if (!goal) {
      return next(new AppError('Savings goal not found.', 404, 'GOAL_NOT_FOUND'));
    }

    const isOwner = goal.ownerId.toString() === userId.toString();
    if (!isOwner) {
      return next(
        new AppError('You do not have permission to view the AI plan for this goal.', 403, 'FORBIDDEN')
      );
    }

    const cachedPlan = await AIPlan.findOne({ goalId: goal._id });
    if (!cachedPlan) {
      return res.status(404).json({
        success: false,
        error: 'AI savings plan not found for this goal. Please generate one first.',
        code: 'AI_PLAN_NOT_FOUND',
      });
    }

    res.status(200).json({
      success: true,
      data: cachedPlan,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generatePlan,
  getPlan,
};
