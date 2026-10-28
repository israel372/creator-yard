
# Creator-Yard — macOS Development Setup

This guide documents the local development setup for Creator-Yard on macOS, including installation, running the application, verification, and troubleshooting.

## 1. Verified Environment

The setup was tested on the following Mac:

- macOS 15.1.1
- Apple Silicon (`arm64`)
- Python 3.13.5
- Node.js v22.13.1
- npm 10.9.2
- Git 2.39.5

Check your installed versions in Terminal:

```bash
sw_vers
uname -m
python3 --version
node --version
npm --version
git --version
```

Your versions may differ from those recorded above.

## 2. Open the Project

```bash
cd ~/Projects/creator-yard
```

Check that the backend and frontend configuration files exist:

```bash
test -f backend/requirements.txt && echo "Backend requirements found"
test -f frontend/package.json && echo "Frontend package.json found"
```

## 3. Set Up the Python Environment

Create a virtual environment if one does not already exist:

```bash
python3 -m venv .venv
```

Activate it:

```bash
source .venv/bin/activate
```

Install the backend dependencies:

```bash
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt
```

Check for dependency conflicts:

```bash
python -m pip check
```

### Important dependency note

During setup, importing the backend initially failed because the `requests` package was missing. The package was added to `backend/requirements.txt` and installed through the requirements file.

If you encounter a missing Python module, activate `.venv`, install the declared requirements, and investigate whether the missing dependency should be declared in the appropriate requirements file.

## 4. Environment Variables and Database Safety

The backend may load local configuration from an environment file.

- Never commit `.env` files or expose API keys, tokens, passwords, or database credentials.
- Do not paste secret values into logs or documentation.
- Verify the database configuration before running database operations.
- Avoid destructive operations against production data while testing locally.

The project documentation describes SQLite as the local fallback when `DATABASE_URL` is not configured. Confirm the current application configuration before relying on that behavior.

## 5. Start the Backend

From the project root, with `.venv` activated:

```bash
uvicorn app.main:app --app-dir backend --reload --port 8000
```

Keep this Terminal window open while the backend is running.

Open the API documentation:

http://127.0.0.1:8000/docs

Stop the server with `Control+C`.

### Verify the backend import

Open another Terminal window, navigate to the project root, and activate the virtual environment if necessary. Then run:

```bash
cd ~/Projects/creator-yard
source .venv/bin/activate
PYTHONPATH=backend python -c "from app.main import app; print('FastAPI import successful'); print('Application:', app.title)"
```

Inspect registered routes:

```bash
PYTHONPATH=backend python -c "from app.main import app; print('Routes registered:', len(app.routes)); print('OpenAPI path:', app.openapi_url)"
```

These checks passed during the recorded setup. They do not prove that every endpoint or external integration works.

## 6. Install and Start the Frontend

Use a second Terminal window so the backend can continue running.

```bash
cd ~/Projects/creator-yard
npm --prefix frontend install
```

Start Vite:

```bash
npm --prefix frontend run dev
```

Open the exact local URL printed by Vite. It is commonly `http://localhost:5173`, but the port may differ.

Stop the frontend server with `Control+C`.

## 7. Build and Lint Checks

Run the following commands from the project root.

### Build the frontend

```bash
npm --prefix frontend run build
```

The frontend production build passed during the recorded setup.

### Run the frontend linter

```bash
npm --prefix frontend run lint
```

The lint check reported outstanding issues in existing frontend files, including unused variables, React effect/state rules, hook dependency warnings, and error-handling lint rules.

These findings are not necessarily macOS installation problems. Review each finding carefully before changing application behavior. A successful build does not mean lint has passed.

### Check Python syntax

For the main application:

```bash
PYTHONPATH=backend python -m py_compile backend/app/main.py
```

For another backend file, substitute its actual path:

```bash
PYTHONPATH=backend python -m py_compile backend/app/routes/referral.py
```

Syntax checks do not test endpoint behavior or external service credentials.

## 8. Troubleshooting

### Missing Python module

```bash
cd ~/Projects/creator-yard
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
```

If the module is still missing, identify the package that provides it and update the appropriate requirements file deliberately.

### Port already in use

Another process may be using port `8000` or Vite's selected port. Stop the other development server or choose another available port.

### Build passes but lint fails

Build and lint are separate checks. Review lint output, fix issues deliberately, and rerun the lint command.

### API imports but a feature fails

Check the backend terminal, local configuration, database connection, and the affected endpoint. Import success alone does not verify payments, OAuth, email, or other external integrations.

## 9. Git Safety

Before editing or committing files:

```bash
git status --short
```

Preserve existing application changes and untracked files. Do not use `git reset --hard`, `git clean -fd`, or broad restore commands to resolve setup problems unless their effects are understood and explicitly intended.

Keep credentials, local environment files, generated data, and large local media out of commits unless they are intentionally part of the project.

Do not commit, push, or deploy without the appropriate approval.

## 10. Verification Record

At the time of writing:

- The FastAPI application imported successfully.
- The application registered 15 routes.
- Backend dependency installation completed successfully after adding `requests`.
- `pip check` previously reported no broken requirements; rerun it after dependency changes.
- The frontend production build passed.
- The frontend lint command reported outstanding issues.

These results describe one development environment at a point in time. Rerun relevant checks after dependency or source-code changes.
