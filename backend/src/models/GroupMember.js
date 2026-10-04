const mongoose = require('mongoose');

/**
 * GroupMember Schema (docs/database_design.md Section 3.4)
 * Links users to collaborative group savings goals with role-based permissions.
 */
const groupMemberSchema = new mongoose.Schema(
  {
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SavingsGoal',
      required: [true, 'Goal ID is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    role: {
      type: String,
      enum: ['owner', 'member'],
      default: 'member',
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
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

// CRITICAL (EC-6.1): Prevent duplicate member entries in the same group goal
groupMemberSchema.index({ goalId: 1, userId: 1 }, { unique: true });

const GroupMember = mongoose.model('GroupMember', groupMemberSchema);

module.exports = GroupMember;
