SOFTWARE REQUIREMENTS SPECIFICATION

Savings Goal Tracker

Project ID: FIN-10 | Domain: FinanceTechnology: MERN Stack + Gemini AIVersion: 1.0 | Date: October 2026

1. Introduction

1.1 Purpose

This Software Requirements Specification (SRS) defines the functional and non-functional requirements for the Savings Goal Tracker, a finance-focused web application that helps users create savings goals, record contributions, monitor progress, and receive an AI-generated plan for reaching each goal within a target deadline.

1.2 Product Overview

The application provides a centralized place for individuals or groups to manage savings objectives. A user can define a target amount and deadline, add contributions over time, visualize progress, and use Gemini AI to receive a practical savings plan. The system also supports group goals for shared objectives such as trips, emergency funds, or gadget purchases.

1.3 Intended Audience

Students and young professionals who want to track savings.

Individuals planning purchases or financial targets.

Friends or small groups saving jointly for a shared objective.

Project evaluators, developers, testers, and future maintainers.

1.4 Definitions and Acronyms

Term

Meaning

SRS

Software Requirements Specification

Goal

A savings objective with a target amount and deadline

Contribution

Money added toward a savings goal

Progress

Current saved amount compared with the target amount

Group Goal

A savings goal shared by multiple members

AI Plan

Gemini-generated recommendations for reaching a goal on time

MERN

MongoDB, Express.js, React, and Node.js

2. Scope

The system shall provide the following core capabilities:

Create, view, update, and manage savings goals.

Set a target amount and target deadline for each goal.

Record and review contributions.

Calculate and display savings progress.

Show progress using bars or similar visual indicators.

Generate an AI-based plan for reaching a target on time.

Create group goals and allow multiple members to contribute.

Support common use cases such as group trip funds, emergency funds, and gadget purchase funds.

2.1 Out of Scope

Direct bank-account integration or automatic money transfers in the initial version.

Actual investment, trading, lending, or payment processing.

Professional financial advice or guaranteed financial outcomes.

Tax filing or tax calculation.

Credit scoring or loan approval.

3. Overall Description

3.1 Product Perspective

Savings Goal Tracker is a web-based full-stack application. The React frontend provides the user interface, while the Node.js/Express backend exposes APIs and handles business logic. MongoDB stores application data. Gemini AI is used to generate personalized savings plans based on goal information and user-provided financial inputs.

3.2 High-Level Architecture

Layer

Technology

Responsibility

Frontend

React

User interface, forms, dashboards, progress visualization, group management

Backend

Node.js + Express.js

REST APIs, authentication, validation, business logic

Database

MongoDB

Users, goals, contributions, memberships, AI plan data

AI Service

Gemini

Generate savings plans and recommendations

Deployment

Web hosting platform

Host frontend/backend and environment configuration

3.3 User Classes

User Type

Description

Main Capabilities

Individual User

A user managing personal goals

Create goals, add contributions, view progress, generate AI plans

Group Member

A user participating in a shared goal

View group goal, contribute, view shared progress

Group Goal Owner

User who creates a group goal

Create/manage group goal and members

3.4 Assumptions

Users have internet access and a supported modern web browser.

Users enter accurate target, deadline, and contribution information.

Gemini API credentials are securely configured on the server.

The initial system does not move real money; it only records savings information.

Group members have accounts within the application.

4. Functional Requirements

FR-01: User Registration and Authentication

The system shall allow a new user to create an account.

The system shall authenticate registered users before accessing protected data.

Passwords shall not be stored in plain text.

Authenticated requests shall be associated with the correct user.

A user shall only be able to access or modify data they are authorized to access.

FR-02: Create Savings Goal

The user shall be able to create a savings goal.

The goal shall contain at minimum: title/name, target amount, and deadline.

The user may provide an optional description/category.

The initial saved amount shall default to zero unless a valid starting contribution is entered.

The system shall validate that the target amount is positive and the deadline is valid.

FR-03: Manage Savings Goals

Users shall be able to view their active and completed goals.

Users shall be able to update editable goal information.

Users shall be able to delete or archive a goal according to application rules.

The system shall show remaining amount and time to deadline where applicable.

FR-04: Record Contributions

A user shall be able to add a contribution to a goal.

Each contribution shall record amount and date; an optional note may also be stored.

The system shall update the goal's current saved amount after a valid contribution.

The system shall prevent invalid contribution amounts.

Contribution history shall be visible to authorized users.

FR-05: Progress Tracking

The system shall calculate progress percentage as current saved amount divided by target amount, multiplied by 100.

The system shall display a progress bar or equivalent visualization.

The system shall display current amount, target amount, remaining amount, and deadline.

A goal shall be marked as completed when the saved amount reaches or exceeds the target.

FR-06: AI Savings Plan

The user shall be able to request an AI plan for a savings goal.

The backend shall send relevant goal information to Gemini rather than exposing the API key to the frontend.

The AI plan should consider target amount, current savings, remaining amount, deadline, and user-provided financial constraints when available.

The system should return practical recommendations such as required weekly/monthly savings.

The generated plan shall be displayed clearly in the goal interface.

The system shall handle AI API errors gracefully and inform the user when a plan cannot be generated.

AI output shall be presented as guidance and not as guaranteed financial advice.

FR-07: Group Savings Goals

A user shall be able to create a group savings goal.

The group goal shall have a target amount and deadline.

The goal owner shall be able to add or invite members.

Authorized members shall be able to record their contributions.

The system shall show total group progress.

The system should show member-wise contribution information to authorized group members.

The system shall prevent unauthorized users from modifying a group goal.

FR-08: Dashboard

The dashboard shall summarize active, completed, and group goals.

The dashboard shall show useful progress information at a glance.

The dashboard shall provide navigation to goal details and contribution history.

The dashboard should highlight goals that are close to their deadline or require increased savings.

FR-09: Notifications and Alerts

The system may provide reminders for approaching deadlines.

The system may alert users when a goal is completed.

The system may notify group members about important goal updates.

Notifications shall only be sent to authorized users.

5. Use Cases

Use Case

Actor

Precondition

Expected Result

Create Goal

User

User is authenticated

New savings goal is stored and shown on dashboard

Add Contribution

User/Group Member

Authorized goal exists

Contribution is stored and progress is updated

View Progress

User/Group Member

Goal is accessible

Current progress and remaining target are displayed

Generate AI Plan

User

Goal exists and AI service is available

Personalized savings plan is displayed

Create Group Goal

User

User is authenticated

Shared goal is created with owner information

Join/Manage Group

Group Member/Owner

Valid group invitation or membership

Member can access permitted group data

Complete Goal

System/User

Saved amount reaches target

Goal status becomes completed

6. Data Requirements

6.1 Core Entities

Entity

Important Fields

User

userId, name, email, passwordHash, createdAt

SavingsGoal

goalId, ownerId, title, description, targetAmount, currentAmount, deadline, status, createdAt

Contribution

contributionId, goalId, userId, amount, date, note

GroupGoal

goalId, ownerId, title, targetAmount, deadline, status, members

AIPlan

planId, goalId, generatedAt, planContent, model

Notification

notificationId, userId, type, message, read, createdAt

6.2 Data Validation

Email addresses shall follow a valid format.

Amounts shall be numeric and greater than zero where required.

Target amount shall be greater than zero.

Deadline shall be a valid future date when creating a new goal.

Contribution records shall reference an existing goal and authorized user.

Group membership shall be unique per user and group goal.

7. API Requirements

The backend should expose RESTful APIs. Exact route naming may be adjusted during implementation.

Method

Example Endpoint

Purpose

POST

/api/auth/register

Register a user

POST

/api/auth/login

Authenticate a user

GET

/api/goals

Get user's accessible goals

POST

/api/goals

Create a savings goal

GET

/api/goals/:id

Get goal details

PUT

/api/goals/:id

Update a goal

DELETE

/api/goals/:id

Delete/archive a goal

POST

/api/goals/:id/contributions

Add a contribution

GET

/api/goals/:id/contributions

View contribution history

POST

/api/goals/:id/ai-plan

Generate Gemini savings plan

POST

/api/group-goals

Create a group goal

POST

/api/group-goals/:id/members

Add/invite group member

8. User Interface Requirements

The UI shall be responsive on desktop, tablet, and mobile screens.

The dashboard shall provide a clear overview of savings goals.

Goal cards shall display title, target, saved amount, percentage progress, and deadline.

The contribution form shall be simple and provide validation feedback.

The AI plan shall be visually separated from normal goal information.

Group goals shall clearly identify shared goals and participating members.

The application shall provide meaningful loading, success, empty, and error states.

Forms shall provide understandable validation messages.

9. Non-Functional Requirements

9.1 Performance

Normal dashboard and goal API requests should respond quickly under expected project load.

Database queries should be indexed appropriately for frequently accessed fields.

AI requests should show a loading state and avoid blocking unrelated application features.

9.2 Security

Authentication and authorization shall be enforced on protected APIs.

Passwords shall be securely hashed.

Gemini API keys and other secrets shall be stored in environment variables/server-side configuration.

Users shall not be able to access another user's private goals or contributions.

Group data shall be protected using membership/ownership checks.

Inputs shall be validated and sanitized to reduce common injection and abuse risks.

HTTPS should be used in production.

9.3 Reliability

Database failures shall be handled without crashing the entire application.

AI service failures shall return a user-friendly error.

Invalid API requests shall return appropriate HTTP status codes.

Critical operations should preserve data consistency.

9.4 Usability

The application should be understandable to users with basic financial literacy.

Common actions should require minimal steps.

Progress and remaining savings should be immediately understandable.

9.5 Maintainability

Frontend components should be modular and reusable.

Backend routes, controllers/services, models, and middleware should have clear separation of responsibilities.

Environment-specific configuration should not be hardcoded.

Code should include simple comments for important functions and business logic.

10. AI Requirements

10.1 AI Input

Goal title and description, when available.

Target amount.

Current saved amount.

Remaining amount.

Deadline and remaining time.

Optional user-provided income, preferred contribution frequency, or savings constraints.

10.2 AI Output

Recommended contribution amount per week/month.

Suggested savings milestones.

A practical timeline toward the deadline.

Optional suggestions for adjusting the target or contribution frequency if the target appears difficult.

A concise explanation of the plan.

10.3 AI Safety and Limitations

AI-generated recommendations shall be clearly identified as estimates/guidance.

The application shall not claim that an AI plan guarantees a financial result.

Sensitive financial information should be minimized and protected.

The application should handle unavailable or rate-limited AI services gracefully.

11. Example Scenarios

Scenario

Example

Group Trip Fund

Five friends create a goal to save ₹50,000 for a trip in four months and track each member's contributions.

Emergency Fund

A user creates an emergency fund target of ₹60,000 with a six-month deadline and receives a monthly savings plan.

Gadget Purchase Fund

A user wants to buy a laptop costing ₹80,000 and tracks monthly contributions until the target is reached.

12. Business Rules

A goal must have a positive target amount.

A contribution must have a positive amount.

A user's total contribution toward a goal cannot be attributed to another user.

Only authorized users can view or modify private goal information.

Only group members can contribute to or view protected group-goal information.

A goal becomes completed when current savings are equal to or greater than the target amount.

The AI plan must be generated using current goal information.

The system must not expose API secrets to the client.

13. Error Handling Requirements

Error

Expected Handling

Invalid login

Display authentication error without revealing sensitive details

Invalid goal data

Show field-level validation and reject request

Unauthorized access

Return 401/403 as appropriate

Goal not found

Return 404 and show a user-friendly message

Database failure

Log server-side and return a safe error response

Gemini failure/rate limit

Show retry-friendly message and keep existing goal data available

Duplicate group member

Reject duplicate membership with a clear message

14. Testing Requirements

Unit testing for progress calculations, validation, and important business logic.

API testing for authentication, goal CRUD, contributions, group permissions, and AI-plan endpoints.

Frontend testing for forms, dashboard states, goal progress, and error handling.

Integration testing for frontend-backend-database communication.

Security testing for authorization and access-control failures.

AI integration testing using valid, invalid, and unavailable API scenarios.

Responsive UI testing across common screen sizes.

15. Acceptance Criteria

A registered user can create a savings goal with a target and deadline.

The user can add contributions and see the updated progress immediately after successful submission.

The system correctly calculates remaining amount and progress percentage.

The user can generate and view an AI savings plan for a goal.

A group goal can be created and shared with multiple members.

Authorized members can contribute to a group goal and see shared progress.

Unauthorized users cannot access protected goals or contributions.

The application handles invalid input, database errors, and AI service failures gracefully.

The application is responsive and usable on desktop and mobile browsers.

16. Future Enhancements

Bank account or UPI integration for automated contribution tracking.

Recurring contribution reminders.

Email/push notifications.

Advanced analytics and savings history charts.

Multiple currencies.

AI-powered spending analysis and adaptive savings plans.

Gamification, milestones, badges, and streaks.

Group chat or comments for shared goals.

Export savings history to CSV/PDF.

17. Technology Summary

Component

Proposed Technology

Frontend

React

Backend

Node.js + Express.js

Database

MongoDB

AI

Google Gemini API

API Style

REST

Authentication

JWT/session-based authentication as implemented

Version Control

Git + GitHub

18. Conclusion

The Savings Goal Tracker is a full-stack finance application designed to make goal-based saving easier to plan, monitor, and complete. Its core value comes from combining transparent progress tracking with Gemini-powered planning and optional group savings. The requirements defined in this document provide a baseline for design, implementation, testing, deployment, and future expansion of the system.