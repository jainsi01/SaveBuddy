# Module 7 Edge Cases: Dashboard Summaries, Alerts & Notifications

> **Module:** Module 7 — Dashboard Summaries, Alerts & Notifications  
> **SRS Requirements:** FR-08, FR-09, Section 6.1, Section 8, Section 13  
> **Related Components:** Dashboard Controller, Notification Model, StatCards, UrgentGoalsList, NotificationBell  

---

## 1. Dashboard State & Aggregation Edge Cases

### EC-7.1: Brand-New User Empty States (Zero Goals, Zero Contributions)
- **Scenario:** A user logs in for the very first time. They have 0 goals, 0 contributions, and 0 notifications.
- **Potential Failure:** Dashboard crashes due to `Cannot read properties of undefined (reading 'length')` or division by zero in average savings calculations.
- **Mitigation / Expected Handling:**
  - Backend returns default zeroed metrics:
    ```json
    { "totalSaved": 0, "activeGoalsCount": 0, "completedGoalsCount": 0, "urgentGoals": [] }
    ```
  - Frontend renders welcoming, instructional empty state cards with a primary Call To Action: *"Create your first savings goal to get started!"*.

### EC-7.2: Power User with Hundreds of Goals
- **Scenario:** A user has created 150+ goals over 2 years.
- **Potential Failure:** Loading all goals at once causes massive database payloads, slow JSON parsing, and sluggish DOM rendering.
- **Mitigation / Expected Handling:**
  - Implement server-side pagination and limit defaults: `GET /api/goals?page=1&limit=20`.
  - Dashboard overview only queries the top 5 most urgent active goals and aggregates total sums via MongoDB `$facet` aggregation pipelines.

---

## 2. Notification Dispatch & Alert Edge Cases

### EC-7.3: Deadline Notification Spamming (Duplicate Alerts)
- **Scenario:** A goal's deadline is 5 days away. A daily cron job runs every hour or day, sending 10 duplicate "Deadline is approaching!" notifications to the user for the same goal.
- **Potential Failure:** User is overwhelmed with spam; database floods with identical notification documents.
- **Mitigation / Expected Handling:**
  - Check for existing notifications before creating a new one:
    ```javascript
    const existingAlert = await Notification.findOne({
      userId,
      goalId,
      type: 'deadline_warning',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // within last 24 hours
    });
    if (!existingAlert) {
      await Notification.create({ userId, goalId, type: 'deadline_warning', message: `...` });
    }
    ```

### EC-7.4: Notification Idempotency (Marking as Read)
- **Scenario:** User clicks "Mark All as Read" or clicks a notification repeatedly in a rapid sequence.
- **Potential Failure:** Race condition updating the same notification, or unnecessary database writes.
- **Mitigation / Expected Handling:**
  - Implement idempotent update endpoint:
    `PUT /api/notifications/read-all` $\rightarrow$ `Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true } })`.
  - Return `{ updatedCount: n }`.

### EC-7.5: Goal Completed Notification Triggered Multiple Times
- **Scenario:** A goal reaches 100% completion. Later, a user adds another small contribution (EC-4.5 surplus savings).
- **Potential Failure:** System fires a second "Goal Completed!" celebration notification.
- **Mitigation / Expected Handling:**
  - Only trigger completion notifications if the goal status was previously `'active'` and transitions to `'completed'`:
    ```javascript
    if (wasActive && newStatus === 'completed') {
      await triggerCompletionNotification(goal);
    }
    ```
