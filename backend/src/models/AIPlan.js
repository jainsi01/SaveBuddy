const mongoose = require('mongoose');

/**
 * Milestone Subdocument Schema (docs/database_design.md Section 3.5)
 */
const milestoneSubSchema = new mongoose.Schema(
  {
    milestoneName: {
      type: String,
      required: [true, 'Milestone name is required'],
      trim: true,
    },
    targetDate: {
      type: Date,
      required: [true, 'Milestone target date is required'],
    },
    targetAmount: {
      type: Number,
      required: [true, 'Milestone target amount is required'],
      min: [0, 'Target amount cannot be negative'],
    },
    actionTip: {
      type: String,
      required: [true, 'Action tip is required'],
      trim: true,
    },
  },
  { _id: false }
);

/**
 * AIPlan Schema (FR-06, Section 3.5 database_design.md)
 * Stores AI-generated weekly/monthly savings pacing, milestone projections,
 * and practical recommendations for a savings goal.
 */
const aiPlanSchema = new mongoose.Schema(
  {
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SavingsGoal',
      required: [true, 'Goal ID is required'],
      unique: true,
      index: true,
    },
    recommendedWeekly: {
      type: Number,
      required: [true, 'Recommended weekly contribution is required'],
      min: [0, 'Recommended weekly contribution cannot be negative'],
    },
    recommendedMonthly: {
      type: Number,
      required: [true, 'Recommended monthly contribution is required'],
      min: [0, 'Recommended monthly contribution cannot be negative'],
    },
    achievabilityScore: {
      type: String,
      enum: ['Very Realistic', 'Realistic', 'Challenging', 'Very Challenging'],
      default: 'Realistic',
    },
    milestones: {
      type: [milestoneSubSchema],
      default: [],
    },
    practicalRecommendations: [
      {
        type: String,
        trim: true,
      },
    ],
    disclaimer: {
      type: String,
      default:
        'SaveBuddy AI plans are automated mathematical estimates for informational guidance only and do not constitute certified financial or investment advice.',
    },
    modelUsed: {
      type: String,
      default: 'gemini-1.5-flash',
    },
  },
  {
    timestamps: { createdAt: 'generatedAt', updatedAt: true },
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const AIPlan = mongoose.model('AIPlan', aiPlanSchema);

module.exports = AIPlan;
