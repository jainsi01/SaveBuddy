# SaveBuddy — Engineering Coding Guidelines & Standards

> **Project ID:** FIN-10  
> **Application:** SaveBuddy (Savings Goal Tracker)  
> **Technology Stack:** MERN Stack (Node.js, Express.js, React, MongoDB) + Google Gemini AI  
> **Target Audience:** Core Developers, Contributors, AI Coding Agents, and Code Reviewers  
> **Version Baseline:** 1.0 (October 2026)  

---

## 1. Core Engineering Principles

All code written for SaveBuddy must strictly uphold four foundational principles:

1. **Defensive Financial Integrity:**
   - Monetary amounts must never drift, overflow, or accept negative values.
   - All balance updates (`currentAmount`) must be executed **atomically** via MongoDB `$inc` or within multi-document transactions.
   - Percentages must be clamped safely ($\min(100, \text{progress})$) to prevent UI distortion.

2. **Strict Separation of Concerns (Layered Architecture):**
   - **Routes:** Route matching, URL parameters, middleware binding only.
   - **Controllers:** Request validation result handling, HTTP status code orchestration, response serialization.
   - **Services:** Business logic, mathematical calculations, Gemini AI orchestration, and database operations.
   - **Models:** Schema validation invariants, indexes, hooks, and virtual properties.

3. **Zero Leaked Secrets & Server-Side AI Guarding:**
   - `GEMINI_API_KEY`, `JWT_SECRET`, and `MONGO_URI` must **never** be exposed in client code, committed to Git, or returned in API responses.
   - All Gemini AI prompts are constructed and executed server-side.

4. **Warm Aesthetic Discipline:**
   - Frontend components must adhere to the **Coffee & Cream** design system tokens defined in `ui_ux_plan.md`.
   - Never use ad-hoc inline hex colors or harsh default bright blues. Use Tailwind design tokens (`bg-coffee-900`, `text-coffee-500`, `bg-sage-100`).

---

## 2. Directory Layout & File Naming Conventions

### 2.1 File & Directory Conventions
- **Directories:** Lowercase with hyphens or camelCase (`controllers/`, `group-goals/`, `middleware/`).
- **Backend Files:**
  - Controllers: `*Controller.js` (e.g., `goalController.js`, `authController.js`).
  - Routes: `*Routes.js` (e.g., `goalRoutes.js`, `authRoutes.js`).
  - Services: `*Service.js` (e.g., `geminiService.js`, `calculationService.js`).
  - Models: **PascalCase singular** (e.g., `User.js`, `SavingsGoal.js`, `Contribution.js`, `GroupMember.js`).
  - Middleware: `camelCase.js` (e.g., `authMiddleware.js`, `errorHandler.js`).
- **Frontend Files:**
  - React Components: **PascalCase** (e.g., `GoalCard.jsx`, `ProgressBar.jsx`, `DashboardPage.jsx`).
  - Custom Hooks: `use*` in camelCase (e.g., `useAuth.js`, `useGoals.js`).
  - Utilities & Helpers: `camelCase.js` (e.g., `currencyFormatter.js`, `dateUtils.js`).

---

## 3. Backend Coding Standards (Node.js, Express, MongoDB)

### 3.1 Async/Await & Centralized Error Handling
- **Never** leave an async route unhandled or wrap every route in identical verbose `try/catch` boilerplate.
- Use an `asyncHandler` utility wrapper to route errors directly to the global error middleware:

```javascript
// src/utils/asyncHandler.js
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
```

- Throw dedicated custom `AppError` instances with clear HTTP status codes:

```javascript
// Good Practice in Service / Controller:
if (!goal) {
  throw new AppError('Goal not found with the specified ID', 404, 'GOAL_NOT_FOUND');
}
```

### 3.2 Standardized JSON Response Formats
Every endpoint must return a uniform response envelope conforming to `api_specification.md`:

```javascript
// Success Response Helper
res.status(200).json({
  success: true,
  data: resultData,
  meta: { timestamp: new Date().toISOString() }
});

// Error Response (Handled automatically by global errorHandler.js)
res.status(err.statusCode || 500).json({
  success: false,
  error: {
    code: err.errorCode || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected error occurred.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  }
});
```

### 3.3 Mongoose Model & Query Guidelines
- **Always** select only necessary fields and use `.lean()` for read-only queries to bypass Mongoose document hydration overhead:
  ```javascript
  // Read-only dashboard query: Fast & memory efficient
  const goals = await SavingsGoal.find({ ownerId, status: 'active' })
    .select('title targetAmount currentAmount deadline category')
    .lean();
  ```
- **Compound Indexes:** Always match query access patterns:
  ```javascript
  savingsGoalSchema.index({ ownerId: 1, status: 1 });
  contributionSchema.index({ goalId: 1, date: -1 });
  ```
- **Monetary Atomicity:** Use `$inc` to update balances to prevent concurrency race conditions:
  ```javascript
  // Atomic update
  const updatedGoal = await SavingsGoal.findByIdAndUpdate(
    goalId,
    { $inc: { currentAmount: cleanAmount } },
    { new: true, runValidators: true }
  );
  ```

### 3.4 Multi-Document ACID Transactions
When logging a contribution and updating a goal balance, execute within a session transaction:

```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  const [contribution] = await Contribution.create([payload], { session });
  await SavingsGoal.findByIdAndUpdate(goalId, { $inc: { currentAmount: payload.amount } }, { session });
  await session.commitTransaction();
  return contribution;
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

---

## 4. Frontend Coding Standards (React, Vite, Tailwind CSS)

### 4.1 Component Architecture & Clean Structure
- Each component should reside in its own file and remain under 250 lines of code. If a component exceeds 250 lines, split sub-sections into child components.
- Standard component file layout order:
  1. Imports (External libraries $\rightarrow$ Internal components $\rightarrow$ Context/Hooks $\rightarrow$ Utilities/Icons).
  2. Component Declaration.
  3. Custom hooks & local state declarations.
  4. Derived state and memoized calculations (`useMemo`, `useCallback`).
  5. Effect hooks (`useEffect`).
  6. Event handler functions.
  7. JSX Return.

```jsx
// Example: src/components/goals/GoalCard.jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Calendar, Shield, Plane, Laptop } from 'lucide-react';
import ProgressBar from './ProgressBar';
import { formatCurrency, calculateDaysRemaining } from '../../utils/formatters';

export default function GoalCard({ goal, onSelect }) {
  const daysLeft = useMemo(() => calculateDaysRemaining(goal.deadline), [goal.deadline]);
  const progressPercent = useMemo(
    () => Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)),
    [goal.currentAmount, goal.targetAmount]
  );

  return (
    <div 
      onClick={() => onSelect(goal._id)}
      className="bg-white rounded-3xl p-6 border border-coffee-200/60 shadow-warm-sm hover:shadow-warm-md hover:border-coffee-400 transition cursor-pointer"
    >
      <div className="flex justify-between items-start">
        <h4 className="font-semibold text-base text-coffee-950">{goal.title}</h4>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sage-100 text-sage-700">
          {progressPercent}%
        </span>
      </div>
      
      <div className="mt-4">
        <ProgressBar percentage={progressPercent} />
        <div className="flex justify-between text-xs text-coffee-600 mt-2">
          <span>{formatCurrency(goal.currentAmount)}</span>
          <span className="font-medium text-coffee-900">Target: {formatCurrency(goal.targetAmount)}</span>
        </div>
      </div>
    </div>
  );
}

GoalCard.propTypes = {
  goal: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    currentAmount: PropTypes.number.isRequired,
    targetAmount: PropTypes.number.isRequired,
    deadline: PropTypes.string.isRequired,
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
};
```

### 4.2 Tailwind CSS Styling Rules
1. **Never hardcode hex values inline** (e.g., avoid `style={{ backgroundColor: '#241813' }}`).
2. **Use Design Tokens:**
   - Dark elements: `bg-coffee-900`, `text-coffee-950`, `border-coffee-800`.
   - Brand accents: `bg-coffee-500 hover:bg-coffee-600 text-white`.
   - Card backgrounds: `bg-white`, `border-coffee-200/70`.
   - Canvas: `bg-coffee-100` (`#F7F3EE`).
   - Positive indicators: `text-sage-700 bg-sage-100`.
3. **Class Ordering Convention:**
   `Layout/Display` $\rightarrow$ `Spacing` $\rightarrow$ `Sizing` $\rightarrow$ `Typography` $\rightarrow$ `Colors/Borders` $\rightarrow$ `Effects/Transitions`
   *(e.g., `flex items-center p-4 w-full text-sm font-semibold text-coffee-900 bg-white rounded-2xl shadow-sm transition`)*.

---

## 5. Google Gemini AI Integration Rules

1. **Isolation in Service Layer:**
   - All AI interactions must pass through `src/services/geminiService.js`.
   - Routes or controllers must **never** call the Google Gemini SDK directly.
2. **Deterministic Output with JSON Schema:**
   - Always invoke Gemini with structured JSON mode (`responseMimeType: "application/json"`).
   - Strip any markdown formatting fences (` ```json `) defensively before parsing:
     ```javascript
     const cleaned = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
     const data = JSON.parse(cleaned);
     ```
3. **Mandatory Fallback Engine:**
   - If Gemini returns a rate-limit (HTTP 429), times out (> 10s), or is unreachable, the system must trigger `calculateFallbackPlan()` to calculate standard required weekly/monthly pacing mathematically so the user experience is never blocked.
4. **Mandatory Non-Fiduciary Disclaimer:**
   - Every generated AI plan must embed the standard disclaimer text:
     *"This plan is an automated estimate for informational guidance only and does not constitute certified financial or tax advisory."*

---

## 6. Security & Defensive Programming Rules

1. **Input Sanitization & NoSQL Injection Protection:**
   - Bind `mongo-sanitize` middleware to strip any `$` or `.` characters from `req.body`, `req.query`, and `req.params`.
   - Never pass raw `req.body` directly into Mongoose write methods:
     ```javascript
     // NEVER DO THIS:
     await SavingsGoal.create(req.body);

     // ALWAYS DO THIS (Whitelisted picking):
     const { title, description, targetAmount, deadline, category } = req.body;
     await SavingsGoal.create({ ownerId: req.user.id, title, description, targetAmount, deadline, category });
     ```
2. **Access Control & Multi-Tenancy:**
   - Every controller operation must verify either:
     - `goal.ownerId.toString() === req.user.id` (Personal goal)
     - OR user is an active member in `GroupMember` for that `goalId` (Group goal).
3. **HTTP Security Headers:**
   - `helmet` must be configured in `server.js` with content security policy headers.
4. **Rate Limiting:**
   - Apply `express-rate-limit` on `/api/auth/login` (5 requests / 15 mins) and `/api/goals/:id/ai-plan` (10 requests / hour).

---

## 7. Git & Commit Guidelines

### 7.1 Conventional Commit Format
All commits must follow the Conventional Commits specification:
```text
<type>(<scope>): <short description in present tense>

[optional body explaining rationale]
```

#### Approved Commit Types:
- `feat:` A new user-facing feature (e.g., `feat(goals): add atomic contribution modal`).
- `fix:` A bug fix (e.g., `fix(auth): prevent email casing login mismatch`).
- `refactor:` Code restructuring without changing external behavior.
- `perf:` Performance optimization (e.g., adding compound index on contributions).
- `test:` Adding or updating unit/integration tests.
- `docs:` Documentation additions or updates (`context.md`, `README.md`).
- `chore:` Dependency updates, configuration tweaks.

### 7.2 Branching Strategy
- `main` / `master`: Production-ready, fully tested code.
- `develop`: Integration branch for completed modules.
- `feature/<module-name>-<short-description>`: Active development branches (e.g., `feature/module-3-goal-crud`).
- `fix/<issue-name>`: Bug fix branches.

---

## 8. Pre-Commit & Code Review Checklist

Before creating a pull request or submitting code changes, verify:

- [ ] **No Secrets Exposed:** No API keys, passwords, or tokens hardcoded.
- [ ] **Validation Present:** All API inputs validated with express-validator or Joi.
- [ ] **Defensive Financial Checks:** Target amount $> 0$, contribution amount $> 0$, deadline is in the future.
- [ ] **Atomic Updates:** Balances updated using `$inc` or session transactions.
- [ ] **Ownership Checked:** IDOR vulnerabilities mitigated with owner/member validation.
- [ ] **Theme Compliance:** Frontend classes use `coffee-*` and `sage-*` tokens; no unstyled raw elements.
- [ ] **Lint & Tests Passing:** `npm test` runs with zero failures; `npm run lint` clean.
