# StudyFlax — Team Flax-10 Major Group Project

**Project Topic:** Academic Time Management System for Students in Higher Education

## Project Description

StudyFlax is a web-based academic time management platform built for students and teachers at King's College London. It allows students to organise schedules, track deadlines, and manage academic workload in one place. Teachers can create modules, set deadlines, and assign work to students, whilst admin users can oversee and manage the system as a whole.

## Authors

The following members contributed to the development of this software:

- Aishah Ahmed
- Eric Almeida
- Zerun (Harry) Chen
- Cate Tay (Cate) Chew
- Indixora Jozal
- Kausar Khan
- Hamed Latif
- Dian Mahmood
- Binuli Nevanma Markawitage

## Software Components And Repository Structure

The submission contains the following main components:

```text
Flax-10/
├── README.md                         # Submission overview and setup guide
├── flake.nix                         # Nix development commands and local PostgreSQL setup
├── docker-compose.yml                # Docker-based development helper
├── requirements.txt                  # Root Python dependencies used by Nix init/tests
├── developers-manual.tex             # Developer manual source
├── report/                           # Final report source and assets
└── flax-10-project-files/
    ├── backend/                      # Django REST Framework backend
    ├── frontend/                     # React + Vite frontend
    └── scripts/                      # Code quality checking scripts
```

Primary software components:

- **Backend:** Django REST Framework API with PostgreSQL.
- **Frontend:** React single-page application built with Vite.

Supporting project material also included in the repository:

- Report source and figures in `report/`
- Developer manual source in `developers-manual.tex`
- Code-quality scripts in `flax-10-project-files/scripts/`

Generated artifacts such as `node_modules/`, coverage reports, local virtual environments, compiled builds, caches, and other reproducible output should not be treated as essential handwritten source code.

## Deployed Application

The deployed application is available at:

- https://flax-10-production.up.railway.app/

For local development, the Django admin panel is available at:

- `http://127.0.0.1:8000/admin/` when the backend is running on its default port

If the default port is already in use, the Nix run script automatically selects the next available backend/frontend ports.

## Access Credentials

The project includes seeded fixture accounts for testing and assessment. The fixture password is:

- `1234`

Known fixture users:

| Username | Role |
| --- | --- |
| `johndoe` | Student and Admin |
| `janedoe` | Student |
| `amiller` | Teacher |
| `charlie` | Student |

Additional seed data is generated during the database seeding process, including extra users and sample academic data. The `johndoe` account has administrator privileges and can access both admin-only features in the main application and the Django admin panel.

## Installation And Setup Instructions

### Recommended Workflow: Nix

The recommended setup is the Nix flake provided in the repository root. This workflow:

- creates a project-local Python virtual environment
- installs frontend dependencies
- starts a project-local PostgreSQL cluster
- applies database migrations
- seeds the database with sample data

### Prerequisites

- [Nix Package Manager](https://nixos.org/download/#download-nix)
- Git

Windows users may either:

- use WSL and follow the Linux/macOS steps, or
- use Docker Desktop with the container-based steps below

### Linux / macOS / WSL

1. Clone the repository and enter its root directory.
2. Run the project initialisation command:

```bash
nix --extra-experimental-features 'nix-command flakes' run .#init
```

3. Start the backend and frontend development servers:

```bash
nix --extra-experimental-features 'nix-command flakes' run .#run
```

4. Run the automated test suite when needed:

```bash
nix --extra-experimental-features 'nix-command flakes' run .#tests
```

Useful additional commands:

```bash
nix --extra-experimental-features 'nix-command flakes' run .#seed
nix --extra-experimental-features 'nix-command flakes' run .#unseed
nix --extra-experimental-features 'nix-command flakes' develop
```

### Windows Via Docker

If not using WSL, Docker Desktop can be used to access Nix:

1. Create a persistent Nix store volume:

```bash
docker volume create nix-store
```

2. Start the Nix container from the repository root:

```powershell
docker run --rm -it `
  -v "${PWD}:/work" `
  -v nix-store:/nix `
  -w /work `
  nixos/nix:latest
```

3. Inside the container, run:

```bash
nix --extra-experimental-features 'nix-command flakes' run .#init
nix --extra-experimental-features 'nix-command flakes' run .#run
```

The container removes itself on exit because `--rm` is used, so the `docker run` command must be repeated for later sessions.

### Manual Component-Level Development

If the project is being run without the Nix entrypoints, the software components are located here:

- Backend: `flax-10-project-files/backend/`
- Frontend: `flax-10-project-files/frontend/`

Typical component-level commands:

```bash
cd flax-10-project-files/backend
python manage.py migrate
python manage.py seed
python manage.py runserver
```

```bash
cd flax-10-project-files/frontend
npm install
npm run dev
```

## Environment Variables And Third-Party Services

The repository must not embed secret keys in documentation. If environment variables are not included in the submitted source, they must be recreated during setup.

### Backend

Optional backend environment variables include:

- `OPENAI_API_KEY`
- `FRONTEND_URL`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

When using the Nix workflow, the PostgreSQL variables are configured automatically for the local project database.

### Frontend

Optional frontend environment variables include:

- `VITE_API_BASE_URL`
- `VITE_MAPBOX_TOKEN`
- `VITE_TFL_API_KEY`

### Third-Party Services Used

- **OpenAI API:** used for AI-powered analytics functionality. Requires `OPENAI_API_KEY` for that feature.
- **Mapbox Geocoding / Mapbox GL:** used for map display and geocoding features. Requires `VITE_MAPBOX_TOKEN`.
- **Transport for London API:** used for travel-time and disruption features. Requires `VITE_TFL_API_KEY`.
- **Railway:** used for deployment of the hosted application.

If these API keys are not supplied, the corresponding optional features may not work in local development. Core local development, database setup, and most application functionality can still be run without embedding secrets in the repository.

## Testing

Recommended full-project test command:

```bash
nix --extra-experimental-features 'nix-command flakes' run .#tests
```

This runs:

- backend Django tests with coverage output
- frontend Vitest tests with coverage output

Component-level testing:

```bash
cd flax-10-project-files/backend
python manage.py test
```

```bash
cd flax-10-project-files/frontend
npm run test
npm run coverage
```

Code-quality scripts are also included in:

- `flax-10-project-files/scripts/`

## Significant Third-Party Source Material And Libraries

The project relies on the following significant third-party frameworks, libraries, APIs, and reference material.

### Core Frameworks And Libraries

- **Django** — https://www.djangoproject.com/
- **Django REST Framework** — https://www.django-rest-framework.org/
- **React** — https://react.dev/
- **Vite** — https://vite.dev/
- **Vitest** — https://vitest.dev/
- **PostgreSQL** — https://www.postgresql.org/
- **Nix** — https://nixos.org/

### Important Frontend Libraries

- **Material UI (`@mui/material`)** — https://mui.com/
- **Framer Motion** — https://www.framer.com/motion/
- **Mapbox GL JS** — https://docs.mapbox.com/mapbox-gl-js/
- **React Router** — https://reactrouter.com/
- **styled-components** — https://styled-components.com/
- **date-fns** — https://date-fns.org/
- **react-markdown** — https://github.com/remarkjs/react-markdown

### Important Backend Libraries

- **django-cors-headers** — https://github.com/adamchainz/django-cors-headers
- **django-vite** — https://github.com/MrBin99/django-vite
- **psycopg / psycopg-binary** — https://www.psycopg.org/
- **Gunicorn** — https://gunicorn.org/
- **python-dotenv** — https://github.com/theskumar/python-dotenv
- **Faker** — https://faker.readthedocs.io/
- **OpenAI Python SDK** — https://github.com/openai/openai-python

### External APIs And Services

- **OpenAI API** — https://platform.openai.com/docs/
- **Mapbox APIs** — https://docs.mapbox.com/api/
- **Transport for London Unified API** — https://api-portal.tfl.gov.uk/
- **Railway** — https://railway.com/

These items form the main external technical foundation relied upon directly during implementation. They should be treated as the principal reference list for the source code.

## Use Of AI Assistance

This project made use of AI tools in the following ways:

- conceptual support when learning unfamiliar tools and frameworks
- code review and iterative coding support through GitHub Copilot
- testing support for identifying edge cases and improving coverage

All AI-assisted contributions were reviewed, understood, and integrated by team members before inclusion in the project.
