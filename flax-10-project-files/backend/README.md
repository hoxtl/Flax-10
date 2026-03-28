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
python manage.py runserver        # starts API server on http://localhost:8000
python manage.py seed_db          # seed the database with fixture data
```

The Django admin panel is available at http://localhost:8000/admin/ when signed in as `johndoe`.

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
    ├── signals/     # Django signals
    └── utils/       # Shared utility functions
```

## API Domains

| Domain         | Path prefix              |
| -------------- | ------------------------ |
| Authentication | `/api/auth/`             |
| Calendar       | `/api/calendar/`         |
| Tasks          | `/api/tasks/`            |
| Modules        | `/api/modules/`          |
| Timer          | `/api/timer/`            |
| Analytics      | `/api/analytics/`        |
| Social         | `/api/social/`           |
| Group Work     | `/api/groupwork/`        |
| Society        | `/api/society/`          |
| Notifications  | `/api/notifications/`    |
| Settings       | `/api/settings/`         |
| Admin          | `/api/admin/`            |
