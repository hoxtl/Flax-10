# StudyFlax - Team Flax-10 Major Group Project

**Project Topic:** Academic Time Management System for Students in Higher Education

## Table of Contents

1. [Project Description](#project-description)
2. [Authors](#authors)
3. [Project Structure](#project-structure)
4. [Deployed Application](#deployed-application)
5. [Access Credentials](#access-credentials)
6. [Installation Instructions](#installation-instructions)
7. [Third-Party Source Code and Libraries](#third-party-source-code-and-libraries)
8. [Use of AI Assistance](#use-of-ai-assistance)

## Project Description

StudyFlax is a web-based academic time management platform built for students and teachers at King's College London. It allows students to organise their schedules, track deadlines, and manage their academic workload in one place. Teachers can create modules, set deadlines, and assign work to their students, whilst the admin oversees and manages the system as a whole.

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

## Project Structure

The repository is organised as follows:

```text
Flax-10/
├── reports/
└── source_code/
    ├── flake.nix                    # Nix development environment configuration
    ├── flake.lock
    ├── Dockerfile
    ├── docker-compose.yml
    ├── requirements.txt            # Python dependencies used by the Nix workflow
    ├── README.md
    └── flax-10-project-files/
        ├── backend/                # Django REST API backend
        └── frontend/               # React + Vite frontend
```

Important: all `nix` commands in this project must be run from inside the `source_code/` directory, because that is where `flake.nix` now lives.

The system consists of two primary components:

- **Backend:** A Django REST Framework API connected to a PostgreSQL database.
- **Frontend:** A React application built with Vite, communicating with the backend via REST API.

## Deployed Application

The deployed version of the application can be found at: https://flax-10-production.up.railway.app/

For local development, the Django admin panel is available at `/admin/` on whichever backend URL you start locally.

## Access Credentials

The following fixture accounts are available for testing and assessment purposes. All accounts use the password: `1234`

| Username  | Role            | Password |
| --------- | --------------- | -------- |
| `janedoe` | Student         | `1234`   |
| `charlie` | Student         | `1234`   |
| `johndoe` | Admin & Student | `1234`   |
| `amiller` | Teacher         | `1234`   |

> **Admin Access:** The `johndoe` account holds administrator privileges. In addition to the Django admin panel at `/admin/` on your local backend URL, admin features are also accessible directly through the main application by signing in with the username `johndoe` and the password `1234`. Additionally, there is a reference to the Django admin panel inside the `johndoe` admin page.

> **Seeded Users:** Additional user accounts are available, generated using the [Faker](https://faker.readthedocs.io/) library as part of the database seeding process. These accounts can be viewed and managed via the Django admin panel when signed in as `johndoe`.

## Installation Instructions

### Prerequisites

- [Nix Package Manager](https://nixos.org/download/#download-nix) must be installed before proceeding.

### Linux / macOS

1. Open a terminal and navigate into the `source_code` directory:

   ```bash
   cd /path/to/Flax-10/source_code
   ```

2. Run the project initialisation command:

   ```bash
   nix --extra-experimental-features 'nix-command flakes' run .#init
   ```

   > **Tip:** To enable these experimental features permanently, add the following line to `/etc/nix/nix.conf`:
   > ```text
   > experimental-features = nix-command flakes
   > ```

3. This command:

- creates the Python virtual environment in `source_code/flax-10-project-files/venv`
- installs Python and frontend dependencies
- starts a project-local PostgreSQL instance under `source_code/.postgres/`
- runs database migrations
- seeds the database with the fixture dataset

4. Start the backend and frontend development servers:

   ```bash
   nix --extra-experimental-features 'nix-command flakes' run .#run
   ```

   The command prints the exact local frontend and backend URLs when both servers start.

### Local PostgreSQL Database

When using the Nix workflow above, PostgreSQL is managed automatically for you. The flake starts a project-local database cluster under `.postgres/`, creates the `flax10` database if needed, and sets the backend `POSTGRES_*` environment variables automatically.

If you run the backend outside the Nix commands, the Django settings fall back to:

- host: `localhost`
- port: `5432`
- database: `postgres`
- username: `postgres`
- password: `1234`

### Re-entering the Nix Environment

Whenever you want to start the app again, first move into `source_code/`:

```bash
cd /path/to/Flax-10/source_code
```

Then use any of the following commands:

```bash
nix --extra-experimental-features 'nix-command flakes' run .#run
```

```bash
nix --extra-experimental-features 'nix-command flakes' run .#tests
```

```bash
nix --extra-experimental-features 'nix-command flakes' run .#seed
```

```bash
nix --extra-experimental-features 'nix-command flakes' run .#unseed
```

## Third-Party Source Code and Libraries

The following third-party packages and tools were used directly in the development of this software.

### Package Management

| Package | Version                          | Purpose                             |
| ------- | -------------------------------- | ----------------------------------- |
| Nix     | Managed by the local environment | Reproducible environment management |
| npm     | Bundled with the Node.js toolchain | JavaScript package management     |

### Frontend Dependencies

**Runtime**

| Package   | Version | Purpose              |
| --------- | ------- | -------------------- |
| react     | 19.2.0  | UI component library |
| react-dom | 19.2.0  | React DOM renderer   |

**Development**

| Package                     | Version | Purpose                                    |
| --------------------------- | ------- | ------------------------------------------ |
| vite                        | 7.2.4   | Frontend build tool and development server |
| @vitejs/plugin-react        | 5.1.1   | React fast-refresh and JSX support         |
| eslint                      | 9.39.1  | JavaScript/TypeScript linter               |
| @eslint/js                  | 9.39.1  | Core ESLint rule definitions               |
| eslint-plugin-react-hooks   | 7.0.1   | React Hooks linting rules                  |
| eslint-plugin-react-refresh | 0.4.24  | Fast-refresh linting support               |
| globals                     | 16.5.0  | Shared global variable definitions         |
| @types/react                | 19.2.5  | TypeScript typings for React               |
| @types/react-dom            | 19.2.3  | TypeScript typings for React DOM           |
| framer-motion               | 12.34.3 | Web animation library                      |
| @mui/material               | 7.3.8   | Component library                          |
| styled-components           | 6.3.9   | CSS-in-JS styling library                  |

### Backend Dependencies

| Package             | Version | Purpose                                         |
| ------------------- | ------- | ----------------------------------------------- |
| Django              | 5.2.0   | Web framework                                   |
| faker               | 40.4.0  | Fake data generation for database seeding       |
| djangorestframework | 3.16.1  | REST API framework for Django                   |
| django-cors-headers | 4.9.0   | Cross-origin request handling                   |
| psycopg             | 3.3.2   | PostgreSQL driver (async-capable core)          |
| psycopg-binary      | 3.3.2   | Precompiled psycopg binaries for local/dev use  |
| asgiref             | 3.11.1  | ASGI utilities used by Django                   |
| sqlparse            | 0.5.5   | SQL parsing and formatting (used by Django ORM) |
| virtualenv          | 20.36.1 | Isolated Python environment creation            |
| distlib             | 0.4.0   | Dependency utility library (virtualenv backend) |
| filelock            | 3.20.1  | Cross-platform file locking                     |
| platformdirs        | 4.5.0   | OS-specific directory resolution                |
| Pillow              | 12.1.1  | Image processing support                        |
| icalendar           | 7.0.0   | Calendar export and iCalendar utilities         |
| openai              | 2.21.0  | OpenAI API client used by backend features      |

## Use of AI Assistance

This project made use of AI tools in the following capacities:

- **Conceptual understanding:** AI tools were used to help the team understand and explain technical concepts, particularly when learning and navigating the React ecosystem for the first time.
- **GitHub Copilot (via GitHub Student Developer Pack):** Used throughout development to receive real-time feedback on code quality, suggest new features, and support the team in writing and improving code incrementally.
- **Testing support:** AI assistance was used to aid in the planning and writing of tests, helping to identify edge cases and improve overall test coverage.
- **Import error resolution:** During the refactoring process, the codebase grew to a large number of files, which resulted in a significant number of import paths needing to be updated simultaneously. AI tools were used to help locate and correct these broken imports efficiently across the codebase, a task that would have been highly time-consuming to carry out manually at that scale. All suggested changes were reviewed and verified by the team before being merged.

All AI-assisted contributions were reviewed, understood, and integrated by members of the team. No AI-generated code was incorporated without verification.
