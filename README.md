# Creator-Yard

Creator-Yard is a portfolio and services website for showcasing creative work, client brands, and business services.

## Development setup

For step-by-step installation instructions for macOS and Windows, see [Development Setup Guide](docs/DEVELOPMENT_SETUP.md).

For Mac-specific instructions verified on Apple Silicon, see [macOS Development Setup](docs/MACOS_SETUP.md).
## Technology

- **Frontend:** React, Vite, React Router
- **Backend:** FastAPI, SQLAlchemy
- **Database and image storage:** Supabase
- **Hosting:** Cloudflare Pages/Workers; other hosting options can be configured when needed

## Project structure

```text
creator-yard/
+-- backend/            # FastAPI API and application services
+-- cloudflare-worker/  # Cloudflare Worker project
+-- frontend/           # React and Vite website
+-- requirements.txt    # Root Python dependency list
+-- README.md
```

## Run the frontend locally

Install Node.js, then run:

```bash
cd frontend
npm install
npm run dev
```

Vite will display the local development URL in the terminal.

## Run the backend locally

Create and activate a Python virtual environment, then install the backend requirements:

```bash
python -m venv .venv
```

On Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Start the API from the project root:

```powershell
uvicorn app.main:app --app-dir backend --reload --port 8000
```

The API documentation is available at `http://127.0.0.1:8000/docs`.

Configure the required environment variables locally before starting the backend. Do not commit `.env` files, credentials, or database connection strings.

## Deployment notes

- Configure frontend API URLs for the intended production backend.
- Set backend environment variables in the hosting provider's dashboard.
- Keep Supabase keys and other secrets out of source control.
- Confirm Cloudflare Worker bindings and database configuration before deploying.
- Configure CORS to allow the actual production frontend domain.

## Security

Never commit environment files, database backups, local databases, dependency folders, or credentials.

## License

No license has been selected yet. All rights remain with the copyright holder unless a license is added.
