# Creator-Yard Development Setup

This guide explains how to install, run, test, and maintain Creator-Yard
on macOS and Windows.

## 1. Project Overview

- Frontend: React, Vite, and React Router
- Backend: FastAPI and SQLAlchemy
- Database: SQLite locally when DATABASE_URL is not configured;
  external database configuration may also be used.
- Hosting: Cloudflare Pages and Workers

## 2. Prerequisites

Install these tools before starting:

- Git
- Python 3
- Node.js with npm

Check your installations:

    git --version
    python3 --version
    node --version
    npm --version

On Windows, use `py --version` if `python3` is unavailable.

## 3. macOS Installation

Open Terminal and enter the project directory:

    cd ~/Projects/creator-yard

Create a Python virtual environment:

    python3 -m venv .venv
    source .venv/bin/activate

Install the backend dependencies:

    python -m pip install --upgrade pip
    python -m pip install -r backend/requirements.txt

Start the backend API from the project root:

    uvicorn app.main:app --app-dir backend --reload --port 8000

Open the API documentation in your browser:

    http://127.0.0.1:8000/docs

Keep this Terminal window running while using the backend.
Press Control+C to stop the server.

## 4. Windows Installation

Open PowerShell and navigate to the project directory.
Adjust the path if your project is stored elsewhere.

Create a Python virtual environment:

    py -m venv .venv

Activate it:

    .\.venv\Scripts\Activate.ps1

If PowerShell blocks activation, run this temporary setting
in the same PowerShell window, then activate again:

    Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
    .\.venv\Scripts\Activate.ps1

Alternatively, in Windows Command Prompt, activate with:

    .\.venv\Scripts\activate.bat

Install the backend dependencies:

    python -m pip install --upgrade pip
    python -m pip install -r backend/requirements.txt

Start the backend API from the project root:

    python -m uvicorn app.main:app --app-dir backend --reload --port 8000

Open the API documentation:

    http://127.0.0.1:8000/docs

Keep the terminal window running while using the backend.
Press Ctrl+C to stop the server.

## 5. Frontend Installation (macOS and Windows)

Open a second terminal window. Keep the backend running in the first.

From the project root, install frontend dependencies:

    npm --prefix frontend install

Start the frontend development server:

    npm --prefix frontend run dev

Vite will print the local URL in the terminal. It is commonly
http://localhost:5173 or http://localhost:5174.
Open the exact URL printed by Vite.

To stop the frontend server, press Ctrl+C.

## 6. Build and Code Checks

Run these commands from the project root.

Build the frontend:

    npm --prefix frontend run build

Run frontend lint checks:

    npm --prefix frontend run lint

Check backend Python syntax for the main application:

    PYTHONPATH=backend python -m py_compile backend/app/main.py

If you modify another backend Python file, you can check it with:

    PYTHONPATH=backend python -m py_compile path/to/your_file.py

Replace the example path with the actual file path.

A successful build or syntax check is useful, but does not replace
testing the affected feature in the browser.

## 7. Environment Variables and Database Safety

The backend loads environment variables from a local .env file
when available.

The database configuration checks DATABASE_URL. If it is not
configured, the application uses a local SQLite database named
creator-yard-local.db in the project root.

Important safety rules:

- Never commit API keys, passwords, access tokens, or production secrets.
- Never copy production credentials into public documentation.
- Do not point a local development environment at a production
  database unless the project owner has explicitly approved it.
- Keep local database files and uploaded user content out of Git.
- Do not invent missing environment variable names. Check the
  current application code or ask the project maintainer.
- Use the backend requirements file for backend setup:
  backend/requirements.txt.

The repository does not currently provide a confirmed complete
environment-variable template in this guide. Add one only after
the required variables have been checked against the application.

## 8. Troubleshooting

Backend does not start:
- Confirm the virtual environment is activated.
- Confirm backend dependencies were installed.
- Check the error message in the terminal.
- Confirm port 8000 is not already occupied.

Frontend cannot reach the backend:
- Confirm the backend is running at http://127.0.0.1:8000.
- Check the frontend API base URL configuration.
- Check the browser console and backend terminal for errors.
- CORS origins must match the frontend URL, including its port.
  For example, localhost:5173 and localhost:5174 are different origins.

Frontend build fails:
- Review the first relevant error in the terminal.
- Install dependencies with npm --prefix frontend install.
- Run npm --prefix frontend run build again after fixing the error.

A successful HTTP response does not prove every application
feature is working. Test the affected feature in the browser.

## 9. Team Git Workflow

### Shared integration branch

The integration branch is the shared testing baseline.
The main branch is reserved for approved, stable changes.

### Work on a separate task branch

Start by checking your current branch and working-tree changes:

    git status
    git branch --show-current

Do not discard, overwrite, or commit another person's unrelated
changes without discussing them first.

Create a task branch from the latest integration branch only
after your existing changes are safely preserved:

    git fetch origin
    git switch integration
    git pull --ff-only origin integration
    git switch -c team-austin/short-task-name

Use team-israel/short-task-name for work assigned to that team.
Replace short-task-name with a brief description of the task.

If you already have uncommitted work, protect it before switching
branches. Do not blindly run git reset, git clean, or git stash
commands that could affect someone else's work.

### Before opening a pull request

- Review git status and git diff.
- Run the relevant backend checks and frontend build.
- Test the affected feature locally.
- Commit only the files intended for the task.
- Open a pull request targeting integration.
- Resolve review feedback and test the combined integration branch.

Promote integration to main only after the changes are reviewed,
tested, and approved.

### Deployment rule

Do not deploy to production unless the project owner explicitly
requests and approves the deployment.

## 10. Maintaining This Guide

Update this guide in the same pull request whenever installation
steps, dependencies, environment configuration, ports, or project
structure change.

Before merging a documentation update:

- Verify commands against the current repository.
- Test changed setup instructions where practical.
- Keep secrets, private credentials, and machine-specific paths out.
- Remove obsolete instructions when the implementation changes.
