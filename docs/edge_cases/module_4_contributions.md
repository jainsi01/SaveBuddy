# Module 4 Edge Cases: Contributions Tracking & Ledger

> **Module:** Module 4 — Contributions Tracking & Ledger  
> **SRS Requirements:** FR-04, FR-05, Section 6.1, Section 6.2, Section 12, Section 13  
> **Related Components:** Contribution Model, SavingsGoal Model, Contribution Controller, AddContributionModal, Ledger  

---

## 1. Amount Validation & Monetary Edge Cases

### EC-4.1: Negative, Zero, or Non-Numeric Contribution Amount
- **Scenario:** User enters `-100`, `0`, or text string `"five hundred"` in the contribution input.
- **Potential Failure:** Subtracting funds from goal balance, corrupting total calculations, or database cast exceptions.
- **Mitigation / Expected Handling:**
  - Strict input validation:
    ```javascript
    body('amount')
      .isFloat({ gt: 0, max: 1000000000 })
      .withMessage('Contribution amount must be a positive number greater than zero.');
    ```
  - Reject non-numeric input with HTTP `400 Bad Request`.

### EC-4.2: Floating Point Rounding & Precision Drift
- **Scenario:** Adding contributions with multiple decimal places (e.g., ₹10.33 + ₹20.55 + ₹5.12).
- **Potential Failure:** JavaScript binary floating-point inaccuracy (e.g., `0.1 + 0.2 = 0.30000000000000004`), resulting in bizarre values displayed on dashboard (e.g., "Saved ₹30.30000000000004").
- **Mitigation / Expected Handling:**
  - Round to 2 decimal places before saving:
    ```javascript
    const cleanAmount = Number(parseFloat(req.body.amount).toFixed(2));
    ```
  - Store amounts as rounded floats or integers in cents/paise in the database.
  - Display amounts using currency formatters: `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val)`.

---

## 2. Concurrency, Race Conditions & Atomicity

### EC-4.3: Concurrent Contributions (Simultaneous Submissions)
- **Scenario:** Two group members (or one user rapidly double-clicking the "Add Contribution" button) submit ₹1,000 at the exact same millisecond.
- **Potential Failure:** Read-modify-write race condition:
  - Both requests read `currentAmount = 5,000`.
  - Request A writes `currentAmount = 6,000`.
  - Request B writes `currentAmount = 6,000` (overwriting Request A's addition instead of 7,000).
- **Mitigation / Expected Handling:**
  - Use MongoDB's atomic `$inc` operator rather than in-memory object modification:
    ```javascript
    const updatedGoal = await SavingsGoal.findByIdAndUpdate(
      goalId,
      { $inc: { currentAmount: cleanAmount } },
      { new: true, runValidators: true }
    );
    ```
  - For critical transactions, execute within a MongoDB multi-document session transaction (`session.withTransaction(...)`).

### EC-4.4: Partial Failure Between Contribution Record & Goal Balance Update
- **Scenario:** `Contribution.create(...)` succeeds, but the database connection drops before `SavingsGoal.findByIdAndUpdate(...)` executes.
- **Potential Failure:** Contribution appears in the ledger, but the goal's `currentAmount` and progress bar do not reflect it.
- **Mitigation / Expected Handling:**
  - Wrap both operations in a MongoDB transaction:
    ```javascript
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await Contribution.create([{ goalId, userId, amount: cleanAmount, note }], { session });
      await SavingsGoal.findByIdAndUpdate(goalId, { $inc: { currentAmount: cleanAmount } }, { session });
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
    ```

---

## 3. Business Logic & Goal Lifecycle Edge Cases

### EC-4.5: Over-Contribution Beyond Target Amount
- **Scenario:** Goal target is ₹10,000, current saved is ₹9,500. User contributes ₹2,000 (total becomes ₹11,500).
- **Potential Failure:** Progress bar breaks (> 100% width causing UI blowout), or transaction is improperly rejected.
- **Mitigation / Expected Handling:**
  - SRS specifies: *"A goal shall be marked as completed when the saved amount reaches or exceeds the target."*
  - Allow the full contribution (surplus savings is valid behavior).
  - Automatically set `status = 'completed'`.
  - In UI: Clamp the visual bar width to `100%`, but display the actual metric: `"₹11,500 / ₹10,000 (115% Achieved)"`.
  - Display a celebratory banner: `"Outstanding! You have exceeded your target by ₹1,500!"`.

### EC-4.6: Contribution to an Archived or Deleted Goal
- **Scenario:** User keeps an open tab on a goal, but in another tab archives or deletes it, then submits a contribution.
- **Potential Failure:** Ghost contributions attached to an inactive or non-existent goal.
- **Mitigation / Expected Handling:**
  - Verify goal status prior to logging contribution:
    ```javascript
    if (goal.status === 'archived') {
      return res.status(400).json({ error: "Cannot add contributions to an archived goal." });
    }
    ```

### EC-4.7: Future-Dated or Ancient Historical Contribution Dates
- **Scenario:** User manually enters a contribution date in the year 2050 or the year 1900.
- **Mitigation / Expected Handling:**
  - Validate contribution date: Must not be in the future (`date <= Date.now()`) and must not precede the goal creation date by more than a reasonable threshold.
