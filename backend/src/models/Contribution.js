const mongoose = require('mongoose');

/**
 * Contribution Model Schema
 * Chronological transaction ledger of money added to a savings goal.
 */
const contributionSchema = new mongoose.Schema(
  {
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SavingsGoal',
      required: [true, 'Goal ID is required.'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Contributor user ID is required.'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Contribution amount is required.'],
      min: [0.01, 'Contribution must be greater than zero.'],
      max: [1000000000, 'Contribution amount cannot exceed 1,000,000,000.'],
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [200, 'Contribution note cannot exceed 200 characters.'],
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound Indexes for fast chronological lookup by goal or contributor (database-design.md)
contributionSchema.index({ goalId: 1, date: -1 });
contributionSchema.index({ userId: 1, date: -1 });

const Contribution = mongoose.model('Contribution', contributionSchema);

module.exports = Contribution;
