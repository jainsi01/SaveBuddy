# SaveBuddy — Master Edge Cases & Failure Mode Directory

> **Project ID:** FIN-10  
> **Application:** SaveBuddy (Savings Goal Tracker)  
> **Scope:** Comprehensive Edge Cases, Vulnerabilities, Boundary Conditions & Mitigations  
> **Reference:** Software Requirements Specification (SRS) v1.0 & `implementation_plan.md`  

---

## Edge Case Directory by Module

Detailed edge cases, potential failures, and mitigations are documented in dedicated per-module files:

| Module | Focus Area | Detailed Edge Case Document |
| :--- | :--- | :--- |
| **Module 1** | Project Setup, Environment & Foundation | [docs/edge_cases/module_1_setup.md](file:///c:/Users/JAINSI%20SINHA/OneDrive/Desktop/SaveBuddy/docs/edge_cases/module_1_setup.md) |
| **Module 2** | Authentication & User Management (FR-01) | [docs/edge_cases/module_2_auth.md](file:///c:/Users/JAINSI%20SINHA/OneDrive/Desktop/SaveBuddy/docs/edge_cases/module_2_auth.md) |
| **Module 3** | Core Savings Goals Management (FR-02, FR-03, FR-05) | [docs/edge_cases/module_3_goals.md](file:///c:/Users/JAINSI%20SINHA/OneDrive/Desktop/SaveBuddy/docs/edge_cases/module_3_goals.md) |
| **Module 4** | Contributions Tracking & Ledger (FR-04) | [docs/edge_cases/module_4_contributions.md](file:///c:/Users/JAINSI%20SINHA/OneDrive/Desktop/SaveBuddy/docs/edge_cases/module_4_contributions.md) |
| **Module 5** | Google Gemini AI Savings Advisor (FR-06) | [docs/edge_cases/module_5_ai_advisor.md](file:///c:/Users/JAINSI%20SINHA/OneDrive/Desktop/SaveBuddy/docs/edge_cases/module_5_ai_advisor.md) |
| **Module 6** | Collaborative Group Goals (FR-07) | [docs/edge_cases/module_6_group_goals.md](file:///c:/Users/JAINSI%20SINHA/OneDrive/Desktop/SaveBuddy/docs/edge_cases/module_6_group_goals.md) |
| **Module 7** | Dashboard Summaries & Notifications (FR-08, FR-09) | [docs/edge_cases/module_7_dashboard_notifications.md](file:///c:/Users/JAINSI%20SINHA/OneDrive/Desktop/SaveBuddy/docs/edge_cases/module_7_dashboard_notifications.md) |
| **Module 8** | Testing, Security Audits & Deployment (QA) | [docs/edge_cases/module_8_testing_security.md](file:///c:/Users/JAINSI%20SINHA/OneDrive/Desktop/SaveBuddy/docs/edge_cases/module_8_testing_security.md) |

---

## High-Risk Edge Case Matrix

| ID | Module | Risk Level | Description | Core Mitigation |
| :--- | :--- | :---: | :--- | :--- |
| **EC-2.2** | Auth | **HIGH** | Concurrent registration race condition creating duplicate accounts | Unique index on `email` in MongoDB + HTTP 409 handling for error `11000`. |
| **EC-2.6** | Auth | **HIGH** | Expired/stale JWT tokens during active sessions | Axios 401 response interceptor clearing session + redirection to login. |
| **EC-3.1** | Goals | **CRITICAL** | Zero or negative target amounts causing division by zero | Strict validator (`targetAmount > 0`) + progress clamp $\min(100, \text{ratio})$. |
| **EC-3.7** | Goals | **CRITICAL** | Insecure Direct Object Reference (IDOR) on goal modification | Resource ownership and group membership authorization checks. |
| **EC-4.3** | Contributions | **CRITICAL** | Concurrent contributions race condition losing money records | Atomic MongoDB `$inc` operator and multi-document session transactions. |
| **EC-4.5** | Contributions | **MEDIUM** | Over-contribution exceeding target amount | Automatically transition status to `completed`; clamp visual bar to 100% with surplus notice. |
| **EC-5.1** | AI Advisor | **HIGH** | Gemini API rate limits (HTTP 429) or quota exhaustion | Plan caching in MongoDB + fallback mathematical calculation algorithm. |
| **EC-5.3** | AI Advisor | **HIGH** | LLM markdown fences or non-JSON output crashing `JSON.parse` | Gemini structured JSON schema + regex fence stripper + Zod validation. |
| **EC-6.1** | Group Goals | **HIGH** | Duplicate member invitation to same group | Compound unique index on `(goalId, userId)` in `GroupMember` collection. |
| **EC-6.4** | Group Goals | **CRITICAL** | Group member attempting administrative owner actions | Role verification middleware (`role === 'owner'`). |
| **EC-7.3** | Dashboard | **MEDIUM** | Duplicate deadline warning notifications spamming user | Time-window existence check (limit 1 alert per goal per 24h). |
| **EC-8.1** | Security | **CRITICAL** | NoSQL Injection via query operators (e.g., `{"$gt": ""}`) | `mongo-sanitize` middleware + explicit type enforcement in validators. |

---

## Standard Error Response Schema

All edge cases and error responses throughout the application adhere to this unified JSON envelope:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_IDENTIFIER",
    "message": "User-friendly description of what occurred.",
    "field": "optional_field_name_for_validation_errors",
    "timestamp": "2026-10-04T12:10:00.000Z"
  }
}
```
