# Module 3 Edge Cases: Core Savings Goals Management

> **Module:** Module 3 — Core Savings Goals Management  
> **SRS Requirements:** FR-02, FR-03, FR-05, Section 6.1, Section 6.2, Section 12, Section 13  
> **Related Components:** SavingsGoal Model, Goal Controller, GoalCard, ProgressBar, GoalFormModal  

---

## 1. Goal Creation & Monetary Value Edge Cases

### EC-3.1: Zero, Negative, or Decimal Precision Anomalies
- **Scenario 1:** User enters `targetAmount = 0` or negative values like `-500`.
- **Scenario 2:** User inputs fractional currency with $> 2$ decimal places (e.g., `100.9999`).
- **Scenario 3:** Extreme values exceeding JavaScript safe integer limit ($> 9,007,199,254,740,991$) or `Number.MAX_SAFE_INTEGER`.
- **Potential Failure:** Division by zero in progress calculation, corrupt financial ledger, numeric overflow in MongoDB.
- **Mitigation / Expected Handling:**
  - Joi/Express-validator checks:
    ```javascript
    body('targetAmount')
      .isFloat({ min: 1, max: 1000000000 })
      .withMessage('Target amount must be a positive number up to 1,000,000,000.');
    ```
  - Round all monetary amounts to 2 decimal places: `Math.round(amount * 100) / 100`.
  - In progress calculations, guard against division by zero:
    ```javascript
    const progress = targetAmount > 0 ? Math.min(100, Math.round((currentAmount / targetAmount) * 100)) : 0;
    ```

### EC-3.2: Extremely Long or Malicious Goal Titles & Descriptions
- **Scenario:** User enters a 5,000-character string or HTML/JavaScript script tag in the goal title (`<script>alert(1)</script>`).
- **Potential Failure:** Stored XSS attack, broken frontend layouts, overflowing cards.
- **Mitigation / Expected Handling:**
  - Title validation: 3 to 100 characters, trimmed.
  - Description validation: Max 500 characters, trimmed.
  - Sanitize strings using DOMPurify or React's native JSX escaping.
  - CSS layout protection: `truncate`, `break-words`, and max line clamps on UI cards.

---

## 2. Deadline & Date Edge Cases

### EC-3.3: Deadline in the Past or Immediate Present
- **Scenario:** Goal creation request includes a deadline timestamp that has already elapsed (e.g., yesterday or 5 minutes ago).
- **Potential Failure:** Goal starts in overdue state with negative days remaining.
- **Mitigation / Expected Handling:**
  - Backend validation ensures:
    ```javascript
    const deadlineDate = new Date(req.body.deadline);
    if (deadlineDate <= new Date()) {
      return res.status(400).json({ error: "Goal deadline must be set to a future date." });
    }
    ```
  - Frontend datepicker sets `min={new Date().toISOString().split('T')[0]}`.

### EC-3.4: Leap Years, Month Boundaries & Timezone Shifts
- **Scenario:** A user in India (UTC+5:30) sets a deadline for "2028-02-29 23:59:59". A user in the US (UTC-8) views it.
- **Potential Failure:** The deadline shifts by a day or displays an off-by-one day discrepancy; February 29th throws date parsing errors.
- **Mitigation / Expected Handling:**
  - Store all dates in MongoDB as ISO 8601 UTC timestamps (`Date` objects).
  - Use timezone-aware utilities (e.g., `date-fns` or `dayjs`) on the frontend to format dates according to user's local browser timezone.
  - Compute `daysRemaining` using UTC day differences:
    ```javascript
    const diffTime = Math.max(0, deadline.getTime() - Date.now());
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    ```

---

## 3. Goal Modification & State Transition Edge Cases

### EC-3.5: Lowering Target Amount Below Already Saved Balance
- **Scenario:** Goal has `targetAmount = 50,000` and `currentAmount = 30,000`. User edits the goal and sets `targetAmount = 20,000`.
- **Potential Failure:** Progress exceeds 100% (150%), causing visual meter distortion, or goal remains stuck in `'active'` status.
- **Mitigation / Expected Handling:**
  - If updated `targetAmount <= currentAmount`:
    1. Allow update if intentional, but immediately transition `status = 'completed'`.
    2. Clamp visual progress bar display: `Math.min(100, (currentAmount / targetAmount) * 100)`.
    3. Display a user alert: `"Notice: Lowering target amount below current balance marks this goal as completed."`

### EC-3.6: Editing a Completed or Archived Goal
- **Scenario:** User attempts to edit or re-open a goal that has already been marked as `completed` or `archived`.
- **Mitigation / Expected Handling:**
  - Prohibit editing archived goals unless user explicitly chooses an "Unarchive / Restore" action.
  - Completed goals remain read-only for target/deadline edits, but user can still add surplus contributions or re-activate if they increase the target.

### EC-3.7: Insecure Direct Object Reference (IDOR) on Goal Operations
- **Scenario:** User A observes goal ID `65f01...` belonging to User B and issues `PUT /api/goals/65f01...` or `DELETE /api/goals/65f01...`.
- **Potential Failure:** Data breach and unauthorized modification/deletion of foreign user data.
- **Mitigation / Expected Handling:**
  - In controller:
    ```javascript
    const goal = await SavingsGoal.findById(req.params.id);
    if (!goal) return res.status(404).json({ error: "Goal not found." });
    if (goal.ownerId.toString() !== req.user.id && !isAuthorizedGroupMember(goal, req.user.id)) {
      return res.status(403).json({ error: "Forbidden: You are not authorized to modify this goal." });
    }
    ```
