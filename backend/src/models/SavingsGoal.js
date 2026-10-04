const mongoose = require('mongoose');

/**
 * SavingsGoal Model Schema
 * Represents individual and collaborative savings objectives.
 */
const savingsGoalSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Goal owner ID is required.'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Goal title is required.'],
      trim: true,
      minlength: [3, 'Goal title must be at least 3 characters long.'],
      maxlength: [100, 'Goal title cannot exceed 100 characters.'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters.'],
      default: '',
    },
    category: {
      type: String,
      enum: {
        values: ['emergency', 'travel', 'gadgets', 'education', 'vehicle', 'home', 'lifestyle', 'other'],
        message: '{VALUE} is not a valid category.',
      },
      default: 'other',
    },
    targetAmount: {
      type: Number,
      required: [true, 'Target amount is required.'],
      min: [1, 'Target amount must be at least 1.'],
      max: [1000000000, 'Target amount cannot exceed 1,000,000,000.'],
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: [0, 'Current amount cannot be negative.'],
    },
    deadline: {
      type: Date,
      required: [true, 'Target deadline date is required.'],
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'archived'],
      default: 'active',
      index: true,
    },
    isGroupGoal: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Compound Indexes for fast dashboard and deadline queries (database-design.md)
savingsGoalSchema.index({ ownerId: 1, status: 1 });
savingsGoalSchema.index({ deadline: 1, status: 1 });

/**
 * Virtual: Remaining Amount to save
 */
savingsGoalSchema.virtual('remainingAmount').get(function () {
  return Math.max(0, Number((this.targetAmount - this.currentAmount).toFixed(2)));
});

/**
 * Virtual: Progress Percentage (0 - 100 clamped)
 */
savingsGoalSchema.virtual('progressPercentage').get(function () {
  if (!this.targetAmount || this.targetAmount <= 0) return 0;
  const ratio = (this.currentAmount / this.targetAmount) * 100;
  return Number(Math.min(100, Math.max(0, ratio)).toFixed(2));
});

/**
 * Virtual: Days Remaining to deadline
 */
savingsGoalSchema.virtual('daysRemaining').get(function () {
  if (!this.deadline) return 0;
  const now = new Date();
  const diffTime = this.deadline.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

const SavingsGoal = mongoose.model('SavingsGoal', savingsGoalSchema);

module.exports = SavingsGoal;
