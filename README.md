# SaveBuddy

SaveBuddy is a full-stack savings-goal tracker for planning personal and shared goals. Track progress and contributions, review your savings activity, and generate an AI-assisted plan for reaching a target.

> SaveBuddy records contributions entered by its users. It does not connect to banks, move money, or provide professional financial advice. AI-generated plans are informational estimates.

## Features

- Register and sign in with token-based authentication.
- Create and manage personal savings goals, deadlines, and contributions.
- Review balances, goal progress, and transaction history from the dashboard.
- Create collaborative group goals and track member contributions.
- Generate savings plans for goals with Google Gemini.
- Check API and database status from the health endpoint.

## Technology

- **Frontend:** React 18, Vite, React Router, Tailwind CSS
- **Backend:** Node.js 18+, Express, Mongoose
- **Database:** MongoDB
- **AI planning:** Google Gemini API

## Run Locally

### Prerequisites

- Node.js 18 or later and npm
- MongoDB running locally, or a MongoDB connection URI
- A Google Gemini API key to use AI planning (optional for other features)

### 1. Start the backend

In a terminal:

```sh
cd backend
cp .env.example .env
npm install
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env` in place of the `cp` command. Edit `backend/.env` as needed:

| Variable | Purpose | Default in example |
| --- | --- | --- |
| `PORT` | Backend HTTP port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/savebuddy` |
| `JWT_SECRET` | Secret used to sign authentication tokens | Replace the example value with a unique secret |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` |
| `CLIENT_URL` | Frontend origin allowed by CORS | `http://localhost:5173` |
| `GEMINI_API_KEY` | Google Gemini API key for AI planning | Add your key to enable AI planning |

The backend requires `PORT`, `MONGO_URI`, and `JWT_SECRET` to be set. Keep secrets out of source control; `.env` files are ignored by Git.

### 2. Start the frontend

In a second terminal:

```sh
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Vite forwards `/api` requests to the backend at `http://localhost:5000`. To use another API URL, set `VITE_API_URL` in the frontend environment before starting or building the app.

### Docker Compose

With Docker Desktop installed, run from the repository root:

```sh
docker compose up --build
```

The frontend is served at [http://localhost](http://localhost), and the API is available at `http://localhost:5000`. The Compose configuration currently uses a fixed JWT secret and production mode; replace the secret and review the deployment settings before exposing it outside a local environment. Set `GEMINI_API_KEY` in the environment if you want AI planning in the containerized app.

## Verification

Run the backend tests:

```sh
cd backend
npm test
```

Build the frontend for production:

```sh
cd frontend
npm run build
```

## API

The backend API is rooted at `/api`. Check service and database status at `GET /api/health` (for local development: [http://localhost:5000/api/health](http://localhost:5000/api/health)). The complete endpoint reference is in [docs/api-documentation.md](docs/api-documentation.md).

## Project Documentation

- [Project context and architecture](docs/context.md)
- [API documentation](docs/api-documentation.md)
- [Database design](docs/database-design.md)
- [Software requirements (Markdown)](docs/SRS.md)
- [Savings Goal Tracker SRS (Word)](docs/Savings_Goal_Tracker_SRS.docx)
- [UI/UX audit](docs/UI_UX_AUDIT.md)