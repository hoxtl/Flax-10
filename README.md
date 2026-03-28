# StudyFlax — Team Flax-10 Major Group Project

**Project Topic:** Academic Time Management System for Students in Higher Education

---

## Table of Contents

1. [Project Description](#project-description)
2. [Authors](#authors)
3. [Project Structure](#project-structure)
4. [Deployed Application](#deployed-application)
5. [Access Credentials](#access-credentials)
6. [Installation Instructions](#installation-instructions)
7. [Third-Party Source Code and Libraries](#third-party-source-code-and-libraries)
8. [Use of AI Assistance](#use-of-ai-assistance)

---

## Project Description

StudyFlax is a web-based academic time management platform built for students and teachers at King's College London. It allows students to organise their schedules, track deadlines, and manage their academic workload in one place. Teachers can create modules, set deadlines, and assign work to their students, whilst the admin oversees and manages the system as a whole.

---

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

---

## Project Structure

The repository is organised as follows:

```
Flax-10/
├── flax-10-project-files/
│   ├── backend/        # Django REST API backend
│   └── frontend/       # React + Vite frontend
├── flake.nix           # Nix development environment configuration
└── README.md
```

The system consists of two primary components:

- **Backend:** A Django REST Framework API connected to a PostgreSQL database.
- **Frontend:** A React application built with Vite, communicating with the backend via REST API.

---

## Deployed Application

The deployed version of the application can be found at: https://flax-10-production.up.railway.app/

The Django admin panel (for local development) is accessible at: http://localhost:8000/admin/

---

## Access Credentials

The following fixture accounts are available for testing and assessment purposes. All accounts use the password: `1234`

| Username  | Role            | Password |
| --------- | --------------- | -------- |
| `johndoe` | Student & Admin | `1234`   |
| `janedoe` | Student         | `1234`   |
| `amiller` | Teacher         | `1234`   |
| `charlie` | Student         | `1234`   |

> **Admin Access:** The `johndoe` account holds administrator privileges. In addition to the Django admin panel at http://localhost:8000/admin/, admin features are also accessible directly through the main application by signing in with the username `johndoe` and the password `1234`. Additionally, there is a reference to the Django admin panel inside the `johndoe` admin page.

> **Seeded Users:** Additional user accounts are available, generated using the [Faker](https://faker.readthedocs.io/) library as part of the database seeding process. These accounts can be viewed and managed via the Django admin panel when signed in as `johndoe`.

---

## Installation Instructions

### Prerequisites

- [Nix Package Manager](https://nixos.org/download/#download-nix) must be installed before proceeding.
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) is required for Windows users who are not using WSL.

---

### Linux / macOS

1. Open a terminal and navigate to the root of the repository:

   ```bash
   cd /path/to/Flax-10
   ```

2. Enter the Nix development environment:

   ```bash
   nix --extra-experimental-features 'nix-command flakes' develop -c bash
   ```

   > **Tip:** To enable these experimental features permanently, add the following line to `/etc/nix/nix.conf`:
   > ```
   > experimental-features = nix-command flakes
   > ```

3. The Nix flake script will automatically configure the Python virtual environment and npm environment. Once complete, you will be returned to the bash terminal, from which you may activate the virtual environment or run the frontend development server.

---

### Windows (via Docker)

> Alternatively, Windows users may use WSL and follow the Linux/macOS instructions above.

1. Open Docker Desktop and navigate to the Docker Desktop Terminal.

2. Change directory to the cloned repository folder and run the following commands in order:

   **Create a persistent Nix store volume:**
   ```bash
   docker volume create nix-store
   ```

   **Launch the NixOS container:**
   ```powershell
   docker run --rm -it `
     -v "${PWD}:/work" `
     -v nix-store:/nix `
     -w /work `
     nixos/nix:latest
   ```

   If the above does not work, use the single-line equivalent:
   ```powershell
   docker run --rm -it -v "${PWD}:/work" -v nix-store:/nix -w /work nixos/nix:latest
   ```

3. Inside the NixOS container, stage the flake file:

   ```bash
   git -C "/work" add "flake.nix"
   ```

4. Enter the Nix development environment:

   ```bash
   nix --extra-experimental-features 'nix-command flakes' develop -c bash
   ```

> **Note:** The container is configured to remove itself upon exit (`--rm`). The `docker run` command must be re-run each time you wish to re-enter the environment.

---

### Setting Up the Local PostgreSQL Database

1. After installing PostgreSQL, open the `psql` terminal.

2. When prompted for connection details (server, database, username), press **Enter** to accept the defaults until prompted for a password.

3. The Django `settings.py` is pre-configured with default PostgreSQL parameters. The default password is `1234`. Update the password in `settings.py` to match the one set for your local PostgreSQL user if it differs.

4. Once PostgreSQL is running, apply Django database migrations:

   ```bash
   python manage.py migrate
   ```

---

### Re-entering the Nix Environment

Each time you wish to resume development, re-enter the Nix shell by running the following from the repository root:

```bash
nix --extra-experimental-features 'nix-command flakes' develop -c bash
```

Docker users must re-run the full `docker run` command as described above.

---

## Third-Party Source Code and Libraries

The following third-party packages and tools were used directly in the development of this software.

### Package Management

| Package | Version | Purpose                              |
| ------- | ------- | ------------------------------------ |
| Nix     | 2.33.2  | Reproducible environment management  |
| npm     | 10.8.2  | JavaScript package management        |

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
| canvas-confetti             | 1.9.4   | Confetti animation support                 |
| framer-motion               | 12.34.0 | Web animation library                      |

### Backend Dependencies

| Package             | Version | Purpose                                         |
| ------------------- | ------- | ----------------------------------------------- |
| Django              | 5.2.0   | Web framework                                   |
| faker               | 40.4.0  | Fake data generation for database seeding       |
| djangorestframework | 3.16.1  | REST API framework for Django                   |
| psycopg             | 3.3.2   | PostgreSQL driver (async-capable core)          |
| psycopg-binary      | 3.3.2   | Precompiled psycopg binaries for local/dev use  |
| asgiref             | 3.11.1  | ASGI utilities used by Django                   |
| sqlparse            | 0.5.5   | SQL parsing and formatting (used by Django ORM) |
| virtualenv          | 20.36.1 | Isolated Python environment creation            |
| distlib             | 0.4.0   | Dependency utility library (virtualenv backend) |
| filelock            | 3.20.1  | Cross-platform file locking                     |
| platformdirs        | 4.5.0   | OS-specific directory resolution                |

---

## Use of AI Assistance

This project made use of AI tools in the following capacities:

- **Conceptual understanding:** AI tools were used to help the team understand and explain technical concepts, particularly when learning and navigating the React ecosystem for the first time.
- **GitHub Copilot (via GitHub Student Developer Pack):** Used throughout development to receive real-time feedback on code quality, suggest new features, and support the team in writing and improving code incrementally.
- **Testing support:** AI assistance was used to aid in the planning and writing of tests, helping to identify edge cases and improve overall test coverage.

All AI-assisted contributions were reviewed, understood, and integrated by members of the team. No AI-generated code was incorporated without verification.
