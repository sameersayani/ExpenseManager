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

## AI Chat and MCP

The optional Ask AI page is available at `/ask-ai`. The browser calls the authenticated FastAPI chat endpoint; AI credentials and MCP tool execution remain on the backend.

Add these settings to the backend `.env` to enable an OpenAI-compatible provider:

```dotenv
AI_ENABLED=true
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=replace-with-your-server-side-key
AI_MODEL=gpt-4o-mini
AI_MAX_TOOL_CALLS=4
```

For a free local setup, install [Ollama](https://ollama.com), download a model, and use:

```powershell
ollama pull llama3.2
```

```dotenv
AI_ENABLED=true
AI_BASE_URL=http://127.0.0.1:11434/v1
AI_MODEL=llama3.2
AI_MAX_TOOL_CALLS=4
```

Ollama runs locally and does not require `AI_API_KEY`. The computer needs enough memory to run the selected model.

Groq is another option with an OpenAI-compatible API and a free usage tier subject to rate and quota limits. Create a Groq API key, then configure:

```dotenv
AI_ENABLED=true
AI_BASE_URL=https://api.groq.com/openai/v1
AI_API_KEY=your-groq-api-key
AI_MODEL=your-groq-tool-capable-model-id
AI_MAX_TOOL_CALLS=4
```

Use a currently available Groq model that supports tool calling. Keep the Groq key only in the backend `.env`; do not add it to the React environment file.

The first MCP tool set manages daily expenses only. Reads, searches, creates, and updates are available through chat. Deletes always require an explicit confirmation in the UI and remain scoped to the authenticated user.
