# Module 6 Edge Cases: Collaborative Group Goals

> **Module:** Module 6 — Collaborative Group Goals  
> **SRS Requirements:** FR-07, Section 6.1, Section 6.2, Section 12, Section 13  
> **Related Components:** GroupMember Model, Group Goal Controller, GroupAuthMiddleware, MemberContributionChart  

---

## 1. Membership & Role Edge Cases

### EC-6.1: Duplicate Member Invitation
- **Scenario:** The group owner attempts to invite a user who is already an active member of the group.
- **Potential Failure:** Duplicate rows in `GroupMember`, leading to skewed member counts and redundant records.
- **Mitigation / Expected Handling:**
  - Create a compound unique index on `{ goalId: 1, userId: 1 }` in `GroupMember` schema.
  - Check membership prior to adding:
    ```javascript
    const existing = await GroupMember.findOne({ goalId, userId: targetUser._id });
    if (existing) return res.status(409).json({ error: "User is already a member of this group goal." });
    ```

### EC-6.2: Inviting Non-Existent or Unregistered Users
- **Scenario:** Owner enters an email address that does not exist in SaveBuddy's `User` collection.
- **Mitigation / Expected Handling:**
  - SRS specifies: *"Group members have accounts within the application."*
  - Look up user by email:
    ```javascript
    const targetUser = await User.findOne({ email: cleanEmail });
    if (!targetUser) {
      return res.status(404).json({ error: "No registered user found with this email address. Please invite them to sign up first." });
    }
    ```

### EC-6.3: Group Creator Inviting Themselves
- **Scenario:** The creator of the group goal enters their own email into the "Add Member" form.
- **Mitigation / Expected Handling:**
  - Validate:
    ```javascript
    if (targetUser._id.toString() === req.user.id) {
      return res.status(400).json({ error: "You are already the owner of this group goal." });
    }
    ```

---

## 2. Authorization & Privilege Escalation Edge Cases

### EC-6.4: Member Attempting Administrative Actions (Owner vs. Member)
- **Scenario:** A regular group member sends a `PUT /api/goals/:id` request to modify the group goal title or target, or sends `POST /api/group-goals/:id/members` to invite another friend.
- **Potential Failure:** Unauthorized alteration of group goals or member rosters.
- **Mitigation / Expected Handling:**
  - Use dedicated `groupAuthMiddleware`:
    ```javascript
    const membership = await GroupMember.findOne({ goalId: req.params.id, userId: req.user.id });
    if (!membership) return res.status(403).json({ error: "Access denied: Not a member of this group." });
    if (requireOwner && membership.role !== 'owner') {
      return res.status(403).json({ error: "Forbidden: Only the group owner can perform this action." });
    }
    ```

### EC-6.5: Owner Leaving or Deleting Group with Active Member Contributions
- **Scenario 1:** The group owner decides to leave the group or delete their account while other members have contributed funds.
- **Scenario 2:** Owner deletes the group goal without consulting other contributors.
- **Potential Failure:** Orphaned group records or lost historical ledger records for contributing members.
- **Mitigation / Expected Handling:**
  - An owner cannot leave a group goal without either:
    1. Transferring ownership to another active member (`role: 'owner'`).
    2. Archiving the goal (retaining read-only history for all members).
  - Soft-delete pattern: Set `status = 'archived'` rather than hard-deleting the goal document.

---

## 3. Financial Ledger & Progress Aggregation Edge Cases

### EC-6.6: Member-Wise Breakdown Discrepancy vs. Goal Current Amount
- **Scenario:** The sum of individual member contributions does not equal `SavingsGoal.currentAmount` (e.g., due to an untracked update or deleted contribution).
- **Mitigation / Expected Handling:**
  - The breakdown endpoint calculates totals dynamically using a MongoDB Aggregation Pipeline:
    ```javascript
    const breakdown = await Contribution.aggregate([
      { $match: { goalId: new mongoose.Types.ObjectId(goalId) } },
      { $group: { _id: "$userId", totalContributed: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $project: { userId: "$_id", name: "$user.name", email: "$user.email", totalContributed: 1, count: 1 } }
    ]);
    ```
  - Reconcile `SavingsGoal.currentAmount` against sum of contributions periodically or when viewing breakdown.

### EC-6.7: Zero-Contribution Members in Breakdown
- **Scenario:** A group has 5 members, but only 2 have contributed money so far.
- **Potential Failure:** The 3 non-contributing members disappear from the leaderboard/breakdown view.
- **Mitigation / Expected Handling:**
  - Perform an outer join (or merge members list with aggregate contributions) so non-contributing members are still visible with:
    `{ "name": "Alex", "totalContributed": 0, "percentageShare": 0 }`.
