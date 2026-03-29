# StudyFlax — Backend

Django REST Framework backend for StudyFlax. See the [root README](../../README.md) for full installation instructions, access credentials, and project overview.

## Tech Stack

- **Django 5.2** — web framework
- **Django REST Framework 3.16** — REST API layer
- **PostgreSQL** — primary database (via psycopg 3)
- **Gunicorn** — production WSGI server

## Development

Activate the virtual environment created by the Nix flake, then from the `backend/` directory:

```bash
python manage.py migrate          # apply database migrations
python manage.py runserver        # starts the API server (defaults to http://127.0.0.1:8000)
python manage.py seed             # seed the database with fixture data
python manage.py unseed           # clear seeded data before reseeding
```

The Django admin panel is available at `/admin/` on your local backend URL when signed in as `johndoe`.

## Testing

```bash
python manage.py test             # run all backend tests
coverage run manage.py test       # run tests with coverage
coverage report                   # print coverage summary
```

## Structure

```
backend/
├── Flax10/          # Django project settings, root URLs, WSGI/ASGI config
└── studyFlax/       # Main application
    ├── models/      # Database models
    ├── views/       # API views (grouped by domain)
    ├── serialisers/ # DRF serialisers
    ├── urls/        # URL routing (grouped by domain)
    ├── tests/       # Backend test suites
    ├── fixtures/    # Seed data
    ├── management/  # Custom Django management commands
    ├── signals/     # Django signals
    ├── templates/   # Django-rendered templates used by backend flows
    └── utils/       # Shared utility functions
```

## API Surface

All application endpoints are mounted under `/api/`.

Common areas include:

- authentication under `/api/auth/`
- profile, settings, onboarding, and user search endpoints under `/api/`
- calendar, attendance, tags, categories, and timetable endpoints under `/api/`
- modules, enrolments, readings, deadlines, and tasks under `/api/`
- group work endpoints under `/api/group-work/`
- notifications and schedules under `/api/`
- societies under `/api/societies/`
- analytics under `/api/analytics/`
- admin tools under `/api/admin/`
