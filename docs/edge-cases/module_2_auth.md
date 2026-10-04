# Module 2 Edge Cases: Authentication & User Management

> **Module:** Module 2 — Authentication & User Management  
> **SRS Requirements:** FR-01, Section 6.1, Section 6.2, Section 9.2, Section 13  
> **Related Components:** User Model, Auth Controller, JWT Middleware, Login & Register Pages  

---

## 1. Registration Edge Cases

### EC-2.1: Email Normalization & Whitespace
- **Scenario:** A user registers with `John.Doe@Example.com ` (mixed casing, trailing space), and later attempts to log in with `john.doe@example.com`.
- **Potential Failure:** Login fails due to exact string comparison mismatch; or duplicate accounts created for the same user.
- **Mitigation / Expected Handling:**
  - Sanitize email input before processing: `.trim().toLowerCase()`.
  - Schema configuration: `email: { type: String, required: true, unique: true, lowercase: true, trim: true }`.

### EC-2.2: Concurrent Registration Race Condition
- **Scenario:** A user double-clicks the "Sign Up" button, or an automated script submits two registration requests for the same email within 5 milliseconds.
- **Potential Failure:** Both requests pass the `findOne({ email })` check before either write finishes, creating a duplicate record or throwing an unhandled database duplicate key error (`E11000`).
- **Mitigation / Expected Handling:**
  - Rely on MongoDB unique index constraint on `email`.
  - In the global error middleware, trap MongoDB error code `11000` and map it cleanly to HTTP `409 Conflict`:
    ```json
    { "success": false, "error": { "code": "EMAIL_ALREADY_EXISTS", "message": "An account with this email address already exists." } }
    ```

### EC-2.3: Password Boundary Conditions & Bcrypt Limitations
- **Scenario 1:** Password is less than 6 characters or consists solely of whitespace.
- **Scenario 2:** Password exceeds 72 bytes (Bcrypt algorithm silently truncates input strings longer than 72 bytes).
- **Scenario 3:** Password contains multi-byte UTF-8 emojis or non-ASCII characters.
- **Mitigation / Expected Handling:**
  - Backend validation schema:
    - Minimum length: 6 characters.
    - Maximum length: 72 characters.
    - Require non-whitespace characters.
  - Return HTTP `400 Bad Request` with actionable validation messages.

---

## 2. Login & Credential Verification Edge Cases

### EC-2.4: Timing Attacks on Authentication
- **Scenario:** An attacker probes the login API and measures response times to determine whether an email exists (if non-existent email returns in 5ms, but existent email takes 80ms due to bcrypt hashing).
- **Mitigation / Expected Handling:**
  - Always run `bcrypt.compare` against a dummy hash even if the user is not found, ensuring uniform response times:
    ```javascript
    const dummyHash = '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqr';
    const isValid = user ? await user.comparePassword(password) : await bcrypt.compare(password, dummyHash);
    ```
  - Return a generic error message for both non-existent users and invalid passwords: `"Invalid email or password."`.

### EC-2.5: Brute-Force Password Guessing
- **Scenario:** Bot sends hundreds of login attempts against a single user account or common passwords.
- **Potential Failure:** Server CPU exhaustion from bcrypt calculations; account compromised via dictionary attack.
- **Mitigation / Expected Handling:**
  - Implement rate limiting with `express-rate-limit` specifically on `/api/auth/login` (e.g., max 5 failed attempts per IP / email per 15-minute window).
  - Return HTTP `429 Too Many Requests`.

---

## 3. Token & Session Lifecycle Edge Cases

### EC-2.6: Expired or Malformed JWT Token
- **Scenario:** Client sends an expired token (`TokenExpiredError`), a truncated token, or a token signed with an old/incorrect secret.
- **Potential Failure:** Server crashes with uncaught JWT exception, or client is stuck in an infinite redirect loop.
- **Mitigation / Expected Handling:**
  - Catch `jwt.TokenExpiredError` $\rightarrow$ Return HTTP `401 Unauthorized` with `{ code: "TOKEN_EXPIRED" }`.
  - Catch `jwt.JsonWebTokenError` $\rightarrow$ Return HTTP `401 Unauthorized` with `{ code: "INVALID_TOKEN" }`.
  - Frontend Axios interceptor detects `TOKEN_EXPIRED`, clears `localStorage`, resets AuthContext state, and smoothly navigates user to `/login` with a friendly session-expired prompt.

### EC-2.7: Deleted User with Active Token (Stale Token)
- **Scenario:** User account is deleted or disabled, but the user still holds a valid, non-expired JWT.
- **Potential Failure:** User continues to make authenticated requests.
- **Mitigation / Expected Handling:**
  - In `authMiddleware.js`, after verifying the token signature, query the database to verify the user still exists:
    ```javascript
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) return res.status(401).json({ error: "User belonging to this token no longer exists." });
    ```

### EC-2.8: Token Storage Vulnerability (XSS vs. CSRF)
- **Scenario:** If stored in insecure `localStorage`, JWT is vulnerable to XSS. If stored in naive cookies, vulnerable to CSRF.
- **Mitigation / Expected Handling:**
  - For standard Bearer token header architecture: Sanitize all user inputs on both frontend and backend to eliminate XSS vectors.
  - Set `Authorization: Bearer <token>` in Axios default headers.
