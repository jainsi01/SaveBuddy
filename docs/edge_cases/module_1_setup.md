# Module 1 Edge Cases: Project Setup, Environment & Foundation

> **Module:** Module 1 — Project Setup, Environment & Foundation  
> **Related Components:** Express server, Mongoose connection, Environment config, Global Error Handling, API Client  

---

## 1. Environment & Configuration Edge Cases

### EC-1.1: Missing or Incomplete Environment Variables
- **Scenario:** The backend starts without essential environment variables defined in `.env` (e.g., `MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY`).
- **Potential Failure:** App crashes with unhandled runtime errors later during user requests (e.g., `jwt.sign called without secret`).
- **Mitigation / Expected Handling:**
  - Create an environment validation utility (`src/config/validateEnv.js`) that runs at server boot.
  - Check for required variables and throw an immediate, clear configuration error exiting the process: `Process terminated: Missing required environment variable: JWT_SECRET`.

### EC-1.2: MongoDB Connection Failure on Startup or Connection Drop Mid-Execution
- **Scenario:** MongoDB Atlas is unreachable (firewall, IP whitelist, network partition) or drops connection during traffic.
- **Potential Failure:** Unhandled promise rejections, hanging requests leading to server socket timeouts.
- **Mitigation / Expected Handling:**
  - Implement connection retry logic with exponential backoff in `db.js`.
  - Listen for Mongoose connection events: `mongoose.connection.on('disconnected')`, `onError`, `reconnected`.
  - Health check endpoint `GET /api/health` must return `503 Service Unavailable` if `mongoose.connection.readyState !== 1`.

---

## 2. HTTP & Network Edge Cases

### EC-1.3: Malformed JSON Request Body
- **Scenario:** Client sends syntactically invalid JSON (e.g., trailing commas, unescaped quotes) with `Content-Type: application/json`.
- **Potential Failure:** Default Express body parser throws unhandled syntax error, potentially dumping stack traces.
- **Mitigation / Expected Handling:**
  - Implement custom error-handling middleware that catches `SyntaxError` from `express.json()` and responds with HTTP `400 Bad Request`:
    ```json
    { "success": false, "error": { "code": "INVALID_JSON_BODY", "message": "Malformed JSON payload in request body." } }
    ```

### EC-1.4: Payload Size Exceeds Limits (DoS Protection)
- **Scenario:** Attacker sends massive HTTP POST request (> 10MB) to exhaust server memory.
- **Potential Failure:** Node.js memory exhaustion and Denial of Service.
- **Mitigation / Expected Handling:**
  - Limit body parser payload size: `express.json({ limit: '1mb' })` and `express.urlencoded({ limit: '1mb', extended: true })`.
  - Handle `entity.too.large` error with HTTP `413 Payload Too Large`.

### EC-1.5: CORS Origin Mismatch Between Environments
- **Scenario:** Frontend hosted on dynamic Vercel preview URL or local port `5174` (when `5173` is busy) makes requests to backend.
- **Potential Failure:** Browser blocks API calls due to CORS policy violation.
- **Mitigation / Expected Handling:**
  - Configure `cors` middleware with dynamic origin resolver or regex support in development mode:
    ```javascript
    const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174'];
    ```
  - Send explicit preflight options handling (`OPTIONS` method response with `204 No Content`).

---

## 3. Frontend Network & Client-Side Edge Cases

### EC-1.6: Network Disconnection or Server Unreachable (Offline Mode)
- **Scenario:** User's device loses Wi-Fi / cellular connectivity, or the backend service is rebooting.
- **Potential Failure:** React UI freezes, infinite loading spinners, unhandled Axios promise rejections.
- **Mitigation / Expected Handling:**
  - Axios response interceptor intercepts `error.request` without response and returns standard UI error: `"Network error: Unable to reach the server. Please check your connection."`.
  - Display offline notification banner via global toast / alert system.

### EC-1.7: Unhandled Promise Rejections & Process Crashing
- **Scenario:** Async error occurs outside Express route handler pipeline (e.g., background timer or database event).
- **Potential Failure:** Node process dies abruptly without releasing sockets.
- **Mitigation / Expected Handling:**
  - Bind global process listeners in `server.js`:
    ```javascript
    process.on('unhandledRejection', (err) => {
      console.error('Unhandled Rejection! Shutting down gracefully...', err);
      server.close(() => process.exit(1));
    });
    ```
