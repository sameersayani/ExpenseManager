# ExpenseManager

ExpenseManager is a personal expense-tracking application with a FastAPI backend and a React frontend. It supports Google OAuth login, expense and product management, suppliers, charts, and report downloads.

## Project Structure

- `app/` - FastAPI backend, Tortoise ORM models, templates, and static assets
- `ui/finacals/` - React frontend
- `app/requirements.txt` - Python dependencies
- `ui/finacals/package.json` - Frontend dependencies and scripts

## Requirements

- Python 3.12 or compatible Python 3.x version
- Node.js and npm
- A Google OAuth web application for login

## Backend Setup

From the repository root:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r app\requirements.txt
```

Create a local `.env` file in the repository root. Do not commit it:

```dotenv
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://127.0.0.1:8000/auth
API_BASE_URL=http://127.0.0.1:8000
REACT_BASE_URL=http://127.0.0.1:3000
DATABASE_URL=sqlite://app/database.sqlite3
SECRET_KEY=replace-with-a-long-random-value
```

Start the backend:

```powershell
python -m app.main
```

The backend is available at `http://127.0.0.1:8000`. The health check is `http://127.0.0.1:8000/api/health`.

## Frontend Setup

In a second terminal:

```powershell
cd ui\finacals
npm install
```

Create `ui/finacals/.env` with the frontend API and application URLs:

```dotenv
REACT_APP_API_BASE_URL=http://127.0.0.1:8000
REACT_APP_REACT_BASE_URL=http://127.0.0.1:3000
```

Start the React development server:

```powershell
npm start
```

Open `http://127.0.0.1:3000` in a browser.

## Useful Commands

Run frontend tests:

```powershell
cd ui\finacals
npm test
```

Create a production frontend build:

```powershell
cd ui\finacals
npm run build
```

## Security

Never commit `.env` files, OAuth client secrets, session keys, database credentials, or other private values. If a secret is accidentally committed, revoke or rotate it immediately, remove it from Git history, and update the local environment file.
