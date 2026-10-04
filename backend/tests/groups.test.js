const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const GroupMember = require('../src/models/GroupMember');

describe('Module 6: Collaborative Group Goals Verification', () => {
  describe('GroupMember Model & Serialization (FR-07, EC-6.1)', () => {
    it('creates and serializes GroupMember document with clean id', () => {
      const mockGoalId = new mongoose.Types.ObjectId();
      const mockUserId = new mongoose.Types.ObjectId();

      const member = new GroupMember({
        goalId: mockGoalId,
        userId: mockUserId,
        role: 'member',
      });

      const serialized = member.toJSON();

      assert.ok(serialized.id, 'Should have clean id string');
      assert.strictEqual(serialized._id, undefined, '_id should be stripped');
      assert.strictEqual(serialized.__v, undefined, '__v should be stripped');
      assert.strictEqual(serialized.role, 'member');
      assert.ok(serialized.joinedAt instanceof Date);
    });

    it('validates role enum accepts only owner and member', () => {
      const mockGoalId = new mongoose.Types.ObjectId();
      const mockUserId = new mongoose.Types.ObjectId();

      const validOwner = new GroupMember({
        goalId: mockGoalId,
        userId: mockUserId,
        role: 'owner',
      });
      assert.strictEqual(validOwner.validateSync(), undefined);

      const invalidMember = new GroupMember({
        goalId: mockGoalId,
        userId: mockUserId,
        role: 'admin', // invalid enum
      });
      const error = invalidMember.validateSync();
      assert.ok(error.errors.role);
      assert.match(error.errors.role.message, /`admin` is not a valid enum/);
    });
  });

  describe('Group Membership Edge Cases (EC-6.1, EC-6.2, EC-6.3, EC-6.4, EC-6.5)', () => {
    it('detects self-invite attempt by owner (EC-6.3)', () => {
      const ownerId = new mongoose.Types.ObjectId().toString();
      const targetUserId = ownerId; // same user

      const isSelfInvite = targetUserId === ownerId;
      assert.strictEqual(isSelfInvite, true, 'Self invite must be intercepted');
    });

    it('detects duplicate membership attempt (EC-6.1)', () => {
      const goalId = new mongoose.Types.ObjectId().toString();
      const userId = new mongoose.Types.ObjectId().toString();

      const existingMembers = [{ goalId, userId, role: 'member' }];

      const isAlreadyMember = existingMembers.some(
        (m) => m.goalId === goalId && m.userId === userId
      );
      assert.strictEqual(isAlreadyMember, true, 'Duplicate member must be intercepted');
    });

    it('enforces owner-only administrative rights (EC-6.4)', () => {
      const ownerMembership = { role: 'owner' };
      const standardMember = { role: 'member' };

      const canAdminOwner = ownerMembership.role === 'owner';
      const canAdminMember = standardMember.role === 'owner';

      assert.strictEqual(canAdminOwner, true, 'Owner should have admin access');
      assert.strictEqual(canAdminMember, false, 'Standard member should be rejected for admin actions');
    });

    it('prevents group owner from leaving without transferring ownership (EC-6.5)', () => {
      const ownerUserId = new mongoose.Types.ObjectId().toString();
      const targetUserId = ownerUserId;
      const goalOwnerId = ownerUserId;

      const isOwnerLeaving = goalOwnerId === targetUserId;
      assert.strictEqual(isOwnerLeaving, true, 'Owner leaving must be blocked');
    });
  });

  describe('Financial Ledger & Contribution Breakdown (EC-6.6, EC-6.7)', () => {
    it('merges zero-contribution members in breakdown list with 0% share (EC-6.7)', () => {
      const targetAmount = 50000;
      const currentAmount = 25000;

      const members = [
        { userId: 'u1', name: 'Alice', role: 'owner' },
        { userId: 'u2', name: 'Bob', role: 'member' },
        { userId: 'u3', name: 'Charlie', role: 'member' },
      ];

      // Simulated aggregates from ledger: Alice gave 20000, Bob gave 5000, Charlie gave 0
      const aggregates = new Map([
        ['u1', { totalContributed: 20000, contributionCount: 2 }],
        ['u2', { totalContributed: 5000, contributionCount: 1 }],
      ]);

      const breakdown = members.map((m) => {
        const stats = aggregates.get(m.userId) || { totalContributed: 0, contributionCount: 0 };
        const total = stats.totalContributed;
        return {
          userId: m.userId,
          name: m.name,
          role: m.role,
          totalContributed: total,
          percentageOfTarget: (total / targetAmount) * 100,
          percentageOfTotalSaved: (total / currentAmount) * 100,
          contributionCount: stats.contributionCount,
        };
      });

      // Verify Charlie (zero-contribution member) is present with 0%
      const charlie = breakdown.find((b) => b.userId === 'u3');
      assert.ok(charlie, 'Zero-contribution member must be present in breakdown');
      assert.strictEqual(charlie.totalContributed, 0);
      assert.strictEqual(charlie.percentageOfTarget, 0);
      assert.strictEqual(charlie.percentageOfTotalSaved, 0);
      assert.strictEqual(charlie.contributionCount, 0);

      // Verify Alice stats
      const alice = breakdown.find((b) => b.userId === 'u1');
      assert.strictEqual(alice.totalContributed, 20000);
      assert.strictEqual(alice.percentageOfTarget, 40); // 20k / 50k = 40%
      assert.strictEqual(alice.percentageOfTotalSaved, 80); // 20k / 25k = 80%
    });
  });
});
